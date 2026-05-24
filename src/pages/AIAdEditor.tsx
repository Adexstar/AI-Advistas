import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartNoAxesColumn, Megaphone, Palette, Sparkles, Target, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import TemplateBrowser from '@/components/ad/TemplateBrowser';
import { AIStylePanel } from '@/components/ai/AIStylePanel';
import { SmartCopyEditor } from '@/components/ai/SmartCopyEditor';

const AIAdEditor = () => {
  const [productName, setProductName] = useState('');
  const [platform, setPlatform] = useState('facebook');
  const [adCopy, setAdCopy] = useState({
    headline: '',
    description: '',
    cta: ''
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))]"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="page-container pb-4 pt-6"
      >
        <div className="relative overflow-hidden rounded-[36px] border border-border/80 bg-background/90 p-6 shadow-card lg:p-8">
          <div className="pointer-events-none absolute -left-10 top-8 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 bottom-4 h-36 w-36 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="space-y-5">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
                AI creative studio
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
                  Build an ad concept, shape the copy, and choose the creative system in one flow.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
                  This editor now frames AI assistance like a campaign workspace: set the product, tune the platform, draft the message, and drop everything into a launch-ready template.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                  AI-guided creative direction
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5">
                  <Target className="h-3.5 w-3.5 text-emerald-600" />
                  Platform-aware copy controls
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                  Template-assisted ad assembly
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Card className="border-border/70 bg-background/85 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
                  <p className="mt-2 text-lg font-semibold">Campaign-first</p>
                  <p className="mt-1 text-xs text-muted-foreground">Copy, style, and layout stay aligned.</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/85 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Output</p>
                  <p className="mt-2 text-lg font-semibold">Launch-ready drafts</p>
                  <p className="mt-1 text-xs text-muted-foreground">Built for ad iteration, not generic content.</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/85 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Flow</p>
                  <p className="mt-2 text-lg font-semibold">Brief to template</p>
                  <p className="mt-1 text-xs text-muted-foreground">Keep momentum from idea through production.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="page-container pb-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="border-border/80 bg-background/95 shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ChartNoAxesColumn className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Campaign setup</CardTitle>
                  <CardDescription>
                    Set the product and platform context so the copy assistant and visual direction stay relevant to the ad channel.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="space-y-2">
                  <label htmlFor="product-name" className="text-sm font-medium text-foreground">
                    Product or offer
                  </label>
                  <Input
                    id="product-name"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Summer skincare bundle"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="platform-select" className="text-sm font-medium text-foreground">
                    Primary platform
                  </label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform-select">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="google">Google Ads</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Angle</p>
                  <p className="mt-2 text-sm font-medium text-foreground">Performance-oriented</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Start with a product hook and let the editor structure the message around conversion intent.</p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Channel</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Keep copy length, CTA style, and creative rhythm aligned with the selected placement.</p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{productName ? 'Brief in progress' : 'Waiting for brief'}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Add a product or offer name to make downstream copy suggestions more specific.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full border-border/80 bg-background/95 shadow-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl">Style direction</CardTitle>
                      <CardDescription>
                        Use AI-generated visual directions to steer the creative treatment before applying a template.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <AIStylePanel
                    productCategory={productName ? 'general' : 'product'}
                    platform={platform}
                    onStyleSelect={(style) => {
                      toast({
                        title: 'Style Applied',
                        description: `Applied ${style.name} style with ${style.primaryColor} theme.`,
                      });
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full border-border/80 bg-background/95 shadow-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl">Copy shaping</CardTitle>
                      <CardDescription>
                        Refine the headline, body copy, and CTA with platform context carried through each editor.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Headline
                    </label>
                    <SmartCopyEditor
                      text={adCopy.headline}
                      onTextChange={(newText) => setAdCopy((prev) => ({ ...prev, headline: newText }))}
                      productName={productName}
                      platform={platform}
                      textType="headline"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Description
                    </label>
                    <SmartCopyEditor
                      text={adCopy.description}
                      onTextChange={(newText) => setAdCopy((prev) => ({ ...prev, description: newText }))}
                      productName={productName}
                      platform={platform}
                      textType="description"
                      maxLength={300}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Call to action
                    </label>
                    <SmartCopyEditor
                      text={adCopy.cta}
                      onTextChange={(newText) => setAdCopy((prev) => ({ ...prev, cta: newText }))}
                      productName={productName}
                      platform={platform}
                      textType="cta"
                      maxLength={50}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="overflow-hidden border-border/80 bg-background/95 shadow-card">
              <CardHeader className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
                      Creative systems
                    </Badge>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Wand2 className="h-5 w-5 text-primary" />
                      Apply a template after the brief is taking shape
                    </CardTitle>
                    <CardDescription className="max-w-2xl leading-6">
                      Pull the copy and product context into a template once the angle feels right. This keeps the workflow looking like an ad builder instead of a separate template picker.
                    </CardDescription>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                    <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommended flow</p>
                      <p className="mt-2 text-sm font-medium text-foreground">Brief, copy, then layout</p>
                    </div>
                    <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Template use</p>
                      <p className="mt-2 text-sm font-medium text-foreground">Populate copy instantly</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <TemplateBrowser
                  showHeader={false}
                  onTemplateSelect={(template) => {
                    setAdCopy((prev) => ({
                      ...prev,
                      headline: template.name || prev.headline,
                      description: template.description || prev.description,
                    }));
                    toast({
                      title: 'Template Applied',
                      description: `${template.name} template has been applied to your ad.`,
                    });
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIAdEditor;