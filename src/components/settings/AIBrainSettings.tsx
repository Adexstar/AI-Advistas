import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Brain, Save, History, Lock, Globe, Cpu } from "lucide-react";

const MODELS = [
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", desc: "Best overall quality" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", desc: "Fast & cost-effective" },
  { id: "claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic", desc: "Best for analysis" },
  { id: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "Anthropic", desc: "Balanced speed & quality" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google", desc: "Multimodal expert" },
  { id: "mixtral-8x7b", label: "Mixtral 8x7B", provider: "Groq", desc: "Fastest inference" },
];

const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "groq", label: "Groq" },
  { id: "gemini", label: "Gemini" },
  { id: "anthropic", label: "Anthropic" },
];

const BRAIN_KEY = "advista:ai-brain";

type BrainPrefs = {
  model: string;
  creativity: number;
  learnFromData: boolean;
  shareAnonymous: boolean;
  storePrompts: boolean;
};

const defaultPrefs: BrainPrefs = {
  model: MODELS[0].id,
  creativity: 65,
  learnFromData: true,
  shareAnonymous: false,
  storePrompts: true,
};

function loadPrefs(): BrainPrefs {
  try {
    const raw = localStorage.getItem(BRAIN_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

const AIBrainSettings = () => {
  const [prefs, setPrefs] = useState<BrainPrefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      localStorage.setItem(BRAIN_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore quota errors */
    }
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" />Preferred Model</CardTitle>
          <CardDescription>Select the default AI model for all marketing operations. Specialist agents may override per-task.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSaved(false); setPrefs((prev) => ({ ...prev, model: m.id })); }}
                className={`min-w-0 rounded-xl border p-4 text-left transition ${
                  prefs.model === m.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="min-w-0 font-semibold text-sm">{m.label}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{m.provider}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Creativity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />Creativity</CardTitle>
          <CardDescription>Controls how strictly AI follows patterns versus exploring new approaches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conservative</span>
            <span className="font-semibold tabular-nums">{prefs.creativity}%</span>
            <span className="text-muted-foreground">Experimental</span>
          </div>
          <Slider value={[prefs.creativity]} onValueChange={([value]) => { setSaved(false); setPrefs((prev) => ({ ...prev, creativity: value })); }} min={0} max={100} step={5} />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Strict brand compliance</span>
            <span>Creative exploration</span>
          </div>
        </CardContent>
      </Card>

      {/* API Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />API Providers</CardTitle>
          <CardDescription>Keys live in the Supabase project environment. This screen cannot confirm or change them.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {PROVIDERS.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-[11px] text-muted-foreground">Not verified from this screen</p>
              </div>
              <Badge variant="outline" className="shrink-0">Setup required</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Prompt History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Prompt History</CardTitle>
          <CardDescription>View and manage recently sent AI prompts for debugging and audit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <History className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Prompt history will appear here once AI operations begin.</p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Privacy & Data</CardTitle>
          <CardDescription>Control how AI learns from your campaigns and whether data is used for training.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="learnFromData" className="text-sm font-medium">Learn from my campaigns</Label>
              <p className="text-[11px] text-muted-foreground">Saved on this device only. It does not change how the model is trained.</p>
            </div>
            <Switch id="learnFromData" className="shrink-0" checked={prefs.learnFromData} onCheckedChange={(value) => { setSaved(false); setPrefs((prev) => ({ ...prev, learnFromData: value })); }} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="shareAnonymous" className="text-sm font-medium">Share anonymous usage data</Label>
              <p className="text-[11px] text-muted-foreground">Saved on this device. No usage data is sent from this control.</p>
            </div>
            <Switch id="shareAnonymous" className="shrink-0" checked={prefs.shareAnonymous} onCheckedChange={(value) => { setSaved(false); setPrefs((prev) => ({ ...prev, shareAnonymous: value })); }} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="storePrompts" className="text-sm font-medium">Store prompt history</Label>
              <p className="text-[11px] text-muted-foreground">Preference only. Prompt history is not stored yet.</p>
            </div>
            <Switch id="storePrompts" className="shrink-0" checked={prefs.storePrompts} onCheckedChange={(value) => { setSaved(false); setPrefs((prev) => ({ ...prev, storePrompts: value })); }} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}><Save className="mr-2 h-4 w-4" />{saved ? "Saved on this device" : "Save AI Brain Settings"}</Button>
      </div>
    </div>
  );
};

export default AIBrainSettings;
