import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Star, 
  Copy, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Filter,
  Heart,
  Eye,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAutoFillTemplate } from '@/hooks/useAIAssistant';
import { useCombinedTemplates } from '@/hooks/useFreepikTemplates';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string[];
  content: {
    headline: string;
    description: string;
    cta: string;
    audience: string;
    visualStyle: string;
  };
  performance: {
    avgCtr: number;
    avgConversion: number;
    usageCount: number;
  };
  tags: string[];
  isPopular: boolean;
  isFavorite: boolean;
  createdAt: string;
  thumbnail?: string;
}

interface TemplateSystemProps {
  onUseTemplate: (template: Template) => void;
  onSaveAsTemplate?: (templateData: any) => void;
  productName?: string;
  platform?: string;
  onAutoFill?: (templateId: string, filledData: any) => void;
}

export const TemplateSystem = ({ onUseTemplate, onSaveAsTemplate, productName, platform, onAutoFill }: TemplateSystemProps) => {
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'social-media',
    tags: ''
  });

  const { mutate: autoFillTemplate, isPending: isAutoFilling } = useAutoFillTemplate();
  const { 
    templates: allTemplates, 
    isLoading, 
    searchAllTemplates, 
    isSearchingFreepik 
  } = useCombinedTemplates();

  // Convert Freepik templates to local Template format
  const convertToLocalTemplate = (template: any): Template => ({
    id: template.id,
    name: template.name,
    description: template.description || 'Professional ad template',
    category: template.template_source === 'freepik' ? 'freepik' : 'internal',
    platform: ['facebook', 'instagram', 'google'], // Default platforms
    content: {
      headline: 'Auto-generated headline',
      description: 'AI will fill this content',
      cta: 'Learn More',
      audience: 'General Audience',
      visualStyle: 'Professional design'
    },
    performance: {
      avgCtr: 0,
      avgConversion: 0,
      usageCount: 0
    },
    tags: template.template_source ? [template.template_source] : ['template'],
    isPopular: false,
    isFavorite: false,
    createdAt: template.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    thumbnail: template.thumbnail_url || template.preview_url
  });

  const templates = allTemplates.map(convertToLocalTemplate);

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'ecommerce', name: 'E-commerce' },
    { id: 'app-promotion', name: 'App Promotion' },
    { id: 'services', name: 'Services' },
    { id: 'events', name: 'Events' },
    { id: 'content', name: 'Content Marketing' },
    { id: 'lead-gen', name: 'Lead Generation' },
    { id: 'freepik', name: 'Freepik Templates' },
    { id: 'internal', name: 'Internal Templates' },
  ];

  const platforms = [
    { id: 'all', name: 'All Platforms' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'google', name: 'Google Ads' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'twitter', name: 'Twitter' },
  ];

  useEffect(() => {
    setFilteredTemplates(templates);
  }, [templates]);

  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(t => t.platform.includes(selectedPlatform));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, selectedPlatform, searchQuery]);

  const handleAutoFillTemplate = (template: Template) => {
    if (!productName) {
      toast({
        title: "Product name required",
        description: "Please enter a product name to use AI auto-fill",
        variant: "destructive",
      });
      return;
    }

    autoFillTemplate({
      templateId: template.id,
      productName,
      platform: platform || 'facebook',
      templateStructure: {
        elements: ['headline', 'description', 'cta']
      }
    }, {
      onSuccess: (data) => {
        onAutoFill?.(template.id, data);
        toast({
          title: "Template Auto-Filled",
          description: `${template.name} has been filled with AI-generated content.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Auto-fill failed",
          description: "Failed to generate AI content for this template",
          variant: "destructive",
        });
        console.error(error);
      }
    });
  };

  const handleUseTemplate = (template: Template) => {
    onUseTemplate(template);
    toast({
      title: "Template Applied",
      description: `${template.name} has been applied to your ad creator.`,
    });
  };

  const handleToggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      ...newTemplate,
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      isPopular: false,
      isFavorite: false,
      performance: { avgCtr: 0, avgConversion: 0, usageCount: 0 }
    };

    onSaveAsTemplate?.(templateData);
    setShowSaveTemplateDialog(false);
    setNewTemplate({ name: '', description: '', category: 'social-media', tags: '' });

    toast({
      title: "Template Saved",
      description: "Your template has been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-muted-foreground">Choose from proven ad templates to get started faster</p>
        </div>
        {onSaveAsTemplate && (
          <Button onClick={() => setShowSaveTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current as Template
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                searchAllTemplates({ query: e.target.value.trim() });
              }
            }}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {platforms.map(platform => (
              <option key={platform.id} value={platform.id}>{platform.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      {(isLoading || isSearchingFreepik) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <div className="h-32 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className="h-full transition-all hover:shadow-soft border-border/50 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        {template.isPopular && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(template.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart 
                        className={`h-4 w-4 ${template.isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Template Preview Image */}
                  <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
                    {template.thumbnail ? (
                      <img 
                        src={template.thumbnail} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Template Preview Text */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <h4 className="font-medium text-sm">Preview:</h4>
                    <div className="text-xs space-y-1">
                      <p><strong>Headline:</strong> {template.content.headline}</p>
                      <p><strong>Description:</strong> {template.content.description.slice(0, 60)}...</p>
                      <p><strong>CTA:</strong> {template.content.cta}</p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg CTR</p>
                      <p className="font-medium text-sm">{template.performance.avgCtr}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversion</p>
                      <p className="font-medium text-sm">{template.performance.avgConversion}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Used</p>
                      <p className="font-medium text-sm">{template.performance.usageCount}×</p>
                    </div>
                  </div>

                  {/* Platform and Tags */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {template.platform.map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    {productName && (
                      <Button 
                        onClick={() => handleAutoFillTemplate(template)}
                        variant="outline"
                        size="sm"
                        disabled={isAutoFilling}
                        className="px-3"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="px-3">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Ad Template"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what makes this template effective..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <select
                id="template-category"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.slice(1).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="template-tags">Tags (comma-separated)</Label>
              <Input
                id="template-tags"
                value={newTemplate.tags}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="ecommerce, conversion, social-proof"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveTemplateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};