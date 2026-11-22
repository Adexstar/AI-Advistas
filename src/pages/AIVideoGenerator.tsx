import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AIGateway } from '@/services/ai/AIGateway';
import { readEdgeError } from '@/services/edgeError';
import { DIRECTOR_CATEGORIES, type DirectorCategory } from '@/components/visual-editor/studio/directorPrompt';

const TASKS = [
  { id: 'copy', label: 'Copy', system: 'Write ad copy: a headline, two lines of body, and a call to action. Plain text.' },
  { id: 'captions', label: 'Captions', system: 'Write five short social captions. Number them. No images.' },
  { id: 'scripts', label: 'Scripts', system: 'Write a 15 second voiceover script with the spoken lines only.' },
  { id: 'ideas', label: 'Ideas', system: 'Give five campaign ideas. One sentence each.' },
] as const;

type TaskId = (typeof TASKS)[number]['id'];

const AIVideoGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskId>('copy');
  const [category, setCategory] = useState<DirectorCategory>('generic');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState<null | 'enhance' | 'write'>(null);
  const [error, setError] = useState('');

  const enhance = async () => {
    setBusy('enhance');
    setError('');
    const { data, error: invokeError } = await supabase.functions.invoke('enhance-prompt', {
      body: { prompt, category, mode: 'image', aspect: '1:1' },
    });
    setBusy(null);
    if (invokeError || typeof data?.prompt !== 'string') {
      setError(await readEdgeError(invokeError, data?.error || 'Enhance did not return a prompt.'));
      return;
    }
    setPrompt(data.prompt);
  };

  const write = async () => {
    if (!prompt.trim()) {
      setError('Write a brief first.');
      return;
    }
    setBusy('write');
    setError('');
    setResult('');
    try {
      if (task === 'copy') {
        const { data, error: invokeError } = await supabase.functions.invoke('generate-ad-copy', {
          body: { productName: prompt, platform: 'instagram' },
        });
        if (invokeError) throw new Error(await readEdgeError(invokeError, 'Copy was not written.'));
        const copy = data?.copy ?? data;
        const headline = typeof copy?.headline === 'string' ? copy.headline : '';
        const body = typeof copy?.body === 'string' ? copy.body : typeof copy?.subtitle === 'string' ? copy.subtitle : '';
        const cta = typeof copy?.cta === 'string' ? copy.cta : '';
        if (!headline) throw new Error(data?.error || 'No copy came back.');
        setResult([headline, body, cta].filter(Boolean).join('\n\n'));
      } else {
        const chosen = TASKS.find((item) => item.id === task)!;
        const reply = await AIGateway.route({
          specialist: 'general',
          systemPrompt: chosen.system,
          userPrompt: prompt,
          maxTokens: 500,
        });
        setResult(reply.content);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Nothing was written.');
    } finally {
      setBusy(null);
    }
  };

  const sendToStudio = () => {
    const text = result.trim() || prompt.trim();
    if (!text) return;
    sessionStorage.setItem('advista.studio.draft', JSON.stringify({ prompt: text, mode: 'image', open: true }));
    navigate('/visual-editor?studio=1');
  };

  return (
    <div className="page-container py-6 lg:py-8">
      <h1 className="text-[28px] font-extrabold leading-tight">AI Assistant</h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Copy, captions, scripts, and ideas. Pictures and video are made in AI Studio, in the editor.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {TASKS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTask(item.id)} className={`h-9 rounded-full px-3 text-sm font-semibold ${task === item.id ? 'bg-[#6E56F5] text-white' : 'bg-muted text-foreground'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 max-w-2xl rounded-2xl border border-border bg-card p-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="What are you advertising?"
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value as DirectorCategory)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            {DIRECTOR_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button type="button" variant="outline" className="h-9 gap-1.5" onClick={() => void enhance()} disabled={busy !== null}>
            {busy === 'enhance' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Enhance
          </Button>
          <Button type="button" className="h-9" style={{ background: '#6E56F5' }} onClick={() => void write()} disabled={busy !== null}>
            {busy === 'write' ? 'Writing…' : 'Write'}
          </Button>
        </div>
        {error && <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {result && (
          <div className="mt-4">
            <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">{result}</pre>
            <Button type="button" className="mt-3" variant="outline" onClick={sendToStudio}>Send to Studio</Button>
          </div>
        )}
        {!result && prompt.trim() && (
          <Button type="button" className="mt-3" variant="outline" onClick={sendToStudio}>Send to Studio</Button>
        )}
      </div>
    </div>
  );
};

export default AIVideoGenerator;
