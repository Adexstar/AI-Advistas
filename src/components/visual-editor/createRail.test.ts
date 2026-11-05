import { describe, expect, it } from 'vitest';
import {
  CREATE_RAIL,
  EDITOR_TOOLS,
  ELEMENT_CATEGORIES,
  ELEMENT_LABELS,
  FONT_COMBOS,
  TEXT_STYLES,
  matchTextStyle,
  panelForCreateTool,
} from './createRail';

describe('create rail', () => {
  it('matches the mobile bottom bar order', () => {
    expect(CREATE_RAIL.map((tool) => tool.label)).toEqual([
      'Templates',
      'Elements',
      'Text',
      'Camera Roll',
      'Brand',
      'Uploads',
      'Tools',
    ]);
  });

  it('routes camera roll into uploads and keeps the other tools on their own panels', () => {
    expect(panelForCreateTool('camera')).toBe('uploads');
    expect(panelForCreateTool('tools')).toBe('tools');
    expect(panelForCreateTool('templates')).toBe('templates');
    expect(panelForCreateTool('brand')).toBe('brand');
  });

  it('filters text styles by the words a person types', () => {
    expect(TEXT_STYLES.filter((item) => matchTextStyle('heading', item)).map((item) => item.id)).toEqual(['heading', 'sub']);
    expect(FONT_COMBOS.filter((item) => matchTextStyle('georgia', item)).map((item) => item.id)).toEqual(['story']);
    expect(TEXT_STYLES.filter((item) => matchTextStyle('', item))).toHaveLength(TEXT_STYLES.length);
  });

  it('only offers element categories that have a canvas action or the photo library', () => {
    const ids = ELEMENT_CATEGORIES.flatMap((category) => category.items);
    expect(ids.every((id) => ELEMENT_LABELS[id])).toBe(true);
    expect(ELEMENT_CATEGORIES.map((category) => category.id)).toEqual(['shapes', 'frames', 'grids', 'photos']);
    expect(EDITOR_TOOLS.map((tool) => tool.id)).toContain('background');
  });
});
