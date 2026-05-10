import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, Download, FileText, Heart, History, Layers3, Search, Sparkles, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTemplates, useTrackTemplateUsage } from '@/hooks/useTemplates';
import { useCombinedTemplates } from '@/hooks/useUnifiedTemplates';
import { generateDefaultCanvasData } from '@/utils/canvasHelpers';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TemplateBrowserProps {
  onTemplateSelect?: (templateData: any) => void;
  mode?: 'selection' | 'library';
  showHeader?: boolean;
}

const TEMPLATE_FAVORITES_KEY = 'advista-template-favorites';
const TEMPLATE_RECENTS_KEY = 'advista-template-recents';
const MAX_RECENT_TEMPLATES = 6;

const readStoredTemplateKeys = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const getTemplateStorageKey = (template: any) => `${template.source}:${template.id}`;

const labelize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const TemplateBrowser = ({
  onTemplateSelect,
  mode = 'selection',
  showHeader = true,
}: TemplateBrowserProps) => {
  const navigate = useNavigate();
  const { data: internalTemplates, isLoading: isLoadingInternal, error } = useTemplates();
  const { 
    freepikTemplates, 
    isLoading: isLoadingFreepik,
    searchAllTemplates,
    processFreepikPSD,
    isProcessingPSD 
  } = useCombinedTemplates();
  const trackUsage = useTrackTemplateUsage();
  const [search, setSearch] = useState('');
  const [filterGoal, setFilterGoal] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSource, setFilterSource] = useState<'all' | 'internal' | 'freepik'>('all');
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [favoriteTemplateKeys, setFavoriteTemplateKeys] = useState<string[]>(() => readStoredTemplateKeys(TEMPLATE_FAVORITES_KEY));
  const [recentTemplateKeys, setRecentTemplateKeys] = useState<string[]>(() => readStoredTemplateKeys(TEMPLATE_RECENTS_KEY));
  
  useEffect(() => {
    searchAllTemplates({ query: '', page: 1, limit: 20 });
  }, [searchAllTemplates]);
  
  const isLoading = isLoadingInternal || isLoadingFreepik;

  const browserCopy =
    mode === 'library'
      ? {
          eyebrow: 'Template workspace',
          title: 'Browse templates that are ready to adapt, import, and launch.',
          subtitle:
            'Compare internal systems and imported creative in one place, then open the best fit in the customizer.',
          actionLabel: 'Open in Customizer',
        }
      : {
          eyebrow: 'Template picker',
          title: 'Choose a template that gets you to launch faster.',
          subtitle:
            'Filter by goal, industry, and complexity, then send the selected template straight into your ad flow.',
          actionLabel: 'Use This Template',
        };

  const allTemplates = useMemo(
    () => [
      ...(internalTemplates || []).map((template) => ({ ...template, source: 'internal' as const })),
      ...freepikTemplates.map((template) => ({ ...template, source: 'freepik' as const })),
    ],
    [freepikTemplates, internalTemplates]
  );

  const sourceCounts = {
    internal: allTemplates.filter((template) => template.source === 'internal').length,
    freepik: allTemplates.filter((template) => template.source === 'freepik').length,
  };

  const goalOptions = useMemo(
    () => Array.from(new Set(allTemplates.map((template: any) => template.goal).filter(Boolean))).sort(),
    [allTemplates]
  );

  const industryOptions = useMemo(
    () => Array.from(new Set(allTemplates.map((template: any) => template.industry).filter(Boolean))).sort(),
    [allTemplates]
  );

  const difficultyOptions = useMemo(
    () =>
      Array.from(new Set(allTemplates.map((template: any) => template.difficulty_level).filter(Boolean))).sort(),
    [allTemplates]
  );

  const filteredTemplates = useMemo(
    () =>
      allTemplates
        .filter((template: any) => {
          const matchesSearch =
            template.name?.toLowerCase().includes(search.toLowerCase()) ||
            template.description?.toLowerCase().includes(search.toLowerCase());
          const matchesGoal = filterGoal === 'all' || template.goal === filterGoal;
          const matchesIndustry = filterIndustry === 'all' || template.industry === filterIndustry;
          const matchesDifficulty = filterDifficulty === 'all' || template.difficulty_level === filterDifficulty;
          const matchesSource = filterSource === 'all' || template.source === filterSource;

          return matchesSearch && matchesGoal && matchesIndustry && matchesDifficulty && matchesSource;
        })
        .sort((a: any, b: any) => {
          const aScore = a.performance_score || 0;
          const bScore = b.performance_score || 0;
          if (aScore && bScore) {
            return bScore - aScore;
          }

          const aPopular = a.is_popular || false;
          const bPopular = b.is_popular || false;
          if (aPopular && !bPopular) return -1;
          if (!aPopular && bPopular) return 1;
          return a.name.localeCompare(b.name);
        }),
    [allTemplates, filterDifficulty, filterGoal, filterIndustry, filterSource, search]
  );

  const stats = useMemo(
    () => ({
      total: allTemplates.length,
      highPerformers: allTemplates.filter((template: any) => (template.performance_score || 0) >= 90).length,
      readyNow: allTemplates.filter((template: any) => template.source === 'internal' || template.canvas_data).length,
      imported: allTemplates.filter((template: any) => template.source === 'freepik').length,
      favorites: favoriteTemplateKeys.length,
    }),
    [allTemplates, favoriteTemplateKeys.length]
  );

  const favoriteTemplates = useMemo(
    () => favoriteTemplateKeys.map((key) => allTemplates.find((template) => getTemplateStorageKey(template) === key)).filter(Boolean),
    [allTemplates, favoriteTemplateKeys]
  );

  const recentTemplates = useMemo(
    () => recentTemplateKeys.map((key) => allTemplates.find((template) => getTemplateStorageKey(template) === key)).filter(Boolean),
    [allTemplates, recentTemplateKeys]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(TEMPLATE_FAVORITES_KEY, JSON.stringify(favoriteTemplateKeys));
  }, [favoriteTemplateKeys]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(TEMPLATE_RECENTS_KEY, JSON.stringify(recentTemplateKeys));
  }, [recentTemplateKeys]);

  const toggleFavoriteTemplate = (template: any) => {
    const templateKey = getTemplateStorageKey(template);

    setFavoriteTemplateKeys((currentKeys) =>
      currentKeys.includes(templateKey)
        ? currentKeys.filter((key) => key !== templateKey)
        : [templateKey, ...currentKeys]
    );
  };

  const recordRecentTemplate = (template: any) => {
    const templateKey = getTemplateStorageKey(template);

    setRecentTemplateKeys((currentKeys) => [templateKey, ...currentKeys.filter((key) => key !== templateKey)].slice(0, MAX_RECENT_TEMPLATES));
  };

  const openTemplate = (template: any) => {
    const templateData = {
      ...template,
      templateName: template.name,
      canvas_data: template.canvas_data || generateDefaultCanvasData(template),
    };

    recordRecentTemplate(template);

    if (onTemplateSelect) {
      onTemplateSelect(templateData);
      return;
    }

    navigate('/template-customizer', {
      state: {
        templateData,
      },
    });
  };

  const handleTemplateClick = async (template: any) => {
    if (template.source === 'freepik' && !template.canvas_data) {
      setImportingTemplateId(template.id);
      setImportProgress(10);
      
      toast.info('Downloading PSD...');
      setImportProgress(30);
      
      const success = await processFreepikPSD(template.id, template.freepik_download_url);
      
      setImportProgress(70);
      
      if (!success) {
        toast.error('Failed to import template');
        setImportingTemplateId(null);
        setImportProgress(0);
        return;
      }
      
      setImportProgress(100);
      toast.success('Template imported successfully!');
      
      searchAllTemplates({ query: '', page: 1, limit: 20 });
      setImportingTemplateId(null);
      setImportProgress(0);
      return;
    }
    
    if (template.source === 'internal') {
      trackUsage.mutate(template.id);
    }

    openTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-40 w-full rounded-[28px] animate-shimmer" />
        <Skeleton className="h-24 w-full rounded-3xl animate-shimmer" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-10 w-full animate-shimmer" />
          <Skeleton className="h-10 w-full animate-shimmer" />
          <Skeleton className="h-10 w-full animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="p-5">
              <Skeleton className="mb-4 h-6 w-2/3 animate-shimmer" />
              <Skeleton className="mb-3 h-4 w-full animate-shimmer" />
              <Skeleton className="mb-4 h-4 w-5/6 animate-shimmer" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 animate-shimmer" />
                <Skeleton className="h-6 w-20 animate-shimmer" />
              </div>
              <Skeleton className="mt-6 h-10 w-full animate-shimmer" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[300px] flex flex-col items-center justify-center border-destructive/50 bg-destructive/5">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-lg font-medium text-destructive">Failed to Load Templates</p>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          {error.message || 'Please check your network connection or try again later.'}
        </p>
        <Button 
          variant="outline" 
          onClick={() => searchAllTemplates({ query: '', page: 1, limit: 20 })}
        >
          Retry
        </Button>
      </Card>
    );
  }

  const getGoalBadgeColor = (goal: string | null) => {
    switch (goal) {
      case 'Conversion':
        return 'bg-emerald-100 text-emerald-600';
      case 'Engagement':
        return 'bg-red-100 text-red-600';
      case 'Traffic':
        return 'bg-blue-100 text-blue-600';
      case 'Awareness':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPlatformDotColor = (platforms: string[]) => {
    if (platforms.includes('Facebook') || platforms.includes('Instagram')) return 'bg-blue-500';
    if (platforms.includes('TikTok')) return 'bg-red-500';
    if (platforms.includes('LinkedIn')) return 'bg-blue-700';
    return 'bg-gray-500';
  };

  const renderTemplateCard = (template: any) => {
    const isFavorite = favoriteTemplateKeys.includes(getTemplateStorageKey(template));

    return (
      <Card key={template.id} className="flex h-full flex-col border-border/80 shadow-card transition-transform hover:-translate-y-1">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle className="text-xl leading-7">{template.name}</CardTitle>
              <CardDescription className="line-clamp-3 min-h-[60px] text-sm leading-6">
                {(template as any).description || 'No description available'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label={isFavorite ? `Remove ${template.name} from saved templates` : `Save ${template.name} as favorite`}
                onClick={() => toggleFavoriteTemplate(template)}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/70 text-[11px] uppercase tracking-[0.18em]">
                {template.source === 'internal' ? 'Internal' : 'Freepik'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(template as any).performance_score >= 90 && (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                <Zap className="mr-1 h-3 w-3" /> High Performer
              </Badge>
            )}
            {(template as any).difficulty_level === 'beginner' && (
              <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                <Sparkles className="mr-1 h-3 w-3" /> Beginner Friendly
              </Badge>
            )}
            {(template as any).is_popular && (
              <Badge className="bg-primary/10 text-primary border-primary/20">Popular</Badge>
            )}
            {isFavorite && <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Saved</Badge>}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {(template as any).goal && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${getGoalBadgeColor((template as any).goal)}`}>
                <Target className="h-3 w-3" />
                {(template as any).goal}
              </span>
            )}
            {(template as any).performance_score && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                {(template as any).performance_score}/100 score
              </span>
            )}
            {(template as any).estimated_setup_time_minutes && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                <Clock className="h-3 w-3" />
                {(template as any).estimated_setup_time_minutes} min
              </span>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-border/70 bg-secondary/35 p-3 text-xs text-muted-foreground">
            {(template as any).industry && <p>Industry: {labelize((template as any).industry)}</p>}
            {(template as any).difficulty_level && <p>Level: {labelize((template as any).difficulty_level)}</p>}
            {(template as any).platforms?.length > 0 && (
              <p>
                Platforms: <span className={`mr-1 inline-block h-2 w-2 rounded-full ${getPlatformDotColor((template as any).platforms)}`}></span>
                {(template as any).platforms.join(', ')}
              </p>
            )}
          </div>

          <div className="mt-auto">
            {importingTemplateId === template.id ? (
              <div className="space-y-2 rounded-2xl border border-border/70 bg-background p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importing template...</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {importProgress < 30
                    ? 'Downloading PSD...'
                    : importProgress < 70
                      ? 'Processing layers...'
                      : 'Finalizing import...'}
                </p>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => handleTemplateClick(template)}
                className="w-full rounded-2xl"
                disabled={isProcessingPSD}
              >
                {template.source !== 'internal' && !template.canvas_data ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import & Use Template
                  </>
                ) : (
                  browserCopy.actionLabel
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ErrorBoundary>
      <div className="w-full space-y-6">
        {showHeader && (
          <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-background via-secondary/30 to-background shadow-card">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div className="space-y-4">
                <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                  {browserCopy.eyebrow}
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">{browserCopy.title}</h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{browserCopy.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                <Card className="border-border/70 bg-background/80 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Available</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-background/80 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">High Performer</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.highPerformers}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-background/80 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ready Now</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.readyNow}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-background/80 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">External</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.imported}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-background/80 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.favorites}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/80 shadow-card">
          <CardContent className="space-y-4 p-5">
            <Tabs value={filterSource} onValueChange={(value) => setFilterSource(value as typeof filterSource)}>
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-secondary/60 p-1">
                <TabsTrigger value="all">All ({allTemplates.length})</TabsTrigger>
                <TabsTrigger value="internal">Internal ({sourceCounts.internal})</TabsTrigger>
                <TabsTrigger value="freepik">Freepik ({sourceCounts.freepik})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by template name or description..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterGoal} onValueChange={setFilterGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="All goals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All goals</SelectItem>
                  {goalOptions.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industryOptions.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {labelize(industry)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {difficultyOptions.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {labelize(difficulty)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                <span>{filteredTemplates.length} template{filteredTemplates.length === 1 ? '' : 's'} match your current filters.</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">{sourceCounts.internal} internal</Badge>
                <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">{sourceCounts.freepik} external</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {(favoriteTemplates.length > 0 || recentTemplates.length > 0) && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80 shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Saved Templates</CardTitle>
                </div>
                <CardDescription>Your pinned templates stay here for fast reuse.</CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteTemplates.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteTemplates.slice(0, 3).map((template: any) => (
                      <button
                        key={getTemplateStorageKey(template)}
                        type="button"
                        onClick={() => handleTemplateClick(template)}
                        className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background p-3 text-left transition hover:border-primary/40 hover:bg-secondary/30"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{template.name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {(template as any).description || 'No description available'}
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-border/80 bg-background/70 text-[11px] uppercase tracking-[0.18em]">
                          {template.source === 'internal' ? 'Internal' : 'Freepik'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Tap the heart on any template card to save it here.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Recently Used</CardTitle>
                </div>
                <CardDescription>Jump back into templates you opened most recently.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTemplates.length > 0 ? (
                  <div className="space-y-3">
                    {recentTemplates.slice(0, 3).map((template: any) => (
                      <button
                        key={getTemplateStorageKey(template)}
                        type="button"
                        onClick={() => handleTemplateClick(template)}
                        className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background p-3 text-left transition hover:border-primary/40 hover:bg-secondary/30"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{template.name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {(template as any).description || 'No description available'}
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-border/80 bg-background/70 text-[11px] uppercase tracking-[0.18em]">
                          {template.source === 'internal' ? 'Internal' : 'Freepik'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Open a template once and it will appear here for quick return.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => renderTemplateCard(template))}
        </div>

        {filteredTemplates.length === 0 && allTemplates.length > 0 && (
          <Card className="border-dashed border-border/80 bg-secondary/20">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">No templates match the current filters.</p>
                <p className="text-sm">Try broader keywords or reset one of the filter controls.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {allTemplates.length === 0 && (
          <Card className="border-dashed border-border/80 bg-secondary/20">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">No templates available yet.</p>
                <p className="text-sm">Upload a new batch or check back once the library sync finishes.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default TemplateBrowser;
