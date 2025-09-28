import React, { useEffect } from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric';
import { 
  Layout, 
  Type, 
  Shapes, 
  Image, 
  Upload, 
  FolderOpen,
  Sparkles,
  Search,
  Plus,
  Square,
  Circle,
  Triangle,
  Star,
  Heart
} from 'lucide-react';

export const MultiTabSidebar: React.FC = () => {
  const { 
    templates, 
    fetchTemplates, 
    loadTemplate, 
    uploadedFiles, 
    setUploadedFiles,
    addTextElement,
    addShapeElement,
    fabricCanvas,
    googleFonts
  } = useVisualEditor();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            if (fabricCanvas) {
              const fabricImage = new FabricImage(img, {
                left: 100,
                top: 100,
                scaleX: 0.5,
                scaleY: 0.5,
              });
              fabricCanvas.add(fabricImage);
              fabricCanvas.renderAll();
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const textPresets = [
    { label: 'Add a heading', style: { fontSize: 32, fontWeight: 'bold' } },
    { label: 'Add a subheading', style: { fontSize: 24, fontWeight: '600' } },
    { label: 'Add body text', style: { fontSize: 16, fontWeight: 'normal' } },
    { label: 'Add a title', style: { fontSize: 40, fontWeight: 'bold' } },
  ];

  const shapes = [
    { name: 'Rectangle', icon: Square, type: 'rectangle' },
    { name: 'Circle', icon: Circle, type: 'circle' },
    { name: 'Triangle', icon: Triangle, type: 'triangle' },
    { name: 'Star', icon: Star, type: 'star' },
    { name: 'Heart', icon: Heart, type: 'heart' },
  ];

  return (
    <div className="h-full bg-background border-r">
      <Tabs defaultValue="templates" className="h-full flex flex-col">
        <div className="p-3 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="text-xs">
              <Layout className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="text" className="text-xs">
              <Type className="h-3 w-3 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="elements" className="text-xs">
              <Shapes className="h-3 w-3 mr-1" />
              Elements
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mt-2">
            <TabsTrigger value="photos" className="text-xs">
              <Image className="h-3 w-3 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="uploads" className="text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Uploads
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs">
              <FolderOpen className="h-3 w-3 mr-1" />
              Projects
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="templates" className="h-full m-0">
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  className="pl-8 h-9"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 pt-0">
                {templates.length === 0 ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-2" onClick={() => loadTemplate(template)}>
                          <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                            {template.preview_url ? (
                              <img 
                                src={template.preview_url} 
                                alt={template.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Layout className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-xs font-medium truncate">
                            {template.name}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="text" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                <div className="space-y-2">
                  {textPresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => addTextElement(preset.label, preset.style)}
                    >
                      <div className="text-left">
                        <div 
                          className="font-medium"
                          style={{ 
                            fontSize: Math.min(preset.style.fontSize / 2, 16),
                            fontWeight: preset.style.fontWeight 
                          }}
                        >
                          {preset.label}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Font Combinations</h4>
                  <div className="space-y-2">
                    {googleFonts.slice(0, 5).map((font) => (
                      <Button
                        key={font}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => addTextElement('Sample Text', { fontFamily: font })}
                      >
                        <div style={{ fontFamily: font }}>
                          <div className="font-medium">{font}</div>
                          <div className="text-xs text-muted-foreground">Sample Text</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="elements" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Basic Shapes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {shapes.map((shape) => (
                      <Button
                        key={shape.type}
                        variant="outline"
                        className="h-16 flex flex-col gap-1"
                        onClick={() => addShapeElement(shape.type)}
                      >
                        <shape.icon className="h-6 w-6" />
                        <span className="text-xs">{shape.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Icons</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[Star, Heart, Circle, Square].map((Icon, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-12"
                        onClick={() => addShapeElement('icon', { icon: Icon })}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="photos" className="h-full m-0">
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search photos..."
                  className="pl-8 h-9"
                />
              </div>
              
              <div className="text-center text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Photo search coming soon</p>
                <p className="text-xs">Upload your own images in the Uploads tab</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="uploads" className="h-full m-0">
            <div className="p-3">
              <div className="mb-4">
                <label htmlFor="file-upload">
                  <Button variant="outline" className="w-full" asChild>
                    <div>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Files
                    </div>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <ScrollArea className="h-full">
                {uploadedFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <Card key={index} className="cursor-pointer hover:bg-muted/50">
                        <CardContent className="p-2">
                          <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Image className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-xs font-medium truncate">
                            {file.name}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No uploads yet</p>
                    <p className="text-xs">Upload images and videos to use in your design</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="h-full m-0">
            <div className="p-3">
              <div className="text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No saved projects</p>
                <p className="text-xs">Your saved projects will appear here</p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};