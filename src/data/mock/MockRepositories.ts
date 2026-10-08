import { filterRestaurants } from '@/domain/filterRestaurants';
import {
  NotFoundError,
  type Repositories,
  type RestaurantRepository,
  type SavedPlacesRepository,
  type VisitRepository,
} from '@/domain/repositories';
import type { Restaurant, SavedPlace, Visit } from '@/domain/types';
import { newId } from '@/lib/id';
import { withConfirmations } from './effectiveRestaurant';
import { simulateNetwork, type MockOptions } from './latency';
import { ALL_USERS, CURRENT_USER } from './seed/users';
import { mockStore } from './store';

function effectiveRestaurants(): Restaurant[] {
  const visits = mockStore.allVisits();
  return mockStore.restaurants().map((r) => withConfirmations(r, visits));
}

function isRating(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

class MockRestaurantRepository implements RestaurantRepository {
  constructor(private options: MockOptions) {}

  search(filters = {}) {
    return simulateNetwork(this.options, () =>
      filterRestaurants(effectiveRestaurants(), filters),
    );
  }

  getById(id: string) {
    return simulateNetwork(
      this.options,
      () => effectiveRestaurants().find((r) => r.id === id) ?? null,
    );
  }
}

class MockVisitRepository implements VisitRepository {
  constructor(private options: MockOptions) {}

  create(input: Parameters<VisitRepository['create']>[0]) {
    return simulateNetwork(this.options, () => {
      if (!mockStore.restaurants().some((r) => r.id === input.restaurantId)) {
        throw new NotFoundError('Restaurant');
      }
      if (!isRating(input.foodRating) || !isRating(input.stressLevel)) {
        throw new RangeError('Ratings must be whole numbers from 1 to 5');
      }
      const visit: Visit = {
        ...input,
        id: newId(),
        userId: CURRENT_USER.id,
        createdAt: new Date().toISOString(),
      };
      mockStore.addVisit(visit);
      return visit;
    });
  }

  listByRestaurant(restaurantId: string) {
    return simulateNetwork(this.options, () =>
      mockStore
        .allVisits()
        .filter((v) => v.restaurantId === restaurantId)
        .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
        .map((v) => ({
          ...v,
          author: ALL_USERS.find((u) => u.id === v.userId) ?? {
            id: v.userId,
            displayName: 'A parent',
          },
        })),
    );
  }

  listMine() {
    return simulateNetwork(this.options, () =>
      mockStore.myVisits().sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)),
    );
  }
}

class MockSavedPlacesRepository implements SavedPlacesRepository {
  constructor(private options: MockOptions) {}

  list(status?: SavedPlace['status']) {
    return simulateNetwork(this.options, () => {
      const restaurants = effectiveRestaurants();
      return mockStore
        .saved()
        .filter((s) => !status || s.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .flatMap((s) => {
          const restaurant = restaurants.find((r) => r.id === s.restaurantId);
          return restaurant ? [{ ...s, restaurant }] : [];
        });
    });
  }

  get(restaurantId: string) {
    return simulateNetwork(
      this.options,
      () => mockStore.saved().find((s) => s.restaurantId === restaurantId) ?? null,
    );
  }

  save(restaurantId: string, status: SavedPlace['status']) {
    return simulateNetwork(this.options, () => {
      if (!mockStore.restaurants().some((r) => r.id === restaurantId)) {
        throw new NotFoundError('Restaurant');
      }
      const existing = mockStore.saved();
      const previous = existing.find((s) => s.restaurantId === restaurantId);
      const place: SavedPlace = {
        userId: CURRENT_USER.id,
        restaurantId,
        status,
        // Keep the original save time when only the status changes.
        createdAt: previous?.createdAt ?? new Date().toISOString(),
      };
      mockStore.setSaved([
        ...existing.filter((s) => s.restaurantId !== restaurantId),
        place,
      ]);
      return place;
    });
  }

  remove(restaurantId: string) {
    return simulateNetwork(this.options, () => {
      mockStore.setSaved(
        mockStore.saved().filter((s) => s.restaurantId !== restaurantId),
      );
    });
  }
}

export function createMockRepositories(options: MockOptions = {}): Repositories {
  return {
    restaurants: new MockRestaurantRepository(options),
    visits: new MockVisitRepository(options),
    savedPlaces: new MockSavedPlacesRepository(options),
  };
}
