import ComingSoonState from "@/components/ComingSoonState";
import { Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Bot, CalendarClock, CheckCircle2, ClipboardList, GaugeCircle, History, Rocket, Zap } from "lucide-react";

const AutomationCenter = () => {
  const sections = [
    { icon: GaugeCircle, title: "Overview", desc: "Live KPIs from AI-driven activity." },
    { icon: ClipboardList, title: "Approval Queue", desc: "Actions waiting for a human decision." },
    { icon: Zap, title: "Automation Rules", desc: "Conditional triggers that run in your workspace." },
    { icon: History, title: "Decision History", desc: "Every AI decision, with reasoning and outcome." },
    { icon: Activity, title: "Running Automations", desc: "Live tasks in progress right now." },
    { icon: CalendarClock, title: "Scheduled Tasks", desc: "Upcoming automations on the calendar." },
    { icon: Rocket, title: "Growth Agent Status", desc: "Autonomous optimization heartbeat." },
    { icon: Bot, title: "Recent AI Activity", desc: "Latest 50 events across the platform." },
  ];

  const levels = ["Manual", "Assisted", "Smart", "Growth Agent"] as const;

  return (
    <div className="page-container space-y-6 py-4 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Center</h1>
          <p className="text-muted-foreground">Operations dashboard for AdVista AI. Not a chatbot.</p>
        </div>
        <Badge variant="secondary" className="rounded-full">Beta</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Future Autonomy Level</CardTitle>
          <CardDescription>Choose how much AdVista AI is allowed to do on its own.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {levels.map((l, i) => (
            <Button key={l} variant={i === 0 ? "default" : "outline"} size="sm" className="rounded-full">
              {l}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader>
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <CardDescription>{s.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Ready to receive events
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const AutomationCenterComingSoon = () => (
  <ComingSoonState icon={Zap} title="Automation Center" description="The command center for autonomous marketing — approval queues, AI history, and growth agent controls." />
);

export default AutomationCenterComingSoon;
