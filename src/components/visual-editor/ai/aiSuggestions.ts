// Lightweight local suggestion engine for the Visual Editor AI Studio.
// No backend calls yet — deterministic mock output shaped for the AI Preview dialog.
// All AI actions in the editor route through here so we can later swap in a real
// service without touching UI code.

export type AISuggestionKind = "text" | "image" | "video" | "layout" | "quick" | "timeline";

export interface AISuggestion {
  id: string;
  kind: AISuggestionKind;
  action: string;
  title: string;
  reason: string;
  confidence: number; // 0-100
  estImprovement?: string;
  basedOn: string[];
  before: { type: "text" | "image" | "video" | "layout"; value: string };
  after: { type: "text" | "image" | "video" | "layout"; value: string };
  apply?: () => void; // optional imperative apply hook (fabric mutations, etc.)
}

const clamp = (n: number, lo = 60, hi = 98) => Math.max(lo, Math.min(hi, Math.round(n)));

const withCtx = (ctx: AIContextInput, extra: string[] = []) => {
  const base = [
    ctx.brand ? `Brand: ${ctx.brand}` : "Brand Kit",
    ctx.category ? `Category: ${ctx.category}` : "Category",
    ctx.platform ? `Platform: ${ctx.platform}` : "Platform",
    ctx.goal ? `Goal: ${ctx.goal}` : "Campaign objective",
    "Platform best practices",
  ];
  return [...base, ...extra];
};

export interface AIContextInput {
  brand?: string | null;
  category?: string | null;
  platform?: string | null;
  goal?: string | null;
  audience?: string | null;
}

// ---------- TEXT ----------
export const TEXT_ACTIONS = [
  "Improve Copy",
  "Generate 5 Variations",
  "Improve Headline",
  "Improve CTA",
  "Rewrite Using Brand Voice",
  "Shorten Copy",
  "Expand Copy",
  "Add Urgency",
  "Add Emotion",
  "Luxury Tone",
  "Beauty Tone",
  "Fashion Tone",
  "Real Estate Tone",
  "SaaS Tone",
  "Professional Tone",
  "Friendly Tone",
  "High Conversion Version",
] as const;

const rewriters: Record<string, (t: string) => string> = {
  "Improve Copy": (t) => t.replace(/\b(good|nice|great)\b/gi, "outstanding").trim() || "A sharper way to say it.",
  "Improve Headline": (t) => t.toUpperCase().slice(0, 40) || "HEADLINE THAT CONVERTS",
  "Improve CTA": (t) => (t.length > 20 ? "Shop Now →" : `${t.trim()} →`),
  "Shorten Copy": (t) => t.split(" ").slice(0, 6).join(" "),
  "Expand Copy": (t) => `${t} — crafted for the moments that matter, built for people who care.`,
  "Add Urgency": (t) => `${t} — Limited time. Ends soon.`,
  "Add Emotion": (t) => `${t}. Feel the difference.`,
  "Luxury Tone": (t) => `Discover ${t.toLowerCase()} — refined, timeless, unmistakably yours.`,
  "Beauty Tone": (t) => `Glow with ${t.toLowerCase()}. Radiance you can feel.`,
  "Fashion Tone": (t) => `${t}. Bold silhouettes. Effortless energy.`,
  "Real Estate Tone": (t) => `${t}. Address the extraordinary.`,
  "SaaS Tone": (t) => `${t}. Ship faster. Scale smarter.`,
  "Professional Tone": (t) => `${t}. Built for teams that mean business.`,
  "Friendly Tone": (t) => `${t} — friends, this one's for you.`,
  "High Conversion Version": (t) => `${t.split(" ").slice(0, 5).join(" ")} — 50% off today only.`,
  "Rewrite Using Brand Voice": (t) => `${t} · on-brand, on-tone.`,
};

export function buildTextSuggestion(
  action: string,
  currentText: string,
  ctx: AIContextInput,
): AISuggestion {
  let after = currentText;
  if (action === "Generate 5 Variations") {
    after = [
      currentText || "Your headline here",
      `${currentText || "Your headline"} — reimagined`,
      `${(currentText || "Your headline").toUpperCase()}`,
      `New. ${currentText || "Now available"}.`,
      `${currentText || "Discover"} — limited edition`,
    ].join("\n• ");
    after = `• ${after}`;
  } else {
    const fn = rewriters[action];
    after = fn ? fn(currentText || "Your text") : `${currentText} (${action})`;
  }

  return {
    id: crypto.randomUUID(),
    kind: "text",
    action,
    title: action,
    reason:
      action === "Improve Headline"
        ? "Shorter, high-contrast headlines outperform long ones on mobile placements."
        : action.includes("Tone")
        ? `Adjusted voice to match ${action.replace(" Tone", "")} category conventions.`
        : "Refined to lift clarity, rhythm and conversion signal.",
    confidence: clamp(78 + Math.random() * 20),
    estImprovement: action === "Improve Headline" ? "+12% CTR" : action === "High Conversion Version" ? "+18% CVR" : "+8% engagement",
    basedOn: withCtx(ctx, ["Winning historical creatives", "Copywriting heuristics"]),
    before: { type: "text", value: currentText || "(empty)" },
    after: { type: "text", value: after },
  };
}

