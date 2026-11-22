import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';
import { setPendingEditorTemplate } from '@/lib/templateEditorSession';
import { layoutToFabric, normalizeLayout, TEMPLATE_FORMATS, type TemplateFormatId } from '@/services/templates/layoutFromPrompt';
import type { TemplateRecord } from '@/services/templates/types';
import { DIRECTOR_CATEGORIES, type DirectorCategory } from '@/components/visual-editor/studio/directorPrompt';

interface OptionCard {
  id: string;
  headline: string;
  json: ReturnType<typeof layoutToFabric>;
  width: number;
  height: number;
  format: string;
  note?: string;
}

export const QuickTemplateGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<DirectorCategory>('generic');
  const [formatId, setFormatId] = useState<TemplateFormatId>('post');
  const [references, setReferences] = useState<string[]>([]);
  const [busy, setBusy] = useState<null | 'enhance' | 'generate'>(null);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<OptionCard[]>([]);

  const format = TEMPLATE_FORMATS.find((item) => item.id === formatId) ?? TEMPLATE_FORMATS[0];

  const enhance = async () => {
    setBusy('enhance');
    setError('');
    const { data, error: invokeError } = await supabase.functions.invoke('enhance-prompt', {
      body: { prompt, category, mode: 'image', aspect: format.label, references: references.filter((url) => url.startsWith('http')) },
    });
    setBusy(null);
    if (invokeError || typeof data?.prompt !== 'string') {
      setError(await readEdgeError(invokeError, data?.error || 'Enhance did not return a prompt.'));
      return;
    }
    setPrompt(data.prompt);
  };

  const generate = async () => {
    if (!prompt.trim()) {
      setError('Write a prompt first.');
      return;
    }
    setBusy('generate');
    setError('');
    setOptions([]);
    try {
      const copies = await layoutCopies(prompt, format);
      if (copies.length < 2) throw new Error('The model did not return enough layout options.');
      let imageUrl: string | undefined;
      let note = '';
      const image = await supabase.functions.invoke('generate-ad-image', {
        body: { prompt, product: prompt, width: Math.min(format.width, 1024), height: Math.min(format.height, 1024), count: 1, references: references.filter((url) => url.startsWith('http')) },
      });
      if (image.error || typeof image.data?.imageUrl !== 'string') {
        note = await readEdgeError(image.error, image.data?.error || 'Add RUNWARE_API_KEY or OPENAI_API_KEY for the picture. The layouts are still editable.');
      } else {
        imageUrl = image.data.imageUrl;
      }
      const palettes = [
        { background: '#141414', accent: '#6E56F5', text: '#F5F5F5', muted: '#C8C8C8' },
        { background: '#1C140C', accent: '#E07A3D', text: '#F8F1E7', muted: '#D2C4B0' },
        { background: '#101820', accent: '#3DDC97', text: '#F4F7F5', muted: '#C5D0CB' },
      ];
      setOptions(copies.slice(0, 4).map((copy, index) => {
        const spec = normalizeLayout({ ...palettes[index % palettes.length], ...copy, imageUrl }, format);
        return {
          id: crypto.randomUUID(),
          headline: spec.headline,
          json: layoutToFabric(spec),
          width: format.width,
          height: format.height,
          format: format.label,
          note,
        };
      }));
      if (note) setError(note);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The layout was not generated.');
    } finally {
      setBusy(null);
    }
  };

  const open = (option: OptionCard) => {
    const now = new Date().toISOString();
    const template: TemplateRecord = {
      id: `stock-ai-${option.id}`,
      name: option.headline,
      description: prompt,
      category: 'ai',
      platform: formatId,
      objective: null,
      format: option.format,
      width: option.width,
      height: option.height,
      preview_url: null,
      thumbnail_url: null,
      template_json: option.json,
      ai_tags: [],
      industry_tags: [],
      brand_compatible: true,
      popularity_score: 0,
      source: 'ai',
      premium: false,
      metadata: {},
      created_by: null,
      created_at: now,
      updated_at: now,
    };
    setPendingEditorTemplate(template, 'ai');
    navigate('/visual-editor');
  };

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-base font-bold">Quick layout</h2>
      <p className="mt-1 text-sm text-muted-foreground">A prompt, an optional reference, and a format. Each option opens as separate text, shape, and image layers.</p>
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={4}
        placeholder="A night market poster for a small restaurant."
        className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value as DirectorCategory)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
          {DIRECTOR_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <Button type="button" variant="outline" className="h-9 gap-1.5" onClick={() => void enhance()} disabled={busy !== null}>
          {busy === 'enhance' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Enhance
        </Button>
        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border px-3 text-sm">
          References {references.length}/4
          <input type="file" accept="image/*" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file && references.length < 4) setReferences((current) => [...current, URL.createObjectURL(file)]);
          }} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {TEMPLATE_FORMATS.map((item) => (
          <button key={item.id} type="button" onClick={() => setFormatId(item.id)} className={`h-8 rounded-full px-3 text-xs font-semibold ${formatId === item.id ? 'bg-[#6E56F5] text-white' : 'bg-muted text-foreground'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <Button type="button" className="mt-4 h-11 w-full rounded-xl text-sm font-semibold sm:w-auto sm:px-8" style={{ background: '#6E56F5' }} onClick={() => void generate()} disabled={busy !== null}>
        {busy === 'generate' ? 'Generating…' : 'Generate options'}
      </Button>
      {error && <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {options.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {options.map((option) => (
            <button key={option.id} type="button" onClick={() => open(option)} className="rounded-xl border border-border p-3 text-left hover:border-[#6E56F5]">
              <p className="text-sm font-semibold">{option.headline}</p>
              <p className="mt-1 text-xs text-muted-foreground">{option.json.objects.filter((object) => object.type === 'textbox').length} text layers · {option.format}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

async function layoutCopies(prompt: string, format: { label: string; width: number; height: number }) {
  const positions = ['top', 'center', 'bottom'];
  const copies: Array<Record<string, string>> = [];
  let failure = 'The layout model did not respond.';
  for (const position of positions) {
    const { data, error } = await supabase.functions.invoke('generate-ai-template', {
      body: {
        prompt,
        blueprint: {
          layout: {
            layout: 'poster', cta_style: 'pill', spacing: 'regular', headline_position: position,
            visual_focus: 'image', aspect: { width: format.width, height: format.height },
          },
          style: {
            palette: { bg: '#141414', text: '#F5F5F5', primary: '#6E56F5' },
            font: { heading: 'Inter', body: 'Inter' },
            imageStrategy: 'generate',
          },
          context: { category: 'general', goal: 'visits', platform: format.label, productName: prompt },
        },
      },
    });
    if (error || !data?.copy?.headline) {
      failure = await readEdgeError(error, data?.error || failure);
      if (copies.length >= 2) break;
      continue;
    }
    copies.push({
      headline: data.copy.headline,
      subtext: data.copy.subheadline || data.copy.body || '',
      cta: data.copy.cta || 'Learn more',
    });
  }
  if (copies.length < 2) throw new Error(failure);
  return copies;
}
