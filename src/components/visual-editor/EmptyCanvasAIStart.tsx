import React, { useState } from "react";
import { Sparkles, Layout, ImageIcon, Rss, Film, PresentationIcon, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const OPTIONS = [
  { id: "layout", label: "Generate Layout", icon: Layout },
  { id: "banner", label: "Generate Banner", icon: ImageIcon },
  { id: "social", label: "Generate Social Post", icon: Rss },
  { id: "story", label: "Generate Story", icon: Zap },
  { id: "video", label: "Generate Video Scene", icon: Film },
  { id: "slide", label: "Generate Presentation Slide", icon: PresentationIcon },
];

interface Props {
  visible: boolean;
}

export const EmptyCanvasAIStart: React.FC<Props> = ({ visible }) => {
  const [choice, setChoice] = useState<string | null>(null);
  const [brief, setBrief] = useState("");

  if (!visible) return null;

  const active = OPTIONS.find((o) => o.id === choice);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
        <div className="pointer-events-auto max-w-md rounded-2xl border bg-card/95 p-5 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Start with AI</p>
              <p className="text-[11px] text-muted-foreground">Preview before anything lands on your canvas.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              return (
                <button
                  key={o.id}
                  onClick={() => setChoice(o.id)}
                  className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 text-left text-[11px] font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Or start blank — pick any element from the left panel.
          </p>
        </div>
      </div>

      <Dialog open={!!choice} onOpenChange={(v) => !v && setChoice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {active?.label}
            </DialogTitle>
            <DialogDescription>
              Describe what you want. AI will draft a preview — nothing is applied until you approve.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Summer sale for a skincare brand, warm pastel tones, feminine, minimal."
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setChoice(null)}>Cancel</Button>
            <Button
              onClick={() => {
                toast({ title: "Draft queued", description: "Your AI preview will appear shortly." });
                setChoice(null);
                setBrief("");
              }}
            >
              Generate Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
