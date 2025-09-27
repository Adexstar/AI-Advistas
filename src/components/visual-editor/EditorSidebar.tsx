import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Folder, 
  Image, 
  Video, 
  Type, 
  Palette, 
  Layers,
  Clock
} from 'lucide-react';

export const EditorSidebar: React.FC = () => {
  const { mode } = useVisualEditor();

  const templates = [
    { id: 1, name: 'Instagram Post', size: '1080x1080', type: 'image' },
    { id: 2, name: 'Facebook Ad', size: '1200x628', type: 'image' },
    { id: 3, name: 'YouTube Thumbnail', size: '1280x720', type: 'image' },
    { id: 4, name: 'Short Video', size: '1080x1920', type: 'video' },
    { id: 5, name: 'Landscape Video', size: '1920x1080', type: 'video' },
  ];

  const filteredTemplates = templates.filter(t => t.type === mode);

  return (
    <div className="h-full bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-medium text-sm">Assets & Templates</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Templates Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Folder className="h-4 w-4" />
              <span className="text-sm font-medium">Templates</span>
            </div>
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground">{template.size}</span>
                  </div>
                </Button>
              ))}
            </div>
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
            <div className="text-sm text-muted-foreground">
              No media files yet. Upload files to see them here.
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