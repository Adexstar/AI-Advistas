import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TemplateData {
  templateId: string;
  name: string;
  description: string;
  goal: 'Conversion' | 'Awareness' | 'Traffic' | 'Engagement';
  platforms: string[];
  isPopular: boolean;
  initialForm: any;
}

const mockTemplates: TemplateData[] = [
  {
    templateId: 'temp-1',
    name: 'E-commerce Sale Blitz',
    description: 'Optimized for quick purchases with clear CTAs and urgency.',
    goal: 'Conversion',
    platforms: ['Facebook', 'Instagram'],
    isPopular: false,
    initialForm: { product: 'E-commerce Product', details: 'Limited time sale with exclusive discounts', adType: 'image', platforms: ['facebook', 'instagram'], websiteUrl: 'https://shop.com' }
  },
  {
    templateId: 'temp-2',
    name: 'TikTok Viral Video',
    description: 'Short-form video template built for high retention and shareability on TikTok/Reels.',
    goal: 'Engagement',
    platforms: ['TikTok', 'Instagram'],
    isPopular: true,
    initialForm: { product: 'App Promotion', details: 'Engaging short-form video content designed for virality', adType: 'video', platforms: ['tiktok', 'instagram'] }
  },
  {
    templateId: 'temp-3',
    name: 'B2B Lead Generation',
    description: 'Professional layout optimized for collecting high-quality leads on LinkedIn.',
    goal: 'Traffic',
    platforms: ['LinkedIn', 'Google'],
    isPopular: false,
    initialForm: { product: 'Service Offer', details: 'Professional B2B solution for enterprise clients', adType: 'image', platforms: ['linkedin', 'google'] }
  },
];

interface TemplateBrowserProps {
  onTemplateSelect: (templateData: TemplateData) => void;
}

const TemplateBrowser = ({ onTemplateSelect }: TemplateBrowserProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGoal, setFilterGoal] = useState('all');

  const filteredTemplates = mockTemplates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterGoal === 'all' || t.goal === filterGoal)
  );

  const handleTemplateClick = (template: TemplateData) => {
    setIsLoading(true);
    setTimeout(() => {
      onTemplateSelect(template);
      setIsLoading(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <Card className="min-h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Loading Template...</p>
        <p className="text-sm text-muted-foreground">Preparing proven content and layouts.</p>
      </Card>
    );
  }

  const getGoalBadgeColor = (goal: string) => {
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
      <div className="flex gap-2">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm"
        />
        <Select value={filterGoal} onValueChange={setFilterGoal}>
          <SelectTrigger className="w-[140px] text-sm">
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
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <div 
            key={template.templateId} 
            onClick={() => handleTemplateClick(template)}
            className="border border-border rounded-xl p-4 cursor-pointer bg-card hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{template.name}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getGoalBadgeColor(template.goal)}`}>
                {template.goal}
              </span>
            </div>
            <p className="text-sm text-muted-foreground my-2">{template.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${getPlatformDotColor(template.platforms)}`}></span>
                {template.platforms.join(', ')}
              </span>
              <span>|</span>
              <span>Used {template.isPopular ? '1.2K+' : '450+'} times</span>
            </div>
            <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              Load & Customize Template
            </Button>
          </div>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">No templates found matching your criteria.</div>
      )}
    </div>
  );
};

export default TemplateBrowser;
