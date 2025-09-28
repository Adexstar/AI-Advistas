import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, 
  Type, 
  Square, 
  Circle, 
  Image, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut,
  Download,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2
} from 'lucide-react';

export const EnhancedToolbar: React.FC = () => {
  const { 
    selectedTool, 
    setSelectedTool, 
    fabricCanvas, 
    selectedObject,
    canvasZoom,
    setCanvasZoom,
    googleFonts,
    exportProject
  } = useVisualEditor();

  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (!fabricCanvas) return;
    
    let newZoom = canvasZoom;
    
    if (direction === 'in') {
      newZoom = Math.min(canvasZoom * 1.1, 3);
    } else if (direction === 'out') {
      newZoom = Math.max(canvasZoom * 0.9, 0.1);
    } else if (direction === 'fit') {
      newZoom = 1;
    }
    
    fabricCanvas.setZoom(newZoom);
    setCanvasZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const updateTextProperty = (property: string, value: any) => {
    if (selectedObject && fabricCanvas) {
      selectedObject.set(property, value);
      fabricCanvas.renderAll();
    }
  };

  const isTextSelected = selectedObject?.type === 'textbox' || selectedObject?.type === 'text';

  return (
    <div className="h-12 bg-background border-b flex items-center px-4 gap-2 overflow-x-auto">
      {/* Selection Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={selectedTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('select')}
          className="h-8"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedTool === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('text')}
          className="h-8"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedTool === 'rectangle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('rectangle')}
          className="h-8"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedTool === 'circle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('circle')}
          className="h-8"
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedTool === 'image' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTool('image')}
          className="h-8"
        >
          <Image className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting (shown when text is selected) */}
      {isTextSelected && (
        <>
          <div className="flex items-center gap-1">
            <Select
              value={selectedObject.fontFamily || 'Inter'}
              onValueChange={(value) => updateTextProperty('fontFamily', value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {googleFonts.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedObject.fontSize?.toString() || '16'}
              onValueChange={(value) => updateTextProperty('fontSize', parseInt(value))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={selectedObject.fontWeight === 'bold' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateTextProperty('fontWeight', 
                selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              variant={selectedObject.fontStyle === 'italic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateTextProperty('fontStyle', 
                selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>

            <Button
              variant={selectedObject.underline ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateTextProperty('underline', !selectedObject.underline)}
              className="h-8 w-8 p-0"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1">
            <Button
              variant={selectedObject.textAlign === 'left' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateTextProperty('textAlign', 'left')}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedObject.textAlign === 'center' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateTextProperty('textAlign', 'center')}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedObject.textAlign === 'right' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateTextProperty('textAlign', 'right')}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* History Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Object Actions (shown when object is selected) */}
      {selectedObject && (
        <>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (fabricCanvas && selectedObject) {
                  const cloned = selectedObject.clone();
                  cloned.set({
                    left: selectedObject.left + 10,
                    top: selectedObject.top + 10,
                  });
                  fabricCanvas.add(cloned);
                  fabricCanvas.renderAll();
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (fabricCanvas && selectedObject) {
                  fabricCanvas.remove(selectedObject);
                  fabricCanvas.renderAll();
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleZoom('out')}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs px-2 py-1 bg-muted rounded">
          {Math.round(canvasZoom * 100)}%
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleZoom('in')}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleZoom('fit')}
          className="h-8 text-xs px-2"
        >
          Fit
        </Button>
      </div>

      <div className="flex-1" />

      {/* Export */}
      <Button 
        size="sm" 
        onClick={() => exportProject('png')}
        className="h-8"
      >
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  );
};