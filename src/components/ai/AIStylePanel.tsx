import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Palette, RefreshCw } from 'lucide-react';
import { useSuggestAdStyle, StyleSuggestion } from '@/hooks/useAIAssistant';
import { toast } from 'sonner';

interface AIStylePanelProps {
  productCategory: string;
  platform: string;
  onStyleSelect?: (style: StyleSuggestion) => void;
}

export const AIStylePanel: React.FC<AIStylePanelProps> = ({
  productCategory,
  platform,
  onStyleSelect
}) => {
  const [suggestions, setSuggestions] = useState<StyleSuggestion[]>([]);
  const { mutate: suggestStyle, isPending } = useSuggestAdStyle();

  const handleGenerateStyles = () => {
    suggestStyle({
      productCategory,
      platform,
      brandPersonality: 'Professional'
    }, {
      onSuccess: (data) => {
        setSuggestions(data.styles);
        toast.success('AI style suggestions generated!');
      },
      onError: (error) => {
        toast.error('Failed to generate style suggestions');
        console.error(error);
      }
    });
  };

  const handleStyleSelect = (style: StyleSuggestion) => {
    onStyleSelect?.(style);
    toast.success(`Applied ${style.name} style`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          AI Style Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleGenerateStyles} 
          disabled={isPending}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate AI Styles'
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Suggested Styles for {productCategory} on {platform}
            </h4>
            
            {suggestions.map((style, index) => (
              <Card key={index} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{style.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      {style.fontFamily}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {style.description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: style.primaryColor }}
                      title={`Primary: ${style.primaryColor}`}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: style.secondaryColor }}
                      title={`Secondary: ${style.secondaryColor}`}
                    />
                    <span className="text-xs text-muted-foreground ml-2">
                      Color Palette
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStyleSelect(style)}
                    className="w-full mt-2"
                  >
                    Apply Style
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};