import React, { createContext, useContext, useState, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { useAutoSave } from '@/hooks/useAutoSave';
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
        if (format === 'png') {
          const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2,
          });
          
          // Create download link
          const link = document.createElement('a');
          link.download = `visual-editor-export-${Date.now()}.png`;
          link.href = dataURL;
          link.click();
          
          toast({
            title: "Export successful",
            description: "Your image has been exported",
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