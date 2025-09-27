import React, { useEffect, useRef } from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Canvas as FabricCanvas, Rect, Circle, Textbox } from 'fabric';

export const EditorCanvas: React.FC = () => {
  const { 
    mode, 
    fabricCanvas, 
    setFabricCanvas, 
    selectedTool,
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

      canvas.on('mouse:down', (e) => {
        if (selectedTool === 'text') {
          const pointer = canvas.getPointer(e.e);
          const text = new Textbox('New Text', {
            left: pointer.x,
            top: pointer.y,
            width: 200,
            fontSize: 20,
            fill: '#000000',
          });
          canvas.add(text);
          canvas.setActiveObject(text);
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
        } else if (selectedTool === 'circle') {
          const pointer = canvas.getPointer(e.e);
          const circle = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 50,
            fill: '#EF4444',
          });
          canvas.add(circle);
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
      <div className="h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full max-h-full" />
        </div>
      </div>
    );
  }

  // Video mode
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="relative bg-black rounded-lg overflow-hidden max-w-4xl w-full">
        {videoUrl ? (
          <video
            ref={playerRef}
            src={videoUrl}
            className="w-full h-96 rounded-lg"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-muted text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p>Import a video to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};