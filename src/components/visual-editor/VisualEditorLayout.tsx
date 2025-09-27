import React from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';
import { EditorCanvas } from './EditorCanvas';
import { EditorTimeline } from './EditorTimeline';
import { EditorSidebar } from './EditorSidebar';

export const VisualEditorLayout: React.FC = () => {
  const { mode, sidebarOpen } = useVisualEditor();

  return (
    <div className="h-full flex flex-col">
      <EditorHeader />
      
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <EditorSidebar />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          {/* Main content area */}
          <ResizablePanel defaultSize={sidebarOpen ? 60 : 80}>
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <EditorToolbar />
              
              {/* Canvas/Preview area */}
              <div className="flex-1 bg-muted/20">
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
          
          {/* Properties panel (optional) */}
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-background border-l p-4">
              <h3 className="font-medium text-sm mb-4">Properties</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Select an element to edit its properties</p>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};