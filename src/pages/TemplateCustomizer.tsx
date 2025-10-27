import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, ArrowLeft, Upload } from 'lucide-react';
import { EditorCanvas } from '@/components/visual-editor/EditorCanvas';
import { PlatformPreviews } from '@/components/ad/PlatformPreviews';
import { detectEditableFields } from '@/utils/canvasHelpers';
import { toast } from 'sonner';
import { Textbox, FabricImage } from 'fabric';

const TemplateCustomizer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fabricCanvas, setFabricCanvas, exportProject } = useVisualEditor();
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [editableFields, setEditableFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  
  const templateData = location.state?.templateData;
  
  useEffect(() => {
    if (!templateData) {
      toast.error('No template selected');
      navigate('/create');
      return;
    }

    if (templateData.canvas_data && fabricCanvas) {
      fabricCanvas.loadFromJSON(templateData.canvas_data, () => {
        fabricCanvas.renderAll();
        
        const fields = detectEditableFields(templateData.canvas_data);
        setEditableFields(fields);
        
        const initialValues: Record<string, string> = {};
        fields.forEach((field: any) => {
          if (field.type === 'text') {
            const objects = fabricCanvas.getObjects();
            const obj = objects[field.objectIndex];
            if (obj && 'text' in obj) {
              initialValues[field.path] = obj.text as string;
            }
          }
        });
        setFieldValues(initialValues);
      });
    } else if (fabricCanvas) {
      const defaultCanvas = {
        version: '6.0.0',
        objects: [
          {
            type: 'textbox',
            text: templateData.product || 'Your Product Name',
            left: 50,
            top: 50,
            fontSize: 32,
            fontFamily: 'Inter',
            fill: '#000000',
            width: 700
          },
          {
            type: 'textbox',
            text: templateData.details || 'Add your product details here',
            left: 50,
            top: 120,
            fontSize: 16,
            fontFamily: 'Inter',
            fill: '#666666',
            width: 700
          }
        ],
        background: '#ffffff'
      };
      
      fabricCanvas.loadFromJSON(defaultCanvas, () => {
        fabricCanvas.renderAll();
        const fields = detectEditableFields(defaultCanvas);
        setEditableFields(fields);
      });
    }
  }, [templateData, fabricCanvas, navigate]);

  const updateCanvasObject = (objectIndex: number, property: string, value: any) => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    const targetObject = objects[objectIndex];
    
    if (targetObject) {
      targetObject.set(property, value);
      fabricCanvas.renderAll();
    }
  };

  const handleFieldChange = (field: any, value: string) => {
    setFieldValues(prev => ({ ...prev, [field.path]: value }));
    updateCanvasObject(field.objectIndex, 'text', value);
  };

  const handleImageUpload = async (field: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      FabricImage.fromURL(imgUrl).then((img) => {
        const objects = fabricCanvas.getObjects();
        const targetObject = objects[field.objectIndex];
        
        if (targetObject) {
          img.set({
            left: targetObject.left,
            top: targetObject.top,
            scaleX: (targetObject.width || 100) / (img.width || 1),
            scaleY: (targetObject.height || 100) / (img.height || 1)
          });
          fabricCanvas.remove(targetObject);
          fabricCanvas.add(img);
          fabricCanvas.renderAll();
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    try {
      await exportProject('png');
      toast.success('Ad exported successfully!');
    } catch (error) {
      toast.error('Failed to export ad');
    }
  };

  if (!templateData) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/create')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">{templateData.templateName || 'Customize Template'}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Customize Content</h2>
          
          <div className="space-y-4">
            {editableFields.map((field, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                {field.type === 'text' && (
                  <Input
                    value={fieldValues[field.path] || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full"
                  />
                )}
                {field.type === 'image' && (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(field, e)}
                      className="w-full"
                    />
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {editableFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Click on elements in the canvas to customize them directly.
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-muted/10">
          <EditorCanvas />
        </div>

        <div className="w-96 border-l bg-card p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Platform Preview</h2>
          <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="facebook">FB</TabsTrigger>
              <TabsTrigger value="instagram">IG</TabsTrigger>
              <TabsTrigger value="tiktok">TT</TabsTrigger>
              <TabsTrigger value="google">GG</TabsTrigger>
            </TabsList>
            
            <TabsContent value="facebook">
              <PlatformPreviews canvas={fabricCanvas} platform="facebook" />
            </TabsContent>
            <TabsContent value="instagram">
              <PlatformPreviews canvas={fabricCanvas} platform="instagram" />
            </TabsContent>
            <TabsContent value="tiktok">
              <PlatformPreviews canvas={fabricCanvas} platform="tiktok" />
            </TabsContent>
            <TabsContent value="google">
              <PlatformPreviews canvas={fabricCanvas} platform="google" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer;
