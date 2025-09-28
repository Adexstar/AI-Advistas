import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RotateCcw, Check, X } from 'lucide-react';
import { useGenerateAdCopy } from '@/hooks/useAIAssistant';
import { toast } from 'sonner';

interface SmartCopyEditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  productName?: string;
  platform?: string;
  textType?: 'headline' | 'subtitle' | 'cta' | 'description';
  maxLength?: number;
  className?: string;
}

export const SmartCopyEditor: React.FC<SmartCopyEditorProps> = ({
  text,
  onTextChange,
  productName = '',
  platform = '',
  textType = 'description',
  maxLength,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [showAIButton, setShowAIButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { mutate: generateCopy, isPending } = useGenerateAdCopy();

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  const handleMouseEnter = () => {
    setShowAIButton(true);
  };

  const handleMouseLeave = () => {
    if (!isEditing) {
      setShowAIButton(false);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSave = () => {
    onTextChange(editedText);
    setIsEditing(false);
    setShowAIButton(false);
    toast.success('Text updated successfully');
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
    setShowAIButton(false);
  };

  const handleAIRewrite = () => {
    if (!productName) {
      toast.error('Product name is required for AI assistance');
      return;
    }

    generateCopy({
      productName,
      platform,
      targetAudience: 'General audience',
      additionalContext: `Rewrite this ${textType}: "${text}"`
    }, {
      onSuccess: (data) => {
        let newText = '';
        switch (textType) {
          case 'headline':
            newText = data.headline;
            break;
          case 'subtitle':
            newText = data.subtitle;
            break;
          case 'cta':
            newText = data.cta;
            break;
          default:
            newText = data.subtitle; // Use subtitle for general description
        }
        setEditedText(newText);
        toast.success('AI rewrote your text!');
      },
      onError: (error) => {
        toast.error('Failed to generate new copy');
        console.error(error);
      }
    });
  };

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <Textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="min-h-[60px] resize-none"
          maxLength={maxLength}
        />
        {maxLength && (
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {editedText.length}/{maxLength}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAIRewrite}
            disabled={isPending}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {isPending ? 'Rewriting...' : 'AI Rewrite'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleStartEdit}
    >
      <div className="p-2 rounded border-2 border-transparent group-hover:border-primary/20 transition-colors">
        {text || <span className="text-muted-foreground italic">Click to add text...</span>}
      </div>
      
      {showAIButton && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 px-2 bg-background/95 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAIRewrite();
            }}
            disabled={isPending}
          >
            <Sparkles className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 px-2 bg-background/95 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStartEdit();
            }}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};