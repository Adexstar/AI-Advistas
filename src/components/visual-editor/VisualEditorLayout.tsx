import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { EditorHeader } from './EditorHeader';
import { EnhancedToolbar } from './EnhancedToolbar';
import { EditorCanvas } from './EditorCanvas';
import { EditorTimeline } from './EditorTimeline';
import { PropertiesPanel } from './PropertiesPanel';
import { MultiTabSidebar } from './MultiTabSidebar';
import { ExportPanel } from './ExportPanel';

export const VisualEditorLayout: React.FC = () => {
  const {
    mode,
    sidebarOpen,
    propertiesPanelOpen,
    setSidebarOpen,
    setPropertiesPanelOpen,
  } = useVisualEditor();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-full min-h-screen flex-col overflow-hidden">
        <EditorHeader />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EnhancedToolbar />

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/10">
            <EditorCanvas />
          </div>

          {mode === 'video' && (
            <div className="border-t bg-background">
              <EditorTimeline />
            </div>
          )}
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[min(22rem,calc(100vw-1rem))] p-0">
            <div className="h-full min-h-0 overflow-hidden">
              <MultiTabSidebar />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={propertiesPanelOpen} onOpenChange={setPropertiesPanelOpen}>
          <SheetContent side="right" className="w-[min(22rem,calc(100vw-1rem))] p-0">
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PropertiesPanel />
              </div>
              <div className="border-t p-4">
                <ExportPanel />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col overflow-hidden">
      <EditorHeader />
      
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full min-w-0">
          {/* Left Sidebar */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
                <MultiTabSidebar />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          {/* Main content area */}
          <ResizablePanel defaultSize={sidebarOpen && propertiesPanelOpen ? 56 : sidebarOpen ? 78 : propertiesPanelOpen ? 78 : 100}>
            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              {/* Enhanced Toolbar */}
              <EnhancedToolbar />
              
              {/* Canvas/Preview area */}
              <div className="relative min-h-0 flex-1 bg-muted/10">
                <EditorCanvas />
              </div>
              
              {/* Timeline (for video mode) */}
              {mode === 'video' && (
                <div className="h-32 border-t bg-background">
                  <EditorTimeline />
                </div>
              )}
            </div>
          </ResizablePanel>
          
          {/* Right Properties Panel */}
          {propertiesPanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto">
                  <PropertiesPanel />
                  <div className="p-4 border-t">
                    <ExportPanel />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};