import ComingSoonState from "@/components/ComingSoonState";
import { Users as SoonIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, ShieldCheck, KeySquare, Megaphone, LayoutTemplate, ScrollText, CheckCircle2 } from "lucide-react";

const sections = [
  { icon: Users, title: "Members", desc: "Everyone with access to this workspace." },
  { icon: ShieldCheck, title: "Roles", desc: "Owner, Admin, Editor, Viewer." },
  { icon: KeySquare, title: "Permissions", desc: "Fine-grained per-module access." },
  { icon: Megaphone, title: "Campaign Access", desc: "Who can launch, pause and edit." },
  { icon: LayoutTemplate, title: "Template Sharing", desc: "Share brand-safe templates." },
  { icon: ScrollText, title: "Activity Log", desc: "Every team action, timestamped." },
  { icon: CheckCircle2, title: "Approval Workflow", desc: "Multi-step sign-off for launches." },
];

const TeamWorkspace = () => (
  <div className="page-container space-y-6 py-4 md:py-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Workspace</h1>
        <p className="text-muted-foreground">Built for agencies and in-house squads.</p>
      </div>
      <Button><UserPlus className="mr-2 h-4 w-4" />Invite member</Button>
    </div>

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
            <CardContent>
              <Badge variant="secondary">Coming soon</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

const TeamWorkspaceComingSoon = () => (
  <ComingSoonState icon={SoonIcon} title="Team Workspace" description="Invite team members, set permissions, and collaborate on campaigns." />
);

export default TeamWorkspaceComingSoon;
