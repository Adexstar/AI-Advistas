import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useGenerateAdDraft } from "@/hooks/useGenerateAdDraft";
import type { AdDraftResponse } from "@/schemas/adDraftSchema";
import { toast } from "@/hooks/use-toast";

interface QuickDraftPromptProps {
  onDraftGenerated: (draft: AdDraftResponse) => void;
  onSkip: () => void;
}

const QuickDraftPrompt = ({ onDraftGenerated, onSkip }: QuickDraftPromptProps) => {
  const [prompt, setPrompt] = useState("");
  const [goal, setGoal] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  
  const generateDraftMutation = useGenerateAdDraft();

  const examplePrompts = [
    "Sell vintage t-shirts to young adults in NYC on Instagram with a goal of website traffic",
    "Promote fitness app to college students on TikTok for app downloads",
    "Advertise organic skincare to parents aged 30-45 on Facebook for awareness"
  ];

  const handleGenerate = async () => {
    if (prompt.length < 20) {
      toast({
        title: "Prompt too short",
        description: "Please provide at least 20 characters describing your ad",
        variant: "destructive",
      });
      return;
    }

    try {
      const draft = await generateDraftMutation.mutateAsync({
        prompt,
        goal: goal as any || undefined,
        platform: platform ? [platform] : undefined,
      });

      toast({
        title: "AI Draft Generated! ✨",
        description: "Your ad has been pre-filled. Review and customize it below.",
      });

      onDraftGenerated(draft);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate ad draft",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-4xl mx-auto py-12"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Ad Creation</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">Create Your Ad in Seconds</h1>
        <p className="text-lg text-muted-foreground">
          Describe your ad in plain language, and let AI generate a complete draft for you
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Quick Draft Generator
          </CardTitle>
          <CardDescription>
            Tell us about your ad, and we'll pre-fill everything. You'll have full control to edit afterwards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe Your Ad *</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., Sell vintage t-shirts to young adults in NYC on Instagram with a goal of website traffic"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length}/500 characters • Minimum 20 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Campaign Goal (Optional)</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                  <SelectItem value="conversion">Conversions</SelectItem>
                  <SelectItem value="traffic">Website Traffic</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Primary Platform (Optional)</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Need inspiration? Try these examples:</p>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-background"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generateDraftMutation.isPending || prompt.length < 20}
              className="flex-1"
              size="lg"
            >
              {generateDraftMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating AI Draft...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate AI Draft
                </>
              )}
            </Button>
            <Button
              onClick={onSkip}
              variant="outline"
              size="lg"
              className="sm:w-auto"
            >
              Start from Scratch
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {generateDraftMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                <span>AI is analyzing your request...</span>
              </div>
              <p className="text-xs">This usually takes 3-5 seconds</p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>✨ AI will generate copy, select platforms, suggest audiences, and more</p>
        <p className="mt-1">You'll be able to review and customize everything before creating your ad</p>
      </div>
    </motion.div>
  );
};

export default QuickDraftPrompt;
