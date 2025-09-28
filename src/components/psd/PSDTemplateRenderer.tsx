import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricText, FabricImage, Rect } from 'fabric';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProcessedPSDData, PSDLayer } from '@/hooks/usePSDProcessor';
import { toast } from 'sonner';

interface PSDTemplateRendererProps {
  psdData: ProcessedPSDData;
  onLayerUpdate?: (layerId: string, content: string) => void;
  editable?: boolean;
}

export const PSDTemplateRenderer: React.FC<PSDTemplateRendererProps> = ({
  psdData,
  onLayerUpdate,
  editable = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !psdData) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: psdData.canvas.width,
      height: psdData.canvas.height,
      backgroundColor: '#ffffff',
    });

    setFabricCanvas(canvas);
    renderPSDLayers(canvas, psdData.layers);

    // Handle object selection
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0];
      if (activeObject && (activeObject as any).layerId) {
        setSelectedLayer((activeObject as any).layerId);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedLayer(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [psdData]);

  const renderPSDLayers = (canvas: FabricCanvas, layers: PSDLayer[]) => {
    layers.forEach((layer) => {
      if (!layer.visible) return;

      switch (layer.type) {
        case 'text':
          renderTextLayer(canvas, layer);
          break;
        case 'image':
          renderImageLayer(canvas, layer);
          break;
        case 'shape':
          renderShapeLayer(canvas, layer);
          break;
      }
    });
  };

  const renderTextLayer = (canvas: FabricCanvas, layer: PSDLayer) => {
    const text = new FabricText(layer.content || '', {
      left: layer.bounds.x,
      top: layer.bounds.y,
      width: layer.bounds.width,
      fontSize: layer.style?.size || 16,
      fontFamily: layer.style?.font || 'Arial',
      fill: layer.style?.color || '#000000',
      editable: editable,
    });

    // Store layer data as properties
    (text as any).layerId = layer.id;
    (text as any).layerName = layer.name;

    // Handle text changes
    text.on('modified', () => {
      if (onLayerUpdate) {
        onLayerUpdate(layer.id, text.text || '');
      }
    });

    canvas.add(text);
  };

  const renderImageLayer = (canvas: FabricCanvas, layer: PSDLayer) => {
    // Create placeholder rectangle for image layers
    const placeholder = new Rect({
      left: layer.bounds.x,
      top: layer.bounds.y,
      width: layer.bounds.width,
      height: layer.bounds.height,
      fill: '#f0f0f0',
      stroke: '#cccccc',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
    });

    // Store layer data as properties
    (placeholder as any).layerId = layer.id;
    (placeholder as any).layerName = layer.name;

    canvas.add(placeholder);
  };

  const renderShapeLayer = (canvas: FabricCanvas, layer: PSDLayer) => {
    const shape = new Rect({
      left: layer.bounds.x,
      top: layer.bounds.y,
      width: layer.bounds.width,
      height: layer.bounds.height,
      fill: layer.style?.color || '#007bff',
    });

    // Store layer data as properties
    (shape as any).layerId = layer.id;
    (shape as any).layerName = layer.name;

    canvas.add(shape);
  };

  const handleExportCanvas = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });

    // Create download link
    const link = document.createElement('a');
    link.download = 'psd-template.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template exported successfully!');
  };

  const handleResetLayer = () => {
    if (!selectedLayer || !fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject instanceof FabricText) {
      const originalLayer = psdData.layers.find(l => l.id === selectedLayer);
      if (originalLayer) {
        activeObject.set('text', originalLayer.content || '');
        fabricCanvas.renderAll();
        toast.success('Layer reset to original content');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">PSD Template Editor</h3>
        <div className="flex gap-2">
          {selectedLayer && (
            <Button variant="outline" size="sm" onClick={handleResetLayer}>
              Reset Layer
            </Button>
          )}
          <Button onClick={handleExportCanvas} size="sm">
            Export
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef} 
            className="border border-border max-w-full max-h-[600px] object-contain"
          />
        </div>
      </Card>

      {selectedLayer && (
        <Card className="p-4">
          <h4 className="font-medium mb-2">Selected Layer</h4>
          <p className="text-sm text-muted-foreground">
            {psdData.layers.find(l => l.id === selectedLayer)?.name}
          </p>
        </Card>
      )}
    </div>
  );
};