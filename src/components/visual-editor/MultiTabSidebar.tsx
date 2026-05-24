import React, { useEffect, useState } from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric';
import { useUserAds, useDeleteUserAd, useFileBasedTemplates } from '@/hooks/useTemplateStorage';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Heart,
  Edit3,
  Trash2
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

  const { data: fileBasedTemplates, isLoading: isLoadingFileTemplates } = useFileBasedTemplates();
  const { data: userAds, isLoading: isLoadingUserAds } = useUserAds();
  const deleteUserAd = useDeleteUserAd();

  const [searchQuery, setSearchQuery] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Use file-based templates from database directly
  const allTemplates = fileBasedTemplates || [];

  const filteredTemplates = allTemplates.filter(template =>
    template.name?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    (template.description || '')?.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  const filteredUserAds = userAds?.filter(ad =>
    ad.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteAd = async (adId: string) => {
    try {
      await deleteUserAd.mutateAsync(adId);
    } catch (error) {
      console.error('Failed to delete ad:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <Tabs defaultValue="templates" className="flex h-full min-h-0 flex-col">
        <div className="p-3 border-b">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-secondary/55 p-2 sm:grid-cols-3">
            <TabsTrigger value="templates" className="min-w-0 whitespace-normal px-2 py-2 text-[11px] sm:text-xs">
              <Layout className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="text" className="min-w-0 whitespace-normal px-2 py-2 text-[11px] sm:text-xs">
              <Type className="h-3 w-3 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="elements" className="min-w-0 whitespace-normal px-2 py-2 text-[11px] sm:text-xs">
              <Shapes className="h-3 w-3 mr-1" />
              Elements
            </TabsTrigger>
          </TabsList>
          <TabsList className="mt-2 grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-secondary/55 p-2 sm:grid-cols-3">
            <TabsTrigger value="photos" className="min-w-0 whitespace-normal px-2 py-2 text-[11px] sm:text-xs">
              <Image className="h-3 w-3 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="uploads" className="min-w-0 whitespace-normal px-2 py-2 text-[11px] sm:text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Uploads
            </TabsTrigger>
            <TabsTrigger value="my-ads" className="min-w-0 whitespace-normal px-2 py-2 text-[11px] sm:text-xs">
              <Heart className="h-3 w-3 mr-1" />
              My Ads
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <TabsContent value="templates" className="m-0 flex h-full min-h-0 flex-col">
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-3 pt-0">
                {isLoadingFileTemplates ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                        <CardContent className="p-2" onClick={() => loadTemplate(template as any)}>
                          <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                            {template.thumbnail_url || template.preview_url ? (
                              <img 
                                src={template.thumbnail_url || template.preview_url} 
                                alt={template.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<div class="h-full w-full flex items-center justify-center"><svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg></div>';
                                }}
                              />
                            ) : (
                              <Layout className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium truncate">
                              {template.name}
                            </div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {template.description}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No templates found</p>
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
                        <div className={preset.style.fontWeight === 'bold' ? 'text-base font-semibold' : 'text-sm font-medium'}>
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
                        <div className="text-left">
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                                loading="lazy"
                                decoding="async"
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

          <TabsContent value="my-ads" className="h-full m-0">
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search my ads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              
              <ScrollArea className="flex-1">
                {isLoadingUserAds ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredUserAds.length > 0 ? (
                  <div className="space-y-3">
                    {filteredUserAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="group relative bg-card rounded-lg border p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{ad.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={ad.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {ad.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ad.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            {(ad as any).templates && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                Template: {(ad as any).templates.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{ad.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteAd(ad.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No saved ads yet</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Create and save your first ad to see it here
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};