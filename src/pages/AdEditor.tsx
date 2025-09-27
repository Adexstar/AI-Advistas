import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Template {
  id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  schema: {
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'textarea' | 'image';
      default: string;
    }>;
    layout: Record<string, any>;
  };
}

interface AdContent {
  [key: string]: string;
}

const AdEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [content, setContent] = useState<AdContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      const templateData = {
        ...data,
        schema: data.schema as Template['schema']
      };
      setTemplate(templateData);
      
      // Initialize content with default values
      const initialContent: AdContent = {};
      templateData.schema.fields.forEach((field) => {
        initialContent[field.name] = field.default;
      });
      setContent(initialContent);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
      navigate('/ad-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    if (!user || !template) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          template_id: template.id,
          content,
          preview_url: template.preview_url
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ad saved successfully",
      });
      
      navigate('/my-ads');
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: "Failed to save ad",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    if (!template) return null;

    const { layout } = template.schema;
    
    return (
      <div className="relative bg-white border rounded-lg" style={{ width: '400px', height: '300px' }}>
        {template.schema.fields.map((field) => {
          const fieldLayout = layout[field.name];
          const value = content[field.name] || field.default;
          
          if (field.type === 'image') {
            return (
              <img
                key={field.name}
                src={value}
                alt={field.label}
                className="absolute object-cover"
                style={{
                  left: fieldLayout.x,
                  top: fieldLayout.y,
                  width: fieldLayout.width,
                  height: fieldLayout.height,
                }}
              />
            );
          }
          
          return (
            <div
              key={field.name}
              className="absolute"
              style={{
                left: fieldLayout.x,
                top: fieldLayout.y,
                fontSize: fieldLayout.fontSize,
                color: fieldLayout.color,
                fontWeight: fieldLayout.fontWeight,
                backgroundColor: fieldLayout.backgroundColor,
                padding: fieldLayout.padding,
              }}
            >
              {value}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Template not found</h3>
          <Button onClick={() => navigate('/ad-templates')}>
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/ad-templates')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Ad Editor</h1>
                <p className="text-muted-foreground">Editing: {template.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving || !user}>
                <Save className="h-4 w-4 mr-2" />
                Save Ad
              </Button>
              <Button onClick={() => toast({ title: "Export", description: "Export functionality coming soon" })}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.schema.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={content[field.name] || field.default}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.default}
                        rows={3}
                      />
                    ) : field.type === 'image' ? (
                      <Input
                        id={field.name}
                        type="url"
                        value={content[field.name] || field.default}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder="Enter image URL"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        value={content[field.name] || field.default}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.default}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8">
                {renderPreview()}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdEditor;