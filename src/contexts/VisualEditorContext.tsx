import React, { createContext, useContext, useState, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { useAutoSave } from '@/hooks/useAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type EditorMode = 'image' | 'video';

export interface EditorProject {
  id: string;
  name: string;
  type: EditorMode;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  type: 'image' | 'video';
  platform: string;
  thumbnail_url?: string;
  template_json: any;
  created_at: string;
}

interface VisualEditorContextType {
  // Mode and project management
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  currentProject: EditorProject | null;
  setCurrentProject: (project: EditorProject | null) => void;
  
  // Canvas state (for image editing)
  fabricCanvas: FabricCanvas | null;
  setFabricCanvas: (canvas: FabricCanvas | null) => void;
  
  // Video state
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  
  // UI state
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // File management
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  
  // Template system
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  loadTemplate: (template: Template) => void;
  fetchTemplates: () => Promise<void>;
  
  // Actions
  saveProject: () => void;
  exportProject: (format: string) => void;
  clearCanvas: () => void;
}

const VisualEditorContext = createContext<VisualEditorContextType | undefined>(undefined);

export const useVisualEditor = () => {
  const context = useContext(VisualEditorContext);
  if (!context) {
    throw new Error('useVisualEditor must be used within a VisualEditorProvider');
  }
  return context;
};

export const VisualEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<EditorMode>('image');
  const [currentProject, setCurrentProject] = useState<EditorProject | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTool, setSelectedTool] = useState('select');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Auto-save functionality
  const projectData = {
    mode,
    currentProject,
    videoUrl,
    selectedTool,
    canvasData: fabricCanvas ? fabricCanvas.toJSON() : null,
  };

  const handleAutoSave = (data: any) => {
    // Save to localStorage or send to server
    console.log('Auto-saving project:', data);
  };

  const { restoreFromAutoSave, clearAutoSave } = useAutoSave(
    projectData,
    handleAutoSave,
    { 
      key: 'visual-editor-project',
      delay: 3000,
      enabled: true 
    }
  );

  // Template functions
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type cast the data to match our Template interface
      const templatesData = (data || []).map(template => ({
        ...template,
        type: template.type as 'image' | 'video'
      }));
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error loading templates",
        description: "Could not load templates from database",
        variant: "destructive",
      });
    }
  };

  const loadTemplate = async (template: Template) => {
    try {
      if (template.type === 'image' && fabricCanvas) {
        // Set canvas dimensions and background
        if (template.template_json.width && template.template_json.height) {
          fabricCanvas.setWidth(template.template_json.width);
          fabricCanvas.setHeight(template.template_json.height);
          fabricCanvas.setZoom(1);
        }
        
        if (template.template_json.background) {
          fabricCanvas.backgroundColor = template.template_json.background;
        }
        
        // Load canvas data
        await fabricCanvas.loadFromJSON(template.template_json);
        fabricCanvas.renderAll();
        
        toast({
          title: "Template loaded",
          description: `Successfully loaded ${template.name}`,
        });
      } else if (template.type === 'video') {
        // Handle video template loading
        const config = template.template_json;
        
        // Set video configuration
        if (config.width && config.height) {
          // Update project with template settings
          setCurrentProject(prev => prev ? {
            ...prev,
            name: template.name,
            type: 'video'
          } : null);
        }
        
        toast({
          title: "Video template loaded",
          description: `Successfully loaded ${template.name}`,
        });
      }
      
      // Update mode if different
      if (template.type !== mode) {
        setMode(template.type);
      }
      
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error loading template",
        description: "Could not load the selected template",
        variant: "destructive",
      });
    }
  };

  const saveProject = () => {
    try {
      if (fabricCanvas && mode === 'image') {
        const canvasData = fabricCanvas.toJSON();
        const projectToSave = {
          ...currentProject,
          data: canvasData,
          updatedAt: new Date(),
        };
        
        localStorage.setItem('current-visual-project', JSON.stringify(projectToSave));
        toast({
          title: "Project saved",
          description: "Your project has been saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save your project",
        variant: "destructive",
      });
    }
  };

  const exportProject = (format: string) => {
    try {
      if (mode === 'image' && fabricCanvas) {
        if (format === 'png' || format === 'jpeg') {
          const dataURL = fabricCanvas.toDataURL({
            format: format as 'png' | 'jpeg',
            quality: 1,
            multiplier: 2, // Higher resolution export
          });
          
          // Create download link
          const link = document.createElement('a');
          link.download = `visual-editor-export-${Date.now()}.${format}`;
          link.href = dataURL;
          link.click();
          
          toast({
            title: "Export successful",
            description: `Your ${format.toUpperCase()} has been exported`,
          });
        }
      } else if (mode === 'video') {
        toast({
          title: "Video export",
          description: "Video export functionality coming soon",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export your project",
        variant: "destructive",
      });
    }
  };

  const clearCanvas = () => {
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
      toast({
        title: "Canvas cleared",
        description: "All objects have been removed",
      });
    }
  };

  const value: VisualEditorContextType = {
    mode,
    setMode,
    currentProject,
    setCurrentProject,
    fabricCanvas,
    setFabricCanvas,
    videoUrl,
    setVideoUrl,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    selectedTool,
    setSelectedTool,
    sidebarOpen,
    setSidebarOpen,
    uploadedFiles,
    setUploadedFiles,
    templates,
    setTemplates,
    loadTemplate,
    fetchTemplates,
    saveProject,
    exportProject,
    clearCanvas,
  };

  return (
    <VisualEditorContext.Provider value={value}>
      {children}
    </VisualEditorContext.Provider>
  );
};