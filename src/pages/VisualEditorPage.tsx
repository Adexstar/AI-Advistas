import React from 'react';
import { VisualEditorProvider } from '@/contexts/VisualEditorContext';
import { VisualEditorLayout } from '@/components/visual-editor/VisualEditorLayout';

const VisualEditorPage: React.FC = () => {
  return (
    <VisualEditorProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        <VisualEditorLayout />
      </div>
    </VisualEditorProvider>
  );
};

export default VisualEditorPage;