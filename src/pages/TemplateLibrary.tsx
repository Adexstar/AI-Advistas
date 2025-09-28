import { TemplateSystem } from '@/components/TemplateSystem';
import { EdgeFunctionTest } from '@/components/EdgeFunctionTest';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TemplateLibrary: React.FC = () => {
  const navigate = useNavigate();

  const handleUseTemplate = (template: any) => {
    console.log('Using template:', template);
    navigate(`/ad-editor/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Template Library</h1>
              <p className="text-muted-foreground">Choose a template to create your ad</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <EdgeFunctionTest />
        </div>
        <TemplateSystem 
          onUseTemplate={handleUseTemplate}
        />
      </main>
    </div>
  );
};

export default TemplateLibrary;