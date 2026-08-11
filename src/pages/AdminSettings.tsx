import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useSystemSettings, useUpdateSystemSettings, type SystemSettings } from '@/hooks/admin/useAdminData';

export default function AdminSettings() {
  const { data, isLoading } = useSystemSettings();
  const update = useUpdateSystemSettings();
  const [form, setForm] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }

  const set = (patch: Partial<SystemSettings>) => setForm({ ...form, ...patch } as SystemSettings);
  const notAvailable = () => toast.info('This maintenance action is not enabled yet.');

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="platform">Platform name</Label>
            <Input id="platform" value={form.platform_name} onChange={(e) => set({ platform_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Default user plan</Label>
            <Select value={form.default_plan} onValueChange={(v) => set({ default_plan: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['free', 'starter', 'pro', 'agency'].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="signups">Signups open</Label>
            <Switch id="signups" checked={form.signups_open} onCheckedChange={(v) => set({ signups_open: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance">Maintenance mode</Label>
            <Switch id="maintenance" checked={form.maintenance_mode} onCheckedChange={(v) => set({ maintenance_mode: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">AI defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Default autonomy level</Label>
            <Select value={form.default_autonomy} onValueChange={(v) => set({ default_autonomy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['manual', 'assisted', 'autonomous'].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">AI model</Label>
            <Input id="model" value={form.ai_model} onChange={(e) => set({ ai_model: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagemodel">Image model</Label>
            <Input id="imagemodel" value={form.image_model} onChange={(e) => set({ image_model: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="credits">Max AI credits (Free)</Label>
              <Input
                id="credits"
                type="number"
                value={form.free_ai_credits}
                onChange={(e) => set({ free_ai_credits: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="retention">Decision log retention (days)</Label>
              <Input
                id="retention"
                type="number"
                value={form.decision_log_retention_days}
                onChange={(e) => set({ decision_log_retention_days: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={update.isPending} onClick={() => update.mutate({ ...form, id: form.id })}>
          Save changes
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Pricing (read-only)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Free: $0 · Starter: $19 · Pro: $49 · Agency: $99</p>
          <p>Plan pricing is managed by the payment provider.</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3"><CardTitle className="text-base text-destructive">Danger zone</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {[
            'Reset all AI decision logs',
            'Purge inactive users (90+ days)',
            'Reset campaign memory (all categories)',
            'Export full database backup',
          ].map((label) => (
            <Button key={label} variant="outline" className="justify-start border-destructive/40 text-destructive" onClick={notAvailable}>
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
