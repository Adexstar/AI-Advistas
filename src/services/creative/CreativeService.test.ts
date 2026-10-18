import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { creativeDocument } from './CreativeService';

describe('complete creative documents', () => {
  it('keeps exact Instagram portrait dimensions and editable layers', () => {
    const result = creativeDocument({ objects: [{ type: 'textbox', text: 'Sale' }] }, 1080, 1350);
    expect(result).toEqual({ objects: [{ type: 'textbox', text: 'Sale' }], width: 1080, height: 1350, pages: [] });
  });
  it('keeps independent page snapshots', () => {
    const source = { objects: [{ text: 'Page two' }] };
    const result = creativeDocument({ objects: [] }, 1000, 1500, [source]) as Record<string, unknown>;
    source.objects[0].text = 'Changed';
    expect(result.pages).toEqual([{ objects: [{ text: 'Page two' }] }]);
  });
});