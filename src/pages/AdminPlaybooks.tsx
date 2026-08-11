import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlaybooks, useSavePlaybook } from '@/hooks/admin/useAdminData';

const asList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'object') return Object.values(value).map(String);
  return [String(value)];
};

export default function AdminPlaybooks() {
  const { data: playbooks = [], isLoading } = usePlaybooks();
  const save = useSavePlaybook();
  const [editing, setEditing] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {playbooks.length === 0 && (
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit playbook' : 'New playbook'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Category"
              value={editing?.category ?? ''}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            />
            <Textarea
              placeholder="Tone guidance"
              rows={4}
              value={editing?.tone_guidance ?? ''}
              onChange={(e) => setEditing({ ...editing, tone_guidance: e.target.value })}
            />
            <Input
              placeholder="Focus areas (comma separated)"
              value={asList(editing?.focus_areas).join(', ')}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  focus_areas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
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
