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
  { id: "openai", label: "OpenAI", configured: true },
  { id: "groq", label: "Groq", configured: true },
  { id: "gemini", label: "Gemini", configured: false },
  { id: "anthropic", label: "Anthropic", configured: false },
];

const AIBrainSettings = () => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [creativity, setCreativity] = useState([65]);
  const [providers, setProviders] = useState(PROVIDERS);

  const toggleProvider = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, configured: !p.configured } : p))
    );
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
                onClick={() => setSelectedModel(m.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedModel === m.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-semibold text-sm">{m.label}</p>
                  <Badge variant="outline" className="text-[10px]">{m.provider}</Badge>
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
            <span className="font-semibold">{creativity}%</span>
            <span className="text-muted-foreground">Experimental</span>
          </div>
          <Slider value={creativity} onValueChange={setCreativity} min={0} max={100} step={5} />
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
          <CardDescription>Enable or disable AI providers. Keys must be configured in your Supabase project environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <Label htmlFor={`provider-${p.id}`} className="text-sm font-medium capitalize">{p.label}</Label>
                <p className="text-[11px] text-muted-foreground">
                  {p.configured ? "Configured" : "Not configured"}
                </p>
              </div>
              <Switch
                id={`provider-${p.id}`}
                checked={p.configured}
                onCheckedChange={() => toggleProvider(p.id)}
              />
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
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="learnFromData" className="text-sm font-medium">Learn from my campaigns</Label>
              <p className="text-[11px] text-muted-foreground">AI improves by analyzing your campaign performance data.</p>
            </div>
            <Switch id="learnFromData" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="shareAnonymous" className="text-sm font-medium">Share anonymous usage data</Label>
              <p className="text-[11px] text-muted-foreground">Help improve AdVista by sharing anonymized AI interaction patterns.</p>
            </div>
            <Switch id="shareAnonymous" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="storePrompts" className="text-sm font-medium">Store prompt history</Label>
              <p className="text-[11px] text-muted-foreground">Keep a record of prompts for debugging and audit trails.</p>
            </div>
            <Switch id="storePrompts" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button><Save className="mr-2 h-4 w-4" />Save AI Brain Settings</Button>
      </div>
    </div>
  );
};

export default AIBrainSettings;
