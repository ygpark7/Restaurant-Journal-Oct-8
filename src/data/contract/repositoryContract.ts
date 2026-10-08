/**
 * Reusable contract tests: any Repositories implementation (Mock now, Supabase later)
 * must pass these. Call `runRepositoryContract` from a *.test.ts file with a factory
 * that returns a fresh, empty-user-state implementation.
 *
 * The contract deliberately uses only the public interfaces and discovers ids via search(),
 * so it doesn't depend on any particular seed data beyond "there are some restaurants".
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  NotFoundError,
  NotSignedInError,
  type Repositories,
} from '@/domain/repositories';
import type { NewVisit } from '@/domain/types';

function visitFor(restaurantId: string, overrides: Partial<NewVisit> = {}): NewVisit {
  return {
    restaurantId,
    visitedAt: new Date().toISOString(),
    foodRating: 4,
    stressLevel: 2,
    confirmedAttributes: {},
    ...overrides,
  };
}

/**
 * `createRepos` must return repositories for a signed-in user who has no visits or saved places.
 * It may be async (a real backend has to sign someone in first).
 */
export function runRepositoryContract(
  name: string,
  createRepos: () => Repositories | Promise<Repositories>,
) {
  describe(`Repository contract: ${name}`, () => {
    let repos: Repositories;
    beforeEach(async () => {
      repos = await createRepos();
    });

    describe('RestaurantRepository', () => {
      it('returns restaurants with the required fields', async () => {
        const all = await repos.restaurants.search();
        expect(all.length).toBeGreaterThanOrEqual(1);
        for (const r of all) {
          expect(r.id).toBeTruthy();
          expect(r.name).toBeTruthy();
          expect(r.neighborhood).toBeTruthy();
          expect(r.cuisine).toBeTruthy();
          expect([1, 2, 3, 4]).toContain(r.priceTier);
          expect(Array.isArray(r.hours)).toBe(true);
          expect(typeof r.attributes).toBe('object');
        }
      });

      it('filters by free text', async () => {
        const [first] = await repos.restaurants.search();
        const results = await repos.restaurants.search({ query: first!.name });
        expect(results.map((r) => r.id)).toContain(first!.id);
        expect(results.length).toBeLessThanOrEqual(
          (await repos.restaurants.search()).length,
        );

        expect(await repos.restaurants.search({ query: 'zzzz-no-such-place' })).toEqual(
          [],
        );
      });

      it('filters by attribute value', async () => {
        const results = await repos.restaurants.search({
          attributes: { highChairs: [true] },
        });
        expect(results.length).toBeGreaterThan(0);
        for (const r of results) expect(r.attributes.highChairs?.value).toBe(true);
      });

      it('getById returns a restaurant, or null when unknown', async () => {
        const [first] = await repos.restaurants.search();
        expect((await repos.restaurants.getById(first!.id))?.id).toBe(first!.id);
        expect(await repos.restaurants.getById('does-not-exist')).toBeNull();
      });
    });

    describe('VisitRepository', () => {
      it('creates a visit that shows up in listByRestaurant and listMine', async () => {
        const [r] = await repos.restaurants.search();
        const created = await repos.visits.create(
          visitFor(r!.id, { note: 'Contract test note' }),
        );
        expect(created.id).toBeTruthy();
        expect(created.userId).toBeTruthy();

        const forRestaurant = await repos.visits.listByRestaurant(r!.id);
        const found = forRestaurant.find((v) => v.id === created.id);
        expect(found?.note).toBe('Contract test note');
        expect(found?.author.displayName).toBeTruthy();

        expect((await repos.visits.listMine()).map((v) => v.id)).toEqual([created.id]);
      });

      it('rejects visits for unknown restaurants and invalid ratings', async () => {
        await expect(
          repos.visits.create(visitFor('does-not-exist')),
        ).rejects.toBeInstanceOf(NotFoundError);
        const [r] = await repos.restaurants.search();
        await expect(
          repos.visits.create(visitFor(r!.id, { foodRating: 9 as 5 })),
        ).rejects.toThrow();
      });

      it('updates attribute values and "last confirmed" from confirmations', async () => {
        const [r] = await repos.restaurants.search();
        const before = r!.attributes.changingTable;
        const flipped = !(before?.value === true);

        const visitedAt = new Date().toISOString();
        await repos.visits.create(
          visitFor(r!.id, { visitedAt, confirmedAttributes: { changingTable: flipped } }),
        );

        const after = (await repos.restaurants.getById(r!.id))!.attributes.changingTable;
        expect(after?.value).toBe(flipped);
        expect(after?.lastConfirmedAt).toBe(visitedAt);
      });
    });

    describe('AuthRepository', () => {
      it('reports the signed-in user and notifies listeners about sign-out', async () => {
        expect((await repos.auth.getUser())?.id).toBeTruthy();

        const seen: (string | null)[] = [];
        const stop = repos.auth.onChange((user) => seen.push(user?.id ?? null));
        await repos.auth.signOut();
        stop();

        expect(await repos.auth.getUser()).toBeNull();
        expect(seen).toContain(null);
      });

      it('lets signed-out visitors read public data, but not write', async () => {
        const [r] = await repos.restaurants.search();
        await repos.auth.signOut();

        expect((await repos.restaurants.getById(r!.id))?.id).toBe(r!.id);
        expect(await repos.visits.listByRestaurant(r!.id)).toBeDefined();
        expect(await repos.savedPlaces.list()).toEqual([]);
        expect(await repos.savedPlaces.get(r!.id)).toBeNull();
        expect(await repos.visits.listMine()).toEqual([]);

        await expect(repos.visits.create(visitFor(r!.id))).rejects.toBeInstanceOf(
          NotSignedInError,
        );
        await expect(repos.savedPlaces.save(r!.id, 'want_to_try')).rejects.toBeInstanceOf(
          NotSignedInError,
        );
      });
    });

    describe('SavedPlacesRepository', () => {
      it('starts empty', async () => {
        expect(await repos.savedPlaces.list()).toEqual([]);
      });

      it('saves, upserts the status, filters by status, and removes', async () => {
        const [a, b] = await repos.restaurants.search();

        await repos.savedPlaces.save(a!.id, 'want_to_try');
        await repos.savedPlaces.save(b!.id, 'been_there');
        expect((await repos.savedPlaces.list()).length).toBe(2);
        expect(
          (await repos.savedPlaces.list('want_to_try')).map((s) => s.restaurantId),
        ).toEqual([a!.id]);

        // Saving again changes the status instead of adding a duplicate.
        await repos.savedPlaces.save(a!.id, 'been_there');
        const all = await repos.savedPlaces.list();
        expect(all.length).toBe(2);
        expect((await repos.savedPlaces.get(a!.id))?.status).toBe('been_there');
        expect(all[0]?.restaurant.name).toBeTruthy();

        await repos.savedPlaces.remove(a!.id);
        expect(await repos.savedPlaces.get(a!.id)).toBeNull();
        expect((await repos.savedPlaces.list()).length).toBe(1);
      });

      it('rejects saving an unknown restaurant', async () => {
        await expect(
          repos.savedPlaces.save('does-not-exist', 'want_to_try'),
        ).rejects.toBeInstanceOf(NotFoundError);
      });
    });
  });
}