// ---------- IMAGE ----------
export const IMAGE_ACTIONS = [
  "Remove Background",
  "Replace Background",
  "Improve Lighting",
  "Expand Canvas",
  "Increase Quality",
  "Generate Lifestyle Scene",
  "Replace Product Image",
  "Apply Brand Colors",
  "Generate Product Mockup",
  "Create Seasonal Version",
  "Create Premium Version",
] as const;

export function buildImageSuggestion(action: string, ctx: AIContextInput): AISuggestion {
  return {
    id: crypto.randomUUID(),
    kind: "image",
    action,
    title: action,
    reason: `${action} tuned for ${ctx.category || "your category"} on ${ctx.platform || "current platform"}.`,
    confidence: clamp(72 + Math.random() * 24),
    estImprovement: "+9% attention score",
    basedOn: withCtx(ctx, ["Brand palette", "Visual composition rules"]),
    before: { type: "image", value: "current" },
    after: { type: "image", value: `preview:${action}` },
  };
}

// ---------- VIDEO ----------
export const VIDEO_ACTIONS = [
  "Generate Hook",
  "Auto Caption",
  "Highlight Product",
  "Create 15 Second Version",
  "Create TikTok Version",
  "Create Instagram Version",
  "Create Facebook Version",
  "Replace Music",
  "Generate B-roll",
  "Remove Dead Space",
  "Add CTA Ending",
  "Improve Engagement",
] as const;

export function buildVideoSuggestion(action: string, ctx: AIContextInput): AISuggestion {
  return {
    id: crypto.randomUUID(),
    kind: "video",
    action,
    title: action,
    reason:
      action.includes("TikTok") || action.includes("Instagram") || action.includes("Facebook")
        ? "Reformats aspect ratio, pacing and safe zones to the platform's top-performing pattern."
        : `${action} improves the first 3 seconds — the biggest lever for view-through.`,
    confidence: clamp(75 + Math.random() * 22),
    estImprovement: "+15% view-through",
    basedOn: withCtx(ctx, ["Hook analytics", "Platform pacing rules"]),
    before: { type: "video", value: "current" },
    after: { type: "video", value: `preview:${action}` },
  };
}

// ---------- LAYOUT ----------
export const LAYOUT_ACTIONS = [
  "Improve Layout",
  "Align Automatically",
  "Balance Spacing",
  "Improve Readability",
  "Optimize For Mobile",
  "Optimize For Desktop",
  "Optimize For Platform",
  "Increase Conversion Focus",
] as const;

export function buildLayoutSuggestion(action: string, ctx: AIContextInput): AISuggestion {
  return {
    id: crypto.randomUUID(),
    kind: "layout",
    action,
    title: action,
    reason: `${action} applied using ${ctx.category || "category"} conversion patterns.`,
    confidence: clamp(80 + Math.random() * 18),
    estImprovement: "+7% conversion focus",
    basedOn: withCtx(ctx, ["Grid + hierarchy rules", "Mobile safe zones"]),
    before: { type: "layout", value: "current" },
    after: { type: "layout", value: `preview:${action}` },
  };
}

// ---------- QUICK ACTIONS ----------
export const QUICK_ACTIONS = [
  "Generate 5 Variations",
  "Create A/B Test",
  "Resize For All Platforms",
  "Apply Brand Kit",
  "Optimize For Mobile",
  "Optimize For Facebook",
  "Optimize For Instagram",
  "Optimize For TikTok",
  "Optimize For LinkedIn",
  "Generate New Creative",
  "Duplicate Creative",
  "Generate Carousel",
  "Generate Story",
  "Generate Reel",
  "Generate Banner",
] as const;

export function buildQuickSuggestion(action: string, ctx: AIContextInput): AISuggestion {
  return {
    id: crypto.randomUUID(),
    kind: "quick",
    action,
    title: action,
    reason: `Workflow shortcut — ${action.toLowerCase()} using current brand and category context.`,
    confidence: clamp(82 + Math.random() * 15),
    estImprovement: action.startsWith("Optimize") ? "+11% platform fit" : "+10% velocity",
    basedOn: withCtx(ctx, ["Workflow templates"]),
    before: { type: "layout", value: "current creative" },
    after: { type: "layout", value: `plan:${action}` },
  };
}

// ---------- TIMELINE ----------
export const TIMELINE_ACTIONS = [
  "Generate Variant",
  "Generate Hook",
  "Auto Caption",
  "Highlight Product",
  "Generate Ending",
  "Create Short Version",
  "Generate Social Cut",
  "Optimize Timing",
] as const;

export function buildTimelineSuggestion(action: string, ctx: AIContextInput): AISuggestion {
  return {
    id: crypto.randomUUID(),
    kind: "timeline",
    action,
    title: action,
    reason: `${action} tuned to hook, retention and pacing benchmarks.`,
    confidence: clamp(76 + Math.random() * 20),
    estImprovement: "+12% retention",
    basedOn: withCtx(ctx, ["Hook analytics", "Retention curves"]),
    before: { type: "video", value: "current timeline" },
    after: { type: "video", value: `preview:${action}` },
  };
}
