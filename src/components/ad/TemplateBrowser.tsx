import { useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LayoutTemplate } from 'lucide-react';

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
    isPopular: true,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <LayoutTemplate className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Template Library</h1>
      </div>
      <p className="text-lg text-muted-foreground -mt-3">Choose from proven, high-performing templates to get started faster.</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow focus:border-primary"
        />
        <Select value={filterGoal} onValueChange={setFilterGoal}>
          <SelectTrigger className="sm:w-[180px] focus:ring-primary">
            <SelectValue placeholder="Filter by Goal" />
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

      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.templateId}
            className="hover:shadow-md hover:border-primary transition-all cursor-pointer"
            onClick={() => handleTemplateClick(template)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                <div className="flex gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    template.goal === 'Conversion' ? 'bg-secondary/10 text-secondary' :
                    template.goal === 'Engagement' ? 'bg-pink-500/10 text-pink-500' :
                    template.goal === 'Traffic' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-purple-500/10 text-purple-500'
                  }`}>
                    {template.goal}
                  </span>
                  {template.isPopular && (
                    <span className="text-xs font-medium bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground my-2">{template.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2 border-t">
                <span>Platforms: {template.platforms.join(', ')}</span>
                <span>| Used 450+ times</span>
              </div>
              <Button className="w-full mt-4" variant="default">
                Load & Customize Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No templates found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default TemplateBrowser;
