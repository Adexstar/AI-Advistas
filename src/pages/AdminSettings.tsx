import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemSettings, useUpdateSystemSettings, type SystemSettings } from '@/hooks/admin/useAdminData';
import { AdminLoadingRows, AdminMessage } from '@/components/admin/adminChrome';

export default function AdminSettings() {
  const { data, isLoading, isError } = useSystemSettings();
  const update = useUpdateSystemSettings();
  const [form, setForm] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isError) return <AdminMessage>Settings couldn’t be loaded.</AdminMessage>;

  if (isLoading) return <AdminLoadingRows count={3} />;

  if (!form) return <AdminMessage>No system settings are stored yet.</AdminMessage>;

  const set = (patch: Partial<SystemSettings>) => setForm({ ...form, ...patch } as SystemSettings);

  return (
    <div className="space-y-5">
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
                {[form.default_plan, 'free', 'pro', 'enterprise'].filter((plan, index, list) => plan && list.indexOf(plan) === index).map((plan) => (
                  <SelectItem key={plan} value={plan} className="capitalize">{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Billing offers Free, Pro, and Enterprise. A stored starter or agency value stays selectable until you change it.</p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="signups">Signups open</Label>
            <Switch id="signups" checked={form.signups_open} onCheckedChange={(v) => set({ signups_open: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance">Maintenance mode</Label>
            <Switch id="maintenance" checked={form.maintenance_mode} onCheckedChange={(v) => set({ maintenance_mode: v })} />
          </div>
          <p className="text-xs text-muted-foreground">Signups, maintenance, the default plan, credits, and retention are saved on this row. The rest of the app does not read them yet.</p>
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
          <p>Free $0 · Pro $29 · Enterprise $99</p>
          <p>These are the prices on Billing. Saving settings does not change them.</p>
        </CardContent>
      </Card>

    </div>
  );
}
