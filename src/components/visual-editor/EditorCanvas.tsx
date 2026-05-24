import React, { useEffect, useRef } from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Canvas as FabricCanvas, Rect, Circle, Textbox } from 'fabric';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const EditorCanvas: React.FC = () => {
  const { 
    mode, 
    fabricCanvas, 
    setFabricCanvas, 
    selectedTool,
    setSelectedObject,
    videoUrl,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    setDuration
  } = useVisualEditor();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);

  // Initialize Fabric.js canvas for image mode
  useEffect(() => {
    if (mode === 'image' && canvasRef.current && !fabricCanvas) {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });

      // Selection handling
      canvas.on('selection:created', (e) => {
        setSelectedObject(e.selected[0]);
      });

      canvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected[0]);
      });

      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      canvas.on('mouse:down', (e) => {
        if (selectedTool === 'text') {
          const pointer = canvas.getPointer(e.e);
          const text = new Textbox('Add your text here', {
            left: pointer.x,
            top: pointer.y,
            width: 200,
            fontSize: 20,
            fontFamily: 'Inter',
            fill: '#000000',
          });
          canvas.add(text);
          canvas.setActiveObject(text);
          setSelectedObject(text);
        } else if (selectedTool === 'rectangle') {
          const pointer = canvas.getPointer(e.e);
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 100,
            height: 100,
            fill: '#3B82F6',
          });
          canvas.add(rect);
          canvas.setActiveObject(rect);
          setSelectedObject(rect);
        } else if (selectedTool === 'circle') {
          const pointer = canvas.getPointer(e.e);
          const circle = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 50,
            fill: '#EF4444',
          });
          canvas.add(circle);
          canvas.setActiveObject(circle);
          setSelectedObject(circle);
        }
      });

      setFabricCanvas(canvas);

      return () => {
        canvas.dispose();
      };
    }
  }, [mode, fabricCanvas, setFabricCanvas, selectedTool]);

  if (mode === 'image') {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto bg-muted/20 p-3 sm:p-4">
        <Card className="relative w-full max-w-[min(100%,56rem)] bg-white shadow-lg">
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="text-xs">
              Image Editor
            </Badge>
          </div>
          <canvas ref={canvasRef} className="block h-auto max-w-full" />
        </Card>
      </div>
    );
  }

  // Video mode
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto bg-muted/20 p-3 sm:p-4">
      <Card className="relative w-full max-w-[min(100%,64rem)] bg-black">
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="text-xs">
            Video Editor
          </Badge>
        </div>
        {videoUrl ? (
          <video
            ref={playerRef}
            src={videoUrl}
            className="h-auto max-h-[70vh] min-h-[220px] w-full rounded-lg object-contain"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
        ) : (
          <div className="flex min-h-[220px] w-full items-center justify-center rounded-lg bg-muted p-6 text-muted-foreground sm:min-h-[420px]">
            <div className="text-center">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-medium mb-2">Video Editor</p>
              <p className="text-sm">Import a video or select a template to get started</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};