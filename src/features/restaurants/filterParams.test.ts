import { describe, expect, it } from 'vitest';
import {
  countActiveFilters,
  parseFilters,
  toggleInList,
  writeFilters,
} from './filterParams';

describe('filter URL params', () => {
  it('round-trips every kind of filter', () => {
    const filters = {
      query: 'pizza',
      goodForTonight: true,
      cuisines: ['Pizza', 'Italian'],
      priceTiers: [1 as const, 2 as const],
      attributes: { highChairs: [true], noiseLevel: ['quiet', 'moderate'] },
    };
    const params = writeFilters(new URLSearchParams(), filters);
    expect(parseFilters(params)).toEqual(filters);
  });

  it('keeps unrelated params and replaces old filter params', () => {
    const base = new URLSearchParams('mock=slow&q=old&price=3');
    const next = writeFilters(base, { query: 'new' });
    expect(next.get('mock')).toBe('slow');
    expect(next.get('q')).toBe('new');
    expect(next.has('price')).toBe(false);
  });

  it('ignores garbage values in the URL', () => {
    const filters = parseFilters(
      new URLSearchParams('price=9&price=abc&a_noiseLevel=deafening&a_highChairs=maybe'),
    );
    expect(filters).toEqual({});
  });

  it('counts selected filter values (not search text or tonight)', () => {
    expect(
      countActiveFilters({
        query: 'x',
        goodForTonight: true,
        cuisines: ['Pizza'],
        priceTiers: [1, 2],
        attributes: { noiseLevel: ['quiet', 'lively'], highChairs: [true] },
      }),
    ).toBe(6);
  });

  it('toggleInList adds, removes, and returns undefined when emptied', () => {
    expect(toggleInList(undefined, 'a')).toEqual(['a']);
    expect(toggleInList(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleInList(['a'], 'a')).toBeUndefined();
  });
});
