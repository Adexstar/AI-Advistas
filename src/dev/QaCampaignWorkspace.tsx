// TEMPORARY dev-only QA page: reproduces the campaign workspace header, tab
// rail and metrics with mock data so the layout can be inspected without
// signing in. Must be removed before the change is finished.
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  ArrowLeft, BarChart3, LayoutTemplate, Users, Wallet, Send, ChartLine,
  Sparkles, GitBranch, FileText, StickyNote, Clock, Target, TrendingUp,
  DollarSign, Eye, RotateCcw, Copy,
} from 'lucide-react';

const CAMPAIGN_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'creatives', label: 'Creatives', icon: LayoutTemplate },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'publishing', label: 'Publishing', icon: Send },
  { id: 'analytics', label: 'Analytics', icon: ChartLine },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'versions', label: 'Versions', icon: GitBranch },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'history', label: 'History', icon: Clock },
] as const;

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) => (
  <Card className="rounded-2xl border border-border/60">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Icon className="h-3.5 w-3.5" />{label}</div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

const QaCampaignWorkspace = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      <div className="page-container py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-1 h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight lg:text-3xl">
                  summer glow luxury collection campaign autumn extended
                </h1>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize" style={{ background: '#9CA3AF18', color: '#9CA3AF' }}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#9CA3AF' }} />
                  draft
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1"><Target className="h-3.5 w-3.5 shrink-0" /><span className="truncate">awareness</span></span>
                <span className="flex min-w-0 items-center gap-1"><LayoutTemplate className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Facebook</span></span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <RotateCcw className="h-3.5 w-3.5" /> Save Version
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={DollarSign} label="Budget" value="$5,000" />
          <MetricCard icon={TrendingUp} label="Spend" value="$0" sub="0% used" />
          <MetricCard icon={Eye} label="CTR" value="0.0%" />
          <MetricCard icon={BarChart3} label="ROAS" value="0.0x" />
          <MetricCard icon={Target} label="Conversions" value="0" />
          <MetricCard icon={Sparkles} label="Health" value="58%" sub="AI-powered" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 space-y-6">
          <div className="tabs-scroll-shell sticky top-0 z-10 -mx-4 w-[calc(100%+2rem)] bg-[#FAFAFA] px-4">
            <TabsList className="tabs-scroll-list inline-flex h-auto gap-1 rounded-xl border bg-card p-1">
              {CAMPAIGN_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {CAMPAIGN_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  {tab.label} content placeholder
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <MobileBottomNav />
      <Sonner />
      <button
        type="button"
        onClick={() => toast('Making campaign saves reopenable with every page')}
        className="fixed right-4 top-4 z-50 rounded-lg bg-foreground px-3 py-2 text-xs text-background"
      >
        Show toast
      </button>
    </div>
  );
};

export default QaCampaignWorkspace;
