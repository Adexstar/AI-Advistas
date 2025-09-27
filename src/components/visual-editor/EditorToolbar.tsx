import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer, 
  Type, 
  Square, 
  Circle, 
  Image, 
  Upload,
  Palette,
  Trash2,
  Undo,
  Redo,
  Play,
  Pause,
  Split,
  Volume2
} from 'lucide-react';

export const EditorToolbar: React.FC = () => {
  const { 
    mode, 
    selectedTool, 
    setSelectedTool, 
    fabricCanvas,
    isPlaying,
    setIsPlaying,
    setVideoUrl,
    clearCanvas
  } = useVisualEditor();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      if (mode === 'image' && fabricCanvas && file.type.startsWith('image/')) {
        import('fabric').then(({ FabricImage }) => {
          const imgElement = document.createElement('img');
          imgElement.onload = () => {
            FabricImage.fromURL(result).then((img) => {
              // Scale image to fit canvas if too large
              const canvasWidth = fabricCanvas.getWidth();
              const canvasHeight = fabricCanvas.getHeight();
              const imgWidth = img.width || 0;
              const imgHeight = img.height || 0;
              
              const scaleX = Math.min(canvasWidth / imgWidth, 1);
              const scaleY = Math.min(canvasHeight / imgHeight, 1);
              const scale = Math.min(scaleX, scaleY);
              
              img.scale(scale);
              img.set({
                left: (canvasWidth - imgWidth * scale) / 2,
                top: (canvasHeight - imgHeight * scale) / 2,
              });
              
              fabricCanvas.add(img);
              fabricCanvas.renderAll();
            });
          };
          imgElement.src = result;
        });
      } else if (mode === 'video' && file.type.startsWith('video/')) {
        // Handle video upload
        setVideoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (mode === 'image') {
    return (
      <div className="h-12 bg-background border-b flex items-center px-4 gap-2">
        <Button
          variant={selectedTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('select')}
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button
          variant={selectedTool === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('text')}
        >
          <Type className="h-4 w-4 mr-1" />
          Add Text
        </Button>
        
        <Button
          variant={selectedTool === 'rectangle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('rectangle')}
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'circle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('circle')}
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="ghost" size="sm" asChild>
            <span>
              <Upload className="h-4 w-4 mr-1" />
              Import Image
            </span>
          </Button>
        </label>
        
        <Button
          variant={selectedTool === 'background' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('background')}
        >
          <Palette className="h-4 w-4 mr-1" />
          Background
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button variant="ghost" size="sm">
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm">
          <Redo className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" onClick={clearCanvas}>
          <Trash2 className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>
    );
  }

  // Video mode toolbar
  return (
    <div className="h-12 bg-background border-b flex items-center px-4 gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <label className="cursor-pointer">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button variant="ghost" size="sm" asChild>
          <span>
            <Upload className="h-4 w-4 mr-1" />
            Import Video
          </span>
        </Button>
      </label>
      
      <Button variant="ghost" size="sm">
        <Split className="h-4 w-4 mr-1" />
        Split
      </Button>
      
      <Button variant="ghost" size="sm">
        <Volume2 className="h-4 w-4 mr-1" />
        Volume
      </Button>
      
      <Button variant="ghost" size="sm">
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    </div>
  );
};