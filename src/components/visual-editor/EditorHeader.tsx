import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Image, 
  Video, 
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EditorHeader: React.FC = () => {
  const { 
    mode, 
    setMode, 
    currentProject, 
    saveProject, 
    exportProject,
    sidebarOpen,
    setSidebarOpen
  } = useVisualEditor();
  
  const navigate = useNavigate();

  const handleExport = () => {
    if (mode === 'image') {
      exportProject('png');
    } else {
      exportProject('mp4');
    }
  };

  return (
    <header className="h-14 bg-background border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        
        <div className="flex items-center gap-2">
          <h1 className="font-semibold">Visual Editor</h1>
          {currentProject && (
            <Badge variant="secondary">{currentProject.name}</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Mode Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={mode === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('image')}
            className="h-8 px-3"
          >
            <Image className="h-4 w-4 mr-1" />
            Image
          </Button>
          <Button
            variant={mode === 'video' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('video')}
            className="h-8 px-3"
          >
            <Video className="h-4 w-4 mr-1" />
            Video
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveProject}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </header>
  );
};