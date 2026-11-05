import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePlaybooks, useSavePlaybook } from '@/hooks/admin/useAdminData';

const asList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'object') return Object.values(value).map(String);
  return [String(value)];
};

export default function AdminPlaybooks() {
  const { data: playbooks = [], isLoading, isError } = usePlaybooks();
  const save = useSavePlaybook();
  const [editing, setEditing] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Category prompts used when the product writes ads. Hooks, headlines, and calls to action are the patterns the writer is asked to follow.
      </p>
      {isError && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Playbooks couldn’t be loaded.
        </p>
      )}
      {playbooks.length === 0 && !isError && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No category playbooks yet.</CardContent></Card>
      )}

      {playbooks.map((pb: any) => (
        <Card key={pb.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base capitalize">{pb.category}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Updated {pb.updated_at ? new Date(pb.updated_at).toLocaleDateString() : '—'}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...pb })}>Edit</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Focus areas</p>
              <div className="flex flex-wrap gap-1.5">
                {asList(pb.focus_areas).length === 0 && <span className="text-muted-foreground">None set</span>}
                {asList(pb.focus_areas).map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Tone guidance</p>
              <p className="text-muted-foreground">{pb.tone_guidance || 'Not set'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Winning hooks', pb.winning_hooks],
                ['Headline patterns', pb.headline_patterns],
                ['CTA patterns', pb.cta_patterns],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{label as string}</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {asList(value).slice(0, 5).map((v, i) => <li key={i}>• {v}</li>)}
                    {asList(value).length === 0 && <li>None yet</li>}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setEditing({ category: '', tone_guidance: '', focus_areas: [] })}>
        + Add category
      </Button>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit playbook' : 'New playbook'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="playbook-category">Category</Label>
              <Input
                id="playbook-category"
                value={editing?.category ?? ''}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playbook-tone">Tone guidance</Label>
              <Textarea
                id="playbook-tone"
                rows={4}
                value={editing?.tone_guidance ?? ''}
                onChange={(e) => setEditing({ ...editing, tone_guidance: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playbook-focus">Focus areas</Label>
              <Input
                id="playbook-focus"
                placeholder="Comma separated"
                value={asList(editing?.focus_areas).join(', ')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    focus_areas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
            {([
              ['winning_hooks', 'Winning hooks', 'One pattern per line'],
              ['headline_patterns', 'Headline patterns', 'One pattern per line'],
              ['cta_patterns', 'Calls to action', 'One pattern per line'],
            ] as const).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`playbook-${key}`}>{label}</Label>
                <Textarea
                  id={`playbook-${key}`}
                  placeholder={placeholder}
                  rows={3}
                  value={asList(editing?.[key]).join('\n')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              disabled={!editing?.category || save.isPending}
              onClick={() =>
                save.mutate(
                  {
                    id: editing.id,
                    category: editing.category,
                    tone_guidance: editing.tone_guidance,
                    focus_areas: editing.focus_areas,
                    winning_hooks: asList(editing.winning_hooks),
                    headline_patterns: asList(editing.headline_patterns),
                    cta_patterns: asList(editing.cta_patterns),
                  },
                  { onSuccess: () => setEditing(null) }
                )
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
