import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Type, 
  Palette, 
  Move, 
  RotateCw, 
  Eye, 
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const { selectedObject, fabricCanvas, googleFonts } = useVisualEditor();

  const updateObjectProperty = (property: string, value: any) => {
    if (selectedObject && fabricCanvas) {
      selectedObject.set(property, value);
      fabricCanvas.renderAll();
    }
  };

  const isTextObject = selectedObject?.type === 'textbox' || selectedObject?.type === 'text';

  if (!selectedObject) {
    return (
      <div className="h-full bg-background border-l p-4">
        <div className="text-center text-muted-foreground mt-8">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background border-l flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Type className="h-4 w-4" />
          Properties
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Position & Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Move className="h-4 w-4" />
                Position & Size
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedObject.left || 0)}
                    onChange={(e) => updateObjectProperty('left', parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedObject.top || 0)}
                    onChange={(e) => updateObjectProperty('top', parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedObject.width * (selectedObject.scaleX || 1))}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value);
                      const scaleX = newWidth / selectedObject.width;
                      updateObjectProperty('scaleX', scaleX);
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedObject.height * (selectedObject.scaleY || 1))}
                    onChange={(e) => {
                      const newHeight = parseInt(e.target.value);
                      const scaleY = newHeight / selectedObject.height;
                      updateObjectProperty('scaleY', scaleY);
                    }}
                    className="h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rotation & Opacity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Transform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Rotation</Label>
                <Slider
                  value={[selectedObject.angle || 0]}
                  onValueChange={([value]) => updateObjectProperty('angle', value)}
                  max={360}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(selectedObject.angle || 0)}°
                </div>
              </div>
              <div>
                <Label className="text-xs">Opacity</Label>
                <Slider
                  value={[selectedObject.opacity * 100 || 100]}
                  onValueChange={([value]) => updateObjectProperty('opacity', value / 100)}
                  max={100}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((selectedObject.opacity || 1) * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Properties (only for text objects) */}
          {isTextObject && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Font Family</Label>
                  <Select
                    value={selectedObject.fontFamily || 'Inter'}
                    onValueChange={(value) => updateObjectProperty('fontFamily', value)}
                  >
                    <SelectTrigger className="h-8">
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
                </div>

                <div>
                  <Label className="text-xs">Font Size</Label>
                  <Input
                    type="number"
                    value={selectedObject.fontSize || 20}
                    onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs">Text Color</Label>
                  <Input
                    type="color"
                    value={selectedObject.fill || '#000000'}
                    onChange={(e) => updateObjectProperty('fill', e.target.value)}
                    className="h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs">Text Style</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={selectedObject.fontWeight === 'bold' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateObjectProperty('fontWeight', 
                        selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className="h-8 w-8 p-0"
                    >
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedObject.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateObjectProperty('fontStyle', 
                        selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}
                      className="h-8 w-8 p-0"
                    >
                      <Italic className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedObject.underline ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateObjectProperty('underline', !selectedObject.underline)}
                      className="h-8 w-8 p-0"
                    >
                      <Underline className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Text Alignment</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={selectedObject.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateObjectProperty('textAlign', 'left')}
                      className="h-8 w-8 p-0"
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedObject.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateObjectProperty('textAlign', 'center')}
                      className="h-8 w-8 p-0"
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedObject.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateObjectProperty('textAlign', 'right')}
                      className="h-8 w-8 p-0"
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fill & Stroke (for shapes) */}
          {!isTextObject && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Fill Color</Label>
                  <Input
                    type="color"
                    value={selectedObject.fill || '#3B82F6'}
                    onChange={(e) => updateObjectProperty('fill', e.target.value)}
                    className="h-8"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Stroke Color</Label>
                  <Input
                    type="color"
                    value={selectedObject.stroke || '#000000'}
                    onChange={(e) => updateObjectProperty('stroke', e.target.value)}
                    className="h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs">Stroke Width</Label>
                  <Input
                    type="number"
                    value={selectedObject.strokeWidth || 0}
                    onChange={(e) => updateObjectProperty('strokeWidth', parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layer Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Layer Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (fabricCanvas && selectedObject) {
                    selectedObject.bringToFront();
                    fabricCanvas.renderAll();
                  }
                }}
                className="w-full"
              >
                Bring to Front
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (fabricCanvas && selectedObject) {
                    selectedObject.sendToBack();
                    fabricCanvas.renderAll();
                  }
                }}
                className="w-full"
              >
                Send to Back
              </Button>
              <Button
                variant="outline"
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
                className="w-full"
              >
                Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (fabricCanvas && selectedObject) {
                    fabricCanvas.remove(selectedObject);
                    fabricCanvas.renderAll();
                  }
                }}
                className="w-full"
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};