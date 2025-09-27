import React, { useEffect } from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Folder, 
  Image, 
  Video, 
  Type, 
  Palette, 
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';

export const EditorSidebar: React.FC = () => {
  const { mode, templates, fetchTemplates, loadTemplate, uploadedFiles } = useVisualEditor();
  
  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(t => t.type === mode);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'youtube': return '📺';
      case 'tiktok': return '🎵';
      case 'linkedin': return '💼';
      default: return '📄';
    }
  };

  return (
    <div className="h-full bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-medium text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Assets & Templates
        </h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Templates Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span className="text-sm font-medium">Templates</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filteredTemplates.length}
              </Badge>
            </div>
            
            {templates.length === 0 ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3" onClick={() => loadTemplate(template)}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getPlatformIcon(template.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {template.name}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {template.platform} • {template.type}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Media Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {mode === 'image' ? (
                <Image className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">Media</span>
            </div>
            <div className="space-y-2">
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((file, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          {file.type.startsWith('image/') ? '🖼️' : '🎥'}
                        </div>
                        <span className="text-xs truncate">{file.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center p-4 border-2 border-dashed rounded-lg">
                  No media files yet. Upload files to see them here.
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {mode === 'image' && (
            <>
              {/* Text Styles */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="h-4 w-4" />
                  <span className="text-sm font-medium">Text Styles</span>
                </div>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <span className="text-lg font-bold">Heading</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <span className="text-base">Subheading</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <span className="text-sm">Body Text</span>
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Colors */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4" />
                  <span className="text-sm font-medium">Colors</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['#000000', '#ffffff', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'].map((color) => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded-md border cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
          
          {mode === 'video' && (
            <>
              {/* Layers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-medium">Layers</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Video layers will appear here.
                </div>
              </div>
              
              <Separator />
              
              {/* Effects */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Effects</span>
                </div>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    Fade In
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    Fade Out
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    Slide Left
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};