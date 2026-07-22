// ✨ Generate Template — the primary Layer 3D entry point.
// Reads the global AI Context (brand, category, goal, platform), generates
// an editable Fabric.js template, and hands it off to the Visual Editor.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useAIContext } from "@/contexts/AIContext";
import { useAuth } from "@/hooks/useAuth";
import { AITemplateGeneratorService, type GeneratedTemplate } from "@/services/templates/generator";
import { setPendingEditorTemplate } from "@/lib/templateEditorSession";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateTemplateDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { brand, effectiveContext } = useAIContext();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratedTemplate | null>(null);

  const category = effectiveContext?.active_category ?? null;
  const platform = effectiveContext?.active_platform ?? "instagram";
  const goal = effectiveContext?.active_objective ?? "conversions";

  const handleGenerate = async () => {
    setBusy(true);
    setResult(null);
    try {
      const generated = await AITemplateGeneratorService.generate({
        brand,
        category,
        goal,
        platform,
        productName: prompt ? prompt.split(/[.,\n]/)[0].slice(0, 60) : null,
        prompt: prompt || null,
        userId: user?.id ?? null,
      });
      setResult(generated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate template");
    } finally {
      setBusy(false);
    }
  };

  const handleUse = () => {
    if (!result) return;
    setPendingEditorTemplate(result.template, "ai");
    onOpenChange(false);
    navigate("/visual-editor");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Generate Template
          </DialogTitle>
          <DialogDescription>
            AdVista AI will design a fully editable creative from your brand and campaign context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
            <Badge variant="outline">Brand: {brand?.name ?? "Default"}</Badge>
            <Badge variant="outline">Category: {category ?? "General"}</Badge>
            <Badge variant="outline">Goal: {goal}</Badge>
            <Badge variant="outline">Platform: {platform}</Badge>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Optional prompt (product, angle, offer)
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Summer Glow serum launch, 20% off first order"
              rows={3}
              disabled={busy}
            />
          </div>

          {result && (
            <div className="rounded-lg border bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{result.template.name}</p>
                <Badge variant="secondary">Confidence {Math.round(result.confidence * 100)}%</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div><strong className="text-foreground">Headline:</strong> {result.copy.headline}</div>
                <div><strong className="text-foreground">CTA:</strong> {result.copy.cta}</div>
                <div><strong className="text-foreground">Layout:</strong> {result.blueprint.layout.layout}</div>
                <div><strong className="text-foreground">Size:</strong> {result.blueprint.layout.aspect.width}×{result.blueprint.layout.aspect.height}</div>
              </div>
              {result.reasoning.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {result.reasoning.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          {result ? (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={busy}>
                <Wand2 className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Button onClick={handleUse}>Open in Editor</Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={busy}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateTemplateDialog;
