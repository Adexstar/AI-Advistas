import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Mode = "manual" | "assisted" | "smart" | "growth";

const modes: { id: Mode; label: string; desc: string; beta?: boolean }[] = [
  { id: "manual", label: "Manual", desc: "AI stays out of the way. You drive everything." },
  { id: "assisted", label: "Assisted", desc: "AI suggests; you approve every change." },
  { id: "smart", label: "Smart", desc: "AI auto-applies low-risk optimizations." },
  { id: "growth", label: "Growth Agent", desc: "Autonomous campaign optimization loop.", beta: true },
];

const toggleGroups: { title: string; items: { key: string; label: string; hint?: string }[] }[] = [
  {
    title: "Approval Rules",
    items: [
      { key: "alwaysAsk", label: "Always Ask" },
      { key: "autoDrafts", label: "Auto Apply Drafts" },
      { key: "autoImprove", label: "Auto Improve Copy" },
    ],
  },
  {
    title: "Brand Protection",
    items: [
      { key: "lockLogo", label: "Lock Logo" },
      { key: "lockColors", label: "Lock Colors" },
      { key: "lockFonts", label: "Lock Fonts" },
      { key: "lockTone", label: "Lock Tone of Voice" },
    ],
  },
  {
    title: "Automation",
    items: [
      { key: "optCampaigns", label: "Optimize Campaigns" },
      { key: "audienceSug", label: "Audience Suggestions" },
      { key: "headlineSug", label: "Headline Suggestions" },
      { key: "creativeSug", label: "Creative Suggestions" },
      { key: "budgetSug", label: "Budget Suggestions" },
    ],
  },
  {
    title: "Learning",
    items: [
      { key: "learnMine", label: "Learn From My Campaigns" },
      { key: "learnWinners", label: "Learn Winning Ads" },
      { key: "improveRec", label: "Improve Recommendations" },
    ],
  },
];

const defaults: Record<string, boolean> = {
  alwaysAsk: true,
  autoDrafts: false,
  autoImprove: false,
  lockLogo: true,
  lockColors: true,
  lockFonts: true,
  lockTone: false,
  optCampaigns: false,
  audienceSug: true,
  headlineSug: true,
  creativeSug: true,
  budgetSug: false,
  learnMine: true,
  learnWinners: true,
  improveRec: true,
};

const AIPreferences = () => {
  const [mode, setMode] = useState<Mode>("assisted");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaults);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Mode</CardTitle>
          <CardDescription>Set how much autonomy AdVista AI has in your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                mode === m.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{m.label}</p>
                {m.beta && <Badge variant="secondary" className="rounded-full text-[10px]">Beta</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {toggleGroups.map((g) => (
        <Card key={g.title}>
          <CardHeader>
            <CardTitle className="text-base">{g.title}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {g.items.map((it) => (
              <div key={it.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <Label htmlFor={it.key} className="text-sm font-medium">{it.label}</Label>
                <Switch
                  id={it.key}
                  checked={prefs[it.key] ?? false}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [it.key]: v }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button>Save AI Preferences</Button>
      </div>
    </div>
  );
};

export default AIPreferences;
