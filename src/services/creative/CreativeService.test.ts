import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
import { CreativeService, creativeDocument } from './CreativeService';

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

describe('canonical save ownership', () => {
  it('updates an existing creative without creating a second copy and scopes it to its owner', async () => {
    const single = vi.fn(async () => ({ data: { id: 'creative-1' }, error: null }));
    const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), single };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
    await CreativeService.save('owner-1', { name: 'Edited', campaign_id: 'campaign-1' }, 'creative-1');
    expect(mocks.from).toHaveBeenCalledWith('ads');
    expect(query.update).toHaveBeenCalledWith({ name: 'Edited', campaign_id: 'campaign-1' });
    expect(query.eq).toHaveBeenCalledWith('id', 'creative-1');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner-1');
  });
  it('propagates save failures instead of returning success', async () => {
    const error = new Error('Permission denied');
    const query = { insert: vi.fn(), select: vi.fn(), single: vi.fn(async () => ({ data: null, error })) };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
    await expect(CreativeService.save('owner-1', { name: 'Draft' })).rejects.toThrow('Permission denied');
  });
});