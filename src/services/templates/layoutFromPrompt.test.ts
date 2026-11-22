import { describe, expect, it } from 'vitest';
import { layoutToFabric, normalizeLayout, TEMPLATE_FORMATS } from './layoutFromPrompt';

describe('template layout mapping', () => {
  it('turns layout JSON into separate text, shape, and image layers', () => {
    const story = TEMPLATE_FORMATS.find((format) => format.id === 'story')!;
    const spec = normalizeLayout({
      headline: 'Night market',
      subtext: 'Open until late',
      cta: 'Get a table',
      background: '#101010',
      accent: '#6E56F5',
      imageUrl: 'https://cdn.example.com/hero.jpg',
    }, story);
    const json = layoutToFabric(spec);
    const types = json.objects.map((object) => object.type);
    expect(types.filter((type) => type === 'textbox').length).toBe(3);
    expect(types).toContain('image');
    expect(json.objects.some((object) => object.variableKey === 'headline' && object.text === 'Night market')).toBe(true);
    expect(json.objects.some((object) => object.variableKey === 'cta' && object.text === 'Get a table')).toBe(true);
    expect(json.objects.some((object) => object.type === 'rect' && object.fill === '#6E56F5')).toBe(true);
    expect(types.length).toBeGreaterThan(1);
  });

  it('keeps a shape when the model returns no image', () => {
    const post = TEMPLATE_FORMATS[0];
    const json = layoutToFabric(normalizeLayout({ headline: 'Hello' }, post));
    expect(json.objects.some((object) => object.type === 'image')).toBe(false);
    expect(json.objects.filter((object) => object.type === 'rect').length).toBeGreaterThanOrEqual(2);
    expect(json.objects.filter((object) => object.type === 'textbox').map((object) => object.variableKey)).toEqual([
      'headline', 'subheadline', 'cta',
    ]);
  });
});
