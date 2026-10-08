/**
 * Repository interfaces. UI code depends ONLY on these, never on an implementation.
 * The implementation is chosen in exactly one place: src/app/repositories.ts.
 */
import type {
  Id,
  NewVisit,
  Restaurant,
  RestaurantFilters,
  SavedPlace,
  SavedPlaceWithRestaurant,
  SavedStatus,
  Visit,
  VisitWithAuthor,
} from './types';

export interface RestaurantRepository {
  search(filters?: RestaurantFilters): Promise<Restaurant[]>;
  /** Resolves to null when the restaurant doesn't exist. */
  getById(id: Id): Promise<Restaurant | null>;
}

export interface VisitRepository {
  /** Rejects with NotFoundError for an unknown restaurant. */
  create(visit: NewVisit): Promise<Visit>;
  /** Newest first. */
  listByRestaurant(restaurantId: Id): Promise<VisitWithAuthor[]>;
  /** The current user's visits, newest first. */
  listMine(): Promise<Visit[]>;
}

export interface SavedPlacesRepository {
  /** The current user's saved places, newest first, optionally filtered by status. */
  list(status?: SavedStatus): Promise<SavedPlaceWithRestaurant[]>;
  get(restaurantId: Id): Promise<SavedPlace | null>;
  /** Upsert: saving an already-saved place just changes its status. */
  save(restaurantId: Id, status: SavedStatus): Promise<SavedPlace>;
  remove(restaurantId: Id): Promise<void>;
}

export interface Repositories {
  restaurants: RestaurantRepository;
  visits: VisitRepository;
  savedPlaces: SavedPlacesRepository;
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}
