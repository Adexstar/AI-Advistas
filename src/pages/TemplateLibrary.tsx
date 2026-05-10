import TemplateBrowser from '@/components/ad/TemplateBrowser';
import { BatchTemplateUploader } from '@/components/admin/BatchTemplateUploader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LayoutTemplate, Upload } from 'lucide-react';

const TemplateLibrary = () => {
  const navigate = useNavigate();

  const handleTemplateSelect = (template: any) => {
    navigate('/template-customizer', {
      state: {
        templateData: template,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="page-container py-4 sm:py-6">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-border/80 bg-background/90 p-6 shadow-card lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Library Surface</p>
              <h1 className="text-3xl font-bold tracking-tight">Template Library</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse proven templates, open them in the visual customizer, or upload a new batch for the workspace.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-3 lg:w-auto">
            <Button variant="outline" onClick={() => navigate('/create')} className="w-full sm:w-auto">
              Create Ad
            </Button>
          </div>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-border/80 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Browse and compare</CardTitle>
                  <CardDescription>Scan by goal, industry, source, and setup complexity.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Use the shared browser to compare internal templates against imported creative without leaving the workspace.
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary/20 p-3 text-secondary-foreground">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload and expand</CardTitle>
                  <CardDescription>Bring in new batches when the team adds fresh creative systems.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Keep the library current by uploading PSD-backed template collections directly from the admin flow.
            </CardContent>
          </Card>
        </div>

        <main>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-secondary/50 p-1 lg:max-w-[420px]">
            <TabsTrigger value="templates">Browse Templates</TabsTrigger>
            <TabsTrigger value="upload">Upload Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-8">
            <TemplateBrowser 
              mode="library"
              showHeader={false}
              onTemplateSelect={handleTemplateSelect}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="py-8">
            <div className="mb-6 max-w-2xl space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Upload a new template batch</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Add new PSD-backed templates to the workspace library so they become available in both the library and create flow.
              </p>
            </div>
            <BatchTemplateUploader />
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
};

export default TemplateLibrary;