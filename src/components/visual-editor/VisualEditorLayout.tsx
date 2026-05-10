import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditorHeader } from './EditorHeader';
import { EnhancedToolbar } from './EnhancedToolbar';
import { EditorCanvas } from './EditorCanvas';
import { EditorTimeline } from './EditorTimeline';
import { PropertiesPanel } from './PropertiesPanel';
import { MultiTabSidebar } from './MultiTabSidebar';
import { ExportPanel } from './ExportPanel';

export const VisualEditorLayout: React.FC = () => {
  const { mode, sidebarOpen, propertiesPanelOpen, setSidebarOpen, setPropertiesPanelOpen } = useVisualEditor() as any;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-full flex flex-col w-full min-w-0 overflow-x-hidden">
        <EditorHeader />
        <EnhancedToolbar />

        <div className="flex-1 bg-muted/10 relative min-w-0 overflow-auto">
          <EditorCanvas />
        </div>

        {mode === 'video' && (
          <div className="h-32 border-t bg-background">
            <EditorTimeline />
          </div>
        )}

        {/* Mobile: sidebar as off-canvas drawer */}
        <Sheet open={sidebarOpen} onOpenChange={(o) => setSidebarOpen?.(o)}>
          <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
            <div className="h-full overflow-y-auto">
              <MultiTabSidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile: properties as off-canvas drawer */}
        <Sheet open={propertiesPanelOpen} onOpenChange={(o) => setPropertiesPanelOpen?.(o)}>
          <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
            <div className="h-full overflow-y-auto">
              <PropertiesPanel />
              <div className="p-4 border-t">
                <ExportPanel />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full min-w-0">
      <EditorHeader />

      <div className="flex-1 flex min-w-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
                <MultiTabSidebar />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          <ResizablePanel defaultSize={sidebarOpen && propertiesPanelOpen ? 56 : sidebarOpen ? 78 : propertiesPanelOpen ? 78 : 100}>
            <div className="h-full flex flex-col min-w-0">
              <EnhancedToolbar />
              <div className="flex-1 bg-muted/10 relative min-w-0">
                <EditorCanvas />
              </div>
              {mode === 'video' && (
                <div className="h-32 border-t bg-background">
                  <EditorTimeline />
                </div>
              )}
            </div>
          </ResizablePanel>

          {propertiesPanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
                <div className="h-full overflow-y-auto">
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
