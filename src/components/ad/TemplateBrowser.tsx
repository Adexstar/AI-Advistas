import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, AlertTriangle, Zap, Clock, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTemplates, AdTemplate, useTrackTemplateUsage } from '@/hooks/useTemplates';
import { generateDefaultCanvasData } from '@/utils/canvasHelpers';

interface TemplateBrowserProps {
  onTemplateSelect: (templateData: any) => void;
}

const TemplateBrowser = ({ onTemplateSelect }: TemplateBrowserProps) => {
  const navigate = useNavigate();
  const { data: templates, isLoading, error } = useTemplates();
  const trackUsage = useTrackTemplateUsage();
  const [search, setSearch] = useState('');
  const [filterGoal, setFilterGoal] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const filteredTemplates = (templates || [])
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                           template.description?.toLowerCase().includes(search.toLowerCase());
      const matchesGoal = filterGoal === 'all' || template.goal === filterGoal;
      const matchesIndustry = filterIndustry === 'all' || template.industry === filterIndustry;
      const matchesDifficulty = filterDifficulty === 'all' || template.difficulty_level === filterDifficulty;
      
      return matchesSearch && matchesGoal && matchesIndustry && matchesDifficulty;
    })
    .sort((a, b) => {
      // Sort by performance score (high to low), then by popularity, then by name
      if (a.performance_score && b.performance_score) {
        return b.performance_score - a.performance_score;
      }
      if (a.is_popular && !b.is_popular) return -1;
      if (!a.is_popular && b.is_popular) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleTemplateClick = (template: AdTemplate) => {
    trackUsage.mutate(template.id);
    
    navigate('/template-customizer', {
      state: {
        templateData: {
          ...template,
          templateName: template.name,
          canvas_data: (template as any).canvas_data || generateDefaultCanvasData(template)
        }
      }
    });
  };

  if (isLoading) {
    return (
      <Card className="min-h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Loading Templates...</p>
        <p className="text-sm text-muted-foreground">Fetching proven layouts from the library.</p>
      </Card>
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
          onClick={() => window.location.reload()}
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center gap-2 text-primary">
        <FileText className="h-6 w-6" />
        <h2 className="text-lg font-semibold">Template Library</h2>
      </div>

      <h1 className="text-xl font-bold">Choose a High-Performing Template</h1>

      {/* Filter/Search Bar */}
      <div className="space-y-3">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={filterGoal} onValueChange={setFilterGoal}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="All Goals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              <SelectItem value="Conversion">Conversion</SelectItem>
              <SelectItem value="Awareness">Awareness</SelectItem>
              <SelectItem value="Traffic">Traffic</SelectItem>
              <SelectItem value="Engagement">Engagement</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="b2b">B2B</SelectItem>
              <SelectItem value="consumer_brands">Consumer Brands</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="mobile_apps">Mobile Apps</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="e-commerce">E-commerce</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="app">Mobile Apps</SelectItem>
              <SelectItem value="local_business">Local Business</SelectItem>
              <SelectItem value="video_marketing">Video Marketing</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="influencer_marketing">Influencer Marketing</SelectItem>
              <SelectItem value="display">Display Advertising</SelectItem>
              <SelectItem value="product_demo">Product Demo</SelectItem>
              <SelectItem value="product_launch">Product Launch</SelectItem>
              <SelectItem value="all_industries">All Industries</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <div 
            key={template.id} 
            onClick={() => handleTemplateClick(template)}
            className="border border-border rounded-xl p-4 cursor-pointer bg-card hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{template.name}</h2>
              <div className="flex flex-col gap-1.5">
                {template.performance_score && template.performance_score >= 90 && (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    High Performer
                  </Badge>
                )}
                {template.difficulty_level === 'beginner' && (
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-xs">
                    Beginner Friendly
                  </Badge>
                )}
                {template.is_popular && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Popular
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground my-2">
              {template.description || 'No description available'}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
              {template.goal && (
                <span className={`px-2 py-1 rounded-md ${getGoalBadgeColor(template.goal)} flex items-center gap-1`}>
                  <Target className="w-3 h-3" />
                  {template.goal}
                </span>
              )}
              {template.performance_score && (
                <span className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-md">
                  📊 {template.performance_score}/100
                </span>
              )}
              {template.estimated_setup_time_minutes && (
                <span className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-md">
                  <Clock className="w-3 h-3" />
                  {template.estimated_setup_time_minutes} min
                </span>
              )}
              {template.industry && (
                <span className="px-2 py-1 bg-secondary/50 rounded-md">
                  🏢 {template.industry.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${getPlatformDotColor(template.platforms)}`}></span>
                {template.platforms.join(', ')}
              </span>
            </div>

            <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              Load & Customize Template
            </Button>
          </div>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && templates && templates.length > 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No templates match your search criteria. Try different keywords or filters.
        </div>
      )}

      {templates && templates.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No templates available yet. Check back soon!
        </div>
      )}
    </div>
  );
};

export default TemplateBrowser;
