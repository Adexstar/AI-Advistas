import TemplateBrowser from '@/components/ad/TemplateBrowser';
import { BatchTemplateUploader } from '@/components/admin/BatchTemplateUploader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LayoutTemplate, Megaphone, Rocket, Upload } from 'lucide-react';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))]">
      <div className="page-container py-4 sm:py-6">
        <header className="relative mb-6 overflow-hidden rounded-[36px] border border-border/80 bg-background/90 p-6 shadow-card lg:p-8">
          <div className="pointer-events-none absolute -left-12 top-10 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 bottom-4 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
                Library Surface
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Template Library</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse proven ad systems, open them in the visual customizer, or upload a fresh creative batch for the workspace.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  <Rocket className="h-3.5 w-3.5 text-sky-600" />
                  Launch-ready layouts
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                  Ad-first creative workflow
                </span>
              </div>
            </div>
          </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <Card className="border-border/70 bg-background/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workflow</p>
                  <p className="mt-2 text-lg font-semibold">Compare, pick, customize</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80 shadow-none">
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next step</p>
                    <p className="mt-2 text-lg font-semibold">Build a new ad</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/create')} className="w-full">
                    Create Ad
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-border/80 bg-background/95 shadow-card">
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
              Use the shared browser to compare internal systems against imported creative without leaving the ad-building flow.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background/95 shadow-card">
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
          <TabsList className="grid w-full grid-cols-2 rounded-[20px] border border-border/70 bg-background/80 p-1 lg:max-w-[420px]">
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
            <div className="mb-6 max-w-2xl space-y-2 rounded-[28px] border border-border/70 bg-background/85 p-6 shadow-card">
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