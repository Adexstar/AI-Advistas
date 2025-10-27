import TemplateBrowser from '@/components/ad/TemplateBrowser';
import { EdgeFunctionTest } from '@/components/EdgeFunctionTest';
import { BatchTemplateUploader } from '@/components/admin/BatchTemplateUploader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

const TemplateLibrary: React.FC = () => {
  const navigate = useNavigate();

  const handleTemplateSelect = (template: any) => {
    console.log('Template selected:', template);
    navigate(`/template-customizer?templateId=${template.id}`);
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
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Browse Templates</TabsTrigger>
            <TabsTrigger value="upload">Upload Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-8">
            <TemplateBrowser 
              onTemplateSelect={handleTemplateSelect}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="py-8">
            <BatchTemplateUploader />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TemplateLibrary;