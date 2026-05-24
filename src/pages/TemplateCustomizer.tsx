import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, ArrowLeft, Upload, ChevronDown, Smartphone, Monitor, Type, Image as ImageIcon, Palette } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditorCanvas } from '@/components/visual-editor/EditorCanvas';
import { PlatformPreviews } from '@/components/ad/PlatformPreviews';
import { detectEditableFields } from '@/utils/canvasHelpers';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textbox, FabricImage } from 'fabric';

const TemplateCustomizer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fabricCanvas, setFabricCanvas, exportProject } = useVisualEditor();
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [editableFields, setEditableFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Refs for auto-focusing inputs
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  
  const templateData = location.state?.templateData;
  
  // Map object indices to field paths for quick lookup
  const objectToFieldMap = useMemo(() => {
    const map = new Map<number, any>();
    editableFields.forEach(field => {
      map.set(field.objectIndex, field);
    });
    return map;
  }, [editableFields]);

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

  // Canvas selection handler - when user clicks on canvas object
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleSelection = (e: any) => {
      const activeObject = e.selected?.[0];
      if (!activeObject) return;

      const objects = fabricCanvas.getObjects();
      const objectIndex = objects.indexOf(activeObject);
      const field = objectToFieldMap.get(objectIndex);

      if (field) {
        setActiveField(field.path);
        
        // Auto-focus and scroll to the corresponding input
        setTimeout(() => {
          const inputRef = inputRefs.current[field.path];
          if (inputRef) {
            inputRef.focus();
            inputRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    };

    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', () => setActiveField(null));

    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared');
    };
  }, [fabricCanvas, objectToFieldMap]);

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

  const handleFieldFocus = (fieldPath: string) => {
    setActiveField(fieldPath);
  };

  const getCardFocusClass = (fieldPath: string) => {
    return activeField === fieldPath ? 'ring-2 ring-primary ring-offset-2' : '';
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

  const handleExport = async (format: 'png' | 'jpeg' | 'pdf' | 'mp4') => {
    try {
      await exportProject(format);
      if (format !== 'mp4') {
        toast.success(`Ad exported as ${format.toUpperCase()} successfully!`);
      }
    } catch (error) {
      toast.error('Failed to export ad');
    }
  };

  if (!templateData) {
    return null;
  }

  const customizationPanel = (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-muted/30 pb-3">
        <CardTitle className="text-lg">Customize Your Ad</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Click text on the canvas or edit here.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {editableFields.some((field) => field.type === 'text') && (
          <Card className={`transition-all duration-200 ${editableFields.filter((field) => field.type === 'text').some((field) => activeField === field.path) ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base text-primary">
                <Type className="mr-2 h-4 w-4" />
                Text Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editableFields.filter((field) => field.type === 'text').map((field, index) => (
                <div key={index} className="space-y-1.5">
                  <Label htmlFor={field.path} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  {field.label.toLowerCase().includes('text 2') || field.label.toLowerCase().includes('details') || field.label.toLowerCase().includes('body') ? (
                    <Textarea
                      id={field.path}
                      ref={(element) => (inputRefs.current[field.path] = element)}
                      value={fieldValues[field.path] || ''}
                      onChange={(event) => handleFieldChange(field, event.target.value)}
                      onFocus={() => handleFieldFocus(field.path)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      rows={3}
                      className={`transition-all ${activeField === field.path ? 'ring-1 ring-primary' : ''}`}
                    />
                  ) : (
                    <Input
                      id={field.path}
                      ref={(element) => (inputRefs.current[field.path] = element)}
                      value={fieldValues[field.path] || ''}
                      onChange={(event) => handleFieldChange(field, event.target.value)}
                      onFocus={() => handleFieldFocus(field.path)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className={`transition-all ${activeField === field.path ? 'ring-1 ring-primary' : ''}`}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {editableFields.some((field) => field.type === 'image') && (
          <Card className={`transition-all duration-200 ${editableFields.filter((field) => field.type === 'image').some((field) => activeField === field.path) ? 'ring-2 ring-secondary ring-offset-2' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base text-secondary">
                <ImageIcon className="mr-2 h-4 w-4" />
                Media & Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editableFields.filter((field) => field.type === 'image').map((field, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageUpload(field, event)}
                    onFocus={() => handleFieldFocus(field.path)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.querySelector<HTMLInputElement>(`input[type="file"]`)?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {editableFields.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Click on elements in the canvas to start editing.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );

  const visualEditorPanel = (
    <Card className="flex min-h-[420px] flex-col shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b pb-3">
        <CardTitle className="text-lg">Visual Editor</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={previewDevice === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewDevice('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={previewDevice === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewDevice('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center bg-muted/10 p-3 sm:p-6">
        <div className={previewDevice === 'mobile' ? 'w-full max-w-md min-w-0' : 'w-full max-w-4xl min-w-0'}>
          <EditorCanvas />
        </div>
      </CardContent>
    </Card>
  );

  const platformPreviewPanel = (
    <Card className="shadow-lg">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">Platform Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-secondary/55 p-2 sm:grid-cols-4">
            <TabsTrigger value="facebook" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Facebook</TabsTrigger>
            <TabsTrigger value="instagram" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Instagram</TabsTrigger>
            <TabsTrigger value="tiktok" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">TikTok</TabsTrigger>
            <TabsTrigger value="google" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="facebook" className="mt-0">
            <PlatformPreviews canvas={fabricCanvas} platform="facebook" />
          </TabsContent>
          <TabsContent value="instagram" className="mt-0">
            <PlatformPreviews canvas={fabricCanvas} platform="instagram" />
          </TabsContent>
          <TabsContent value="tiktok" className="mt-0">
            <PlatformPreviews canvas={fabricCanvas} platform="tiktok" />
          </TabsContent>
          <TabsContent value="google" className="mt-0">
            <PlatformPreviews canvas={fabricCanvas} platform="google" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <div className="border-b bg-card/95 backdrop-blur">
        <div className="page-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/create')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="break-words text-lg font-bold leading-tight sm:text-xl">{templateData.templateName || 'Customize Template'}</h1>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('png')}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('jpeg')}>
                Export as JPEG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('mp4')} disabled>
                Export as Video (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden">
        {isMobile ? (
          <div className="page-container py-4">
            <Tabs defaultValue="controls" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-2xl bg-secondary/55 p-2">
                <TabsTrigger value="controls" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Controls</TabsTrigger>
                <TabsTrigger value="canvas" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Canvas</TabsTrigger>
                <TabsTrigger value="preview" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="controls" className="mt-4">
                {customizationPanel}
              </TabsContent>
              <TabsContent value="canvas" className="mt-4">
                {visualEditorPanel}
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                {platformPreviewPanel}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="page-container grid min-h-0 grid-cols-1 gap-6 py-6 lg:grid-cols-5">
            <div className="min-h-0 space-y-4 overflow-y-auto lg:col-span-2">
              {customizationPanel}
            </div>
            <div className="flex min-h-0 flex-col space-y-4 lg:col-span-3">
              {visualEditorPanel}
              {platformPreviewPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCustomizer;
