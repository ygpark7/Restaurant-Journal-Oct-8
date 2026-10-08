import { describe, expect, it } from 'vitest';
import { loginPath, safeNext } from './paths';

describe('safeNext', () => {
  it('keeps in-app paths, including query strings', () => {
    expect(safeNext('/log?restaurant=r-1')).toBe('/log?restaurant=r-1');
    expect(safeNext('/places')).toBe('/places');
  });

  it('refuses anything that could leave the app', () => {
    for (const bad of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'places',
      '',
      null,
      undefined,
    ]) {
      expect(safeNext(bad)).toBe('/');
    }
  });

  it('builds an encoded login link', () => {
    expect(loginPath('/log?restaurant=r-1')).toBe(
      '/login?next=%2Flog%3Frestaurant%3Dr-1',
    );
  });
});
