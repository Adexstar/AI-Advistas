import { describe, expect, it } from 'vitest';
import { SELECTION_ACTIONS, selectionToolSet } from './editorTools';
import { buildImageFilters, neutralImageAdjustments } from './imageAdjustments';

describe('selection tool sets', () => {
  it('uses the create rail when nothing is selected', () => {
    expect(selectionToolSet(null)).toBe('create');
    expect(selectionToolSet({})).toBe('create');
  });

  it('switches the rail to the selected object type', () => {
    expect(selectionToolSet({ type: 'textbox' })).toBe('text');
    expect(selectionToolSet({ type: 'i-text' })).toBe('text');
    expect(selectionToolSet({ type: 'image' })).toBe('image');
    expect(selectionToolSet({ type: 'video' })).toBe('video');
    expect(selectionToolSet({ type: 'rect' })).toBe('shape');
    expect(selectionToolSet({ type: 'circle' })).toBe('shape');
    expect(selectionToolSet({ type: 'activeSelection' })).toBe('multi');
    expect(selectionToolSet({ type: 'group' })).toBe('multi');
    expect(selectionToolSet({ type: 'line' })).toBe('shape');
    expect(selectionToolSet({ type: 'image', advistaKind: 'video' })).toBe('video');
    expect(selectionToolSet({ type: 'rect', advistaKind: 'audio' })).toBe('audio');
  });

  it('keeps the selection bar to actions that edit the layer', () => {
    expect(SELECTION_ACTIONS.image.map((item) => item.label)).toEqual([
      'Edit', 'Replace', 'BG Remover', 'Eraser', 'Crop', 'Flip', 'Border', 'Corner',
      'Transparency', 'Animate', 'More',
    ]);
    expect(SELECTION_ACTIONS.image.map((item) => item.id)).not.toContain('split');
    expect(SELECTION_ACTIONS.video.map((item) => item.id)).toContain('duration');
    expect(SELECTION_ACTIONS.text.map((item) => item.label)).toEqual([
      'Edit', 'Font', 'Font size', 'Colour', 'Format', 'Case', 'Align', 'Spacing',
      'Transparency', 'Effects', 'Animate', 'Position',
    ]);
    expect(SELECTION_ACTIONS.audio.map((item) => item.label)).toEqual([
      'Volume', 'Fade', 'Split', 'Trim', 'Replace', 'Delete',
    ]);
    expect(SELECTION_ACTIONS.shape.map((item) => item.id)).toContain('border');
  });
});

describe('image adjustments', () => {
  it('adds no filter for a neutral image', () => {
    expect(buildImageFilters(neutralImageAdjustments)).toEqual([]);
  });

  it('adds a grayscale filter and a brightness filter together', () => {
    const filters = buildImageFilters({ ...neutralImageAdjustments, preset: 'grayscale', brightness: 0.2 });
    expect(filters.map((filter) => filter.type)).toEqual(['Grayscale', 'Brightness']);
  });
});
