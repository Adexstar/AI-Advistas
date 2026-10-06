import { describe, expect, it } from 'vitest';
import { normalizeTemplateCategory } from './templateCategories';

describe('normalizeTemplateCategory', () => {
  it('normalizes the observed template category aliases to shared keys', () => {
    expect(normalizeTemplateCategory('Beauty')).toBe('beauty');
    expect(normalizeTemplateCategory('Restaurant & Food')).toBe('food');
    expect(normalizeTemplateCategory('SaaS & Technology')).toBe('saas');
    expect(normalizeTemplateCategory('E-commerce')).toBe('ecommerce');
    expect(normalizeTemplateCategory('Real Estate')).toBe('real_estate');
    expect(normalizeTemplateCategory('Travel & Leisure')).toBe('travel');
    expect(normalizeTemplateCategory('Technology')).toBe('saas');
  });

  it('covers the real-world variants seen in starter templates and category pages', () => {
    expect(normalizeTemplateCategory('Beauty & Wellness')).toBe('beauty');
    expect(normalizeTemplateCategory('Restaurant')).toBe('food');
    expect(normalizeTemplateCategory('Real Estate Listing')).toBe('real_estate');
    expect(normalizeTemplateCategory('Travel & Tourism')).toBe('travel');
    expect(normalizeTemplateCategory('SaaS / Technology')).toBe('saas');
  });

  it('keeps unknown categories stable and slug-safe', () => {
    expect(normalizeTemplateCategory('Healthcare')).toBe('healthcare');
    expect(normalizeTemplateCategory('Finance')).toBe('finance');
  });
});
