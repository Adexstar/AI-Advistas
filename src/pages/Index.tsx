import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  LayoutTemplate,
  LibraryBig,
  Rocket,
  ShieldCheck,
  Target,
  WandSparkles,
  Workflow,
} from "lucide-react";

const operatingLanes = [
  {
    title: "Brief to draft in minutes",
    description: "Start with AI, templates, or scratch and land in one guided editor instead of three disconnected tools.",
    icon: WandSparkles,
  },
  {
    title: "Template system that stays usable",
    description: "Browse proven layouts, save favorites, reopen recent picks, and move straight into customization without losing context.",
    icon: LibraryBig,
  },
  {
    title: "Campaign ops in one place",
    description: "Pause, duplicate, export, and bulk-update campaigns from an operations surface built for daily decision-making.",
    icon: Workflow,
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Choose the fastest path",
    description: "Use AI draft, template selection, or manual setup depending on how much structure you already have.",
  },
  {
    step: "02",
    title: "Refine in one editor",
    description: "Work through offer, creative, audience, and review with a live preview rail and readiness checks.",
  },
  {
    step: "03",
    title: "Operate from the workspace",
    description: "Launch, revisit saved templates, and manage campaigns from dashboards built for speed and clarity.",
  },
] as const;

const proofPoints = [
  {
    value: "3 entry points",
    label: "AI draft, template, or scratch",
  },
  {
    value: "1 guided editor",
    label: "Offer, creative, audience, and review",
  },
  {
    value: "Bulk campaign ops",
    label: "Pause, duplicate, export, and status control",
  },
] as const;

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "For solo builders validating offers and testing the create workflow.",
    features: ["AI draft entry", "Template browsing", "Guided editor", "Basic workspace shell"],
    emphasis: false,
  },
  {
    name: "Growth",
    price: "$49",
    description: "For operators running multiple campaigns who need speed without losing control.",
    features: ["Saved and recent templates", "Campaign operations workspace", "Visual template customization", "Export-ready setup"],
    emphasis: true,
  },
  {
    name: "Studio",
    price: "$149",
    description: "For teams managing creative systems, approvals, and larger launch velocity.",
    features: ["Admin template uploads", "Batch-ready template library", "Shared campaign management", "Priority support"],
    emphasis: false,
  },
] as const;

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    if (user && !loading) {
      navigate("/dashboard");
      return;
    }

    navigate("/auth");
  };

  const handleSecondaryAction = () => {
    if (user && !loading) {
      navigate("/create");
      return;
    }

    const pricingSection = document.getElementById("pricing");
    pricingSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="page-aura min-h-screen bg-background">
      <Navigation />

      <main className="relative">
        <section className="relative overflow-hidden px-4 pb-20 pt-28 md:px-6 lg:px-8 lg:pb-28 lg:pt-32">
          <div className="absolute inset-0">
            <div className="hero-grid absolute inset-x-0 top-0 h-[560px] opacity-40" />
            <div className="absolute left-[-8%] top-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute right-[-6%] top-20 h-96 w-96 rounded-full bg-primary-glow/25 blur-3xl" />
            <div className="absolute bottom-6 left-1/3 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          </div>

          <div className="page-container relative grid gap-12 px-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <Badge variant="outline" className="rounded-full border-primary/20 bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur">
                Ad operations, simplified
              </Badge>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground md:text-6xl lg:text-7xl">
                  Launch better campaigns without bouncing between tools, tabs, and half-finished drafts.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  AdVista now combines AI draft generation, a reusable template library, a guided editor, and campaign operations into one workspace built for real launch velocity.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="rounded-full px-7" onClick={handlePrimaryAction} disabled={loading}>
                  {loading ? "Loading..." : user ? "Open Workspace" : "Start Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-7" onClick={handleSecondaryAction}>
                  {user ? "Create a Campaign" : "See Plans"}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {proofPoints.map((point) => (
                  <div key={point.value} className="surface-panel surface-outline rounded-3xl p-4">
                    <p className="text-sm font-semibold text-foreground">{point.value}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{point.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="surface-outline overflow-hidden rounded-[32px] bg-gradient-hero p-[1px] shadow-soft">
                <div className="hero-grid rounded-[31px] border border-white/10 bg-[hsl(239_40%_16%/.92)] p-5 text-white backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Command surface</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">From idea to launch</h2>
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-white">Live preview</Badge>
                </div>

                <div className="space-y-4">
                  <Card className="border-white/10 bg-white/10 shadow-none backdrop-blur">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="rounded-2xl bg-white/12 p-3 text-accent shadow-sm">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-white">AI draft ready</p>
                        <p className="text-sm leading-6 text-white/68">Offer, audience, and headline are prefilled so the team starts from momentum instead of a blank form.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white shadow-none">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-primary/10 bg-secondary/40 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Template library</p>
                        <p className="mt-2 text-lg font-semibold">Saved + recent</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Pin reliable systems and reopen recent templates without re-filtering the catalog.</p>
                      </div>
                      <div className="rounded-2xl border border-primary/10 bg-secondary/40 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Campaign ops</p>
                        <p className="mt-2 text-lg font-semibold">Bulk actions</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Pause, duplicate, export, and update statuses from one operations view.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/0 bg-gradient-primary text-primary-foreground shadow-none">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">Workflow</p>
                        <p className="mt-2 text-2xl font-semibold">3 paths</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">Editor</p>
                        <p className="mt-2 text-2xl font-semibold">4 steps</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">Ops</p>
                        <p className="mt-2 text-2xl font-semibold">1 surface</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="page-container space-y-10 px-0">
            <div className="max-w-3xl space-y-3">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Product surface
              </Badge>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                One landing promise, one product model, one clearer path to launch.
              </h2>
              <p className="text-lg leading-8 text-muted-foreground">
                The public experience now mirrors what the app actually does: help teams move from idea, to creative, to launch, to campaign operations without losing the thread.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {operatingLanes.map((lane, index) => {
                const Icon = lane.icon;

                return (
                  <motion.div
                    key={lane.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                  >
                    <Card className="surface-panel surface-outline h-full rounded-[28px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-soft">
                      <CardHeader className="space-y-4">
                        <div className="w-fit rounded-2xl bg-gradient-primary p-3 text-white shadow-glow">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-2xl tracking-[-0.02em]">{lane.title}</CardTitle>
                        <CardDescription className="text-sm leading-7 text-muted-foreground">
                          {lane.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="page-container grid gap-10 px-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="surface-panel surface-outline rounded-[32px] p-8 space-y-4">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Workflow clarity
              </Badge>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                The landing page now explains the exact operating loop inside the app.
              </h2>
              <p className="text-lg leading-8 text-muted-foreground">
                No vague promises about AI magic. The experience shows the same structured flow your workspace actually supports today.
              </p>
            </div>

            <div className="space-y-4">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <Card className="surface-panel surface-outline rounded-[28px]">
                    <CardContent className="flex gap-4 p-5">
                      <div className="min-w-[72px] rounded-2xl bg-gradient-primary px-3 py-4 text-center text-sm font-semibold tracking-[0.2em] text-white shadow-glow">
                        {step.step}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                        <p className="text-sm leading-7 text-muted-foreground">{step.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="page-container space-y-10 px-0">
            <div className="max-w-3xl space-y-3">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Why it matters
              </Badge>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                Built for operators who need focus more than feature sprawl.
              </h2>
              <p className="text-lg leading-8 text-muted-foreground">
                Every recent product phase sharpened the same goal: reduce mode-switching, keep context alive, and make campaign execution easier to trust.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
              <Card className="surface-panel surface-outline rounded-[32px]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-[-0.02em]">What teams get</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      title: "Fewer restarts",
                      description: "Create-flow session state keeps progress alive between entry, editor, and refresh.",
                      icon: ShieldCheck,
                    },
                    {
                      title: "Better launch confidence",
                      description: "Step-based editor review and preview approval make the last mile more intentional.",
                      icon: CheckCircle2,
                    },
                    {
                      title: "Faster creative reuse",
                      description: "Library favorites and recent-use groupings make high-performing templates easier to reopen.",
                      icon: LayoutTemplate,
                    },
                    {
                      title: "More usable insights",
                      description: "The workspace shell and command center push next actions forward instead of burying them.",
                      icon: BarChart3,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="rounded-3xl border border-primary/10 bg-secondary/25 p-4 shadow-sm">
                        <div className="mb-3 w-fit rounded-2xl bg-gradient-primary p-3 text-white shadow-glow">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="surface-outline rounded-[32px] border-0 bg-gradient-hero text-primary-foreground shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-[-0.02em]">What this page now promises</CardTitle>
                  <CardDescription className="text-primary-foreground/75">
                    A simpler route from idea to launch, backed by surfaces that already exist in the product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-primary-foreground/85">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="font-medium text-primary-foreground">Start from the way you think</p>
                    <p className="mt-2">AI when you need speed, templates when you need structure, scratch when you need full control.</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="font-medium text-primary-foreground">Work from the same source of truth</p>
                    <p className="mt-2">The landing narrative, create flow, library surface, and campaign ops now describe the same product model.</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="font-medium text-primary-foreground">Operate without guesswork</p>
                    <p className="mt-2">Clearer calls to action, stronger grouping, and fewer dead-end hops reduce friction across the whole experience.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="page-container space-y-10 px-0">
            <div className="max-w-3xl space-y-3">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Pricing
              </Badge>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
                Choose the pace that matches your campaign team.
              </h2>
              <p className="text-lg leading-8 text-muted-foreground">
                Start free to learn the workflow, then scale into the library, visual customization, and campaign operations surfaces as the team grows.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={plan.emphasis ? "surface-outline rounded-[30px] border-primary/20 bg-gradient-to-b from-white to-secondary/45 shadow-soft" : "surface-panel surface-outline rounded-[30px]"}
                >
                  <CardHeader className="space-y-4">
                    {plan.emphasis && <Badge className="w-fit rounded-full bg-gradient-primary text-white">Recommended</Badge>}
                    <div className="space-y-2">
                      <CardTitle className="text-2xl tracking-[-0.02em]">{plan.name}</CardTitle>
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-semibold tracking-[-0.04em]">{plan.price}</span>
                        <span className="pb-2 text-sm text-muted-foreground">/ month</span>
                      </div>
                    </div>
                    <CardDescription className="text-sm leading-7 text-muted-foreground">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3 text-sm leading-7 text-foreground">
                          <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full rounded-full" variant={plan.emphasis ? "default" : "outline"} onClick={handlePrimaryAction}>
                      {user ? "Open Workspace" : "Get Started"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="page-container px-0">
            <Card className="surface-outline overflow-hidden rounded-[34px] border-0 bg-gradient-hero text-primary-foreground shadow-soft">
              <CardContent className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-10">
                <div className="space-y-4">
                  <Badge className="rounded-full border border-white/12 bg-white/10 text-white">Ready to move faster</Badge>
                  <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
                    Build, customize, and operate campaigns from one calmer workspace.
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-primary-foreground/80">
                    The landing surface now reflects the product you actually ship: one flow for creation, one surface for operations, and fewer places for teams to get lost.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90" onClick={handlePrimaryAction}>
                    {user ? "Go to Dashboard" : "Start Free"}
                    <Rocket className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10" onClick={() => navigate(user ? "/templates" : "/auth") }>
                    {user ? "Browse Library" : "See the Product"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
