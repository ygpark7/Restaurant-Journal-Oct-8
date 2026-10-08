/**
 * Repository interfaces. UI code depends ONLY on these, never on an implementation.
 * The implementation is chosen in exactly one place: src/app/repositories.ts.
 */
import type {
  AuthUser,
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
  /** Rejects with NotFoundError for an unknown restaurant, NotSignedInError when signed out. */
  create(visit: NewVisit): Promise<Visit>;
  /** Newest first. */
  listByRestaurant(restaurantId: Id): Promise<VisitWithAuthor[]>;
  /** The current user's visits, newest first. */
  listMine(): Promise<Visit[]>;
}

export interface SavedPlacesRepository {
  /** The current user's saved places, newest first, optionally filtered by status (empty when signed out). */
  list(status?: SavedStatus): Promise<SavedPlaceWithRestaurant[]>;
  get(restaurantId: Id): Promise<SavedPlace | null>;
  /** Upsert: saving an already-saved place just changes its status. Rejects with NotSignedInError when signed out. */
  save(restaurantId: Id, status: SavedStatus): Promise<SavedPlace>;
  remove(restaurantId: Id): Promise<void>;
}

export interface SignUpResult {
  /** True when the account exists but the person must click a link in their email first. */
  needsEmailConfirmation: boolean;
}

export interface AuthRepository {
  /** The signed-in user, or null. */
  getUser(): Promise<AuthUser | null>;
  /** Called whenever the signed-in user changes. Returns an unsubscribe function. */
  onChange(listener: (user: AuthUser | null) => void): () => void;
  signUp(input: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<SignUpResult>;
  /** Rejects with an Error whose message is safe to show the person. */
  signIn(input: { email: string; password: string }): Promise<void>;
  signOut(): Promise<void>;
}

export interface Repositories {
  auth: AuthRepository;
  restaurants: RestaurantRepository;
  visits: VisitRepository;
  savedPlaces: SavedPlacesRepository;
}

/** Writing visits or saved places needs an account. Reads of public data never do. */
export class NotSignedInError extends Error {
  constructor() {
    super('Please sign in to do that');
    this.name = 'NotSignedInError';
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}
