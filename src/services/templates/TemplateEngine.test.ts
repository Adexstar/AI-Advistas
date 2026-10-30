import { describe, expect, it, vi } from 'vitest';
vi.mock('./engines/AIEngine', () => ({ AIEngine: { personalize: vi.fn(async () => ({ headline: 'AI rewrite' })) } }));
import { AIEngine } from './engines/AIEngine';
import { TemplateEngine } from './TemplateEngine';
import type { TemplateRecord } from './types';

const template = {
  id: 'template', name: 'Sale',
  template_json: { objects: [{ type: 'textbox', variableKey: 'headline', text: 'Original headline', left: 42, width: 600 }] },
} as unknown as TemplateRecord;

describe('human-first template handoff', () => {
  it('preserves existing copy and geometry without an AI request', async () => {
    vi.mocked(AIEngine.personalize).mockClear();
    const result = await TemplateEngine.instantiate(template);
    expect(AIEngine.personalize).not.toHaveBeenCalled();
    expect(result.json.objects[0]).toEqual(template.template_json?.objects[0]);
    expect(result.appliedAI).toBe(false);
  });
  it('only personalizes when explicitly requested', async () => {
    const result = await TemplateEngine.instantiate(template, { skipAI: false });
    expect(result.json.objects[0].text).toBe('AI rewrite');
    expect(result.json.objects[0].left).toBe(42);
    expect(result.appliedAI).toBe(true);
  });
  it('prevents overrides masking locked brand values', async () => {
    const result = await TemplateEngine.instantiate({ ...template, template_json: { objects: [{ type: 'image', src: '{{brand.logo}}' }] } },
      { brand: { logo_url: '/brand.png', locked: true }, variables: { 'brand.logo': '/override.png' } });
    expect(result.json.objects[0].src).toBe('/brand.png');
  });
});