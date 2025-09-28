import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EditorHeader } from './EditorHeader';
import { EnhancedToolbar } from './EnhancedToolbar';
import { EditorCanvas } from './EditorCanvas';
import { EditorTimeline } from './EditorTimeline';
import { PropertiesPanel } from './PropertiesPanel';
import { MultiTabSidebar } from './MultiTabSidebar';
import { ExportPanel } from './ExportPanel';

export const VisualEditorLayout: React.FC = () => {
  const { mode, sidebarOpen, propertiesPanelOpen } = useVisualEditor();

  return (
    <div className="h-full flex flex-col">
      <EditorHeader />
      
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
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
            <div className="h-full flex flex-col">
              {/* Enhanced Toolbar */}
              <EnhancedToolbar />
              
              {/* Canvas/Preview area */}
              <div className="flex-1 bg-muted/10 relative">
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