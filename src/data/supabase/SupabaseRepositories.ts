import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { filterRestaurants } from '@/domain/filterRestaurants';
import {
  NotFoundError,
  type Repositories,
  type RestaurantRepository,
  type SavedPlacesRepository,
  type VisitRepository,
} from '@/domain/repositories';
import type { NewVisit, Restaurant, SavedStatus } from '@/domain/types';
import {
  toRestaurant,
  toSavedPlace,
  toVisit,
  toVisitWithAuthor,
  type AttributeRow,
  type RestaurantRow,
  type SavedPlaceRow,
  type VisitRow,
} from './mapping';
import { AnonymousSession } from './session';

const FOREIGN_KEY_VIOLATION = '23503';
const CHECK_VIOLATION = '23514';

/** Turn a PostgREST error into something the UI (and the repository contract) understands. */
function toError(error: PostgrestError, what: string): Error {
  if (error.code === FOREIGN_KEY_VIOLATION) return new NotFoundError(what);
  if (error.code === CHECK_VIOLATION) return new RangeError(error.message);
  return new Error(error.message);
}

const VISIT_SELECT =
  '*, visit_attribute_confirmations(key, value), author:profiles(id, display_name, avatar_emoji)';

class Context {
  readonly session: AnonymousSession;
  constructor(readonly client: SupabaseClient) {
    this.session = new AnonymousSession(client);
  }

  /**
   * Restaurants with their *effective* attributes (latest confirmation wins; see the
   * restaurant_attributes_effective view). There are few restaurants, so this fetches them all
   * and lets the pure `filterRestaurants` do the filtering, giving identical behavior to the
   * mock. If the catalog grows large, push the filters into the query instead.
   */
  async fetchRestaurants(ids?: string[]): Promise<Restaurant[]> {
    if (ids && ids.length === 0) return [];
    let restaurants = this.client.from('restaurants').select('*');
    let attributes = this.client.from('restaurant_attributes_effective').select('*');
    if (ids) {
      restaurants = restaurants.in('id', ids);
      attributes = attributes.in('restaurant_id', ids);
    }
    const [r, a] = await Promise.all([restaurants, attributes]);
    if (r.error) throw toError(r.error, 'Restaurant');
    if (a.error) throw toError(a.error, 'Restaurant attributes');
    const attributeRows = (a.data ?? []) as AttributeRow[];
    return (r.data as RestaurantRow[]).map((row) => toRestaurant(row, attributeRows));
  }
}

class SupabaseRestaurantRepository implements RestaurantRepository {
  constructor(private ctx: Context) {}

  async search(filters = {}) {
    return filterRestaurants(await this.ctx.fetchRestaurants(), filters);
  }

  async getById(id: string) {
    const [restaurant] = await this.ctx.fetchRestaurants([id]);
    return restaurant ?? null;
  }
}

class SupabaseVisitRepository implements VisitRepository {
  constructor(private ctx: Context) {}

  async create(input: NewVisit) {
    await this.ctx.session.userId();
    const { data: id, error } = await this.ctx.client.rpc('log_visit', {
      p_restaurant_id: input.restaurantId,
      p_visited_at: input.visitedAt,
      p_food_rating: input.foodRating,
      p_stress_level: input.stressLevel,
      p_note: input.note ?? null,
      p_photo_url: input.photoUrl ?? null,
      p_confirmed: input.confirmedAttributes,
    });
    if (error) throw toError(error, 'Restaurant');

    const { data, error: readError } = await this.ctx.client
      .from('visits')
      .select(VISIT_SELECT)
      .eq('id', id as string)
      .single();
    if (readError) throw toError(readError, 'Visit');
    return toVisit(data as unknown as VisitRow);
  }

  async listByRestaurant(restaurantId: string) {
    const me = await this.ctx.session.peekUserId();
    const { data, error } = await this.ctx.client
      .from('visits')
      .select(VISIT_SELECT)
      .eq('restaurant_id', restaurantId)
      .order('visited_at', { ascending: false });
    if (error) throw toError(error, 'Visits');
    return (data as unknown as VisitRow[]).map((row) => toVisitWithAuthor(row, me));
  }

  async listMine() {
    const me = await this.ctx.session.peekUserId();
    if (!me) return [];
    const { data, error } = await this.ctx.client
      .from('visits')
      .select(VISIT_SELECT)
      .eq('user_id', me)
      .order('visited_at', { ascending: false });
    if (error) throw toError(error, 'Visits');
    return (data as unknown as VisitRow[]).map(toVisit);
  }
}

class SupabaseSavedPlacesRepository implements SavedPlacesRepository {
  constructor(private ctx: Context) {}

  async list(status?: SavedStatus) {
    const me = await this.ctx.session.peekUserId();
    if (!me) return [];
    let query = this.ctx.client
      .from('saved_places')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw toError(error, 'Saved places');

    const saved = (data as SavedPlaceRow[]).map(toSavedPlace);
    const restaurants = await this.ctx.fetchRestaurants(saved.map((s) => s.restaurantId));
    return saved.flatMap((s) => {
      const restaurant = restaurants.find((r) => r.id === s.restaurantId);
      return restaurant ? [{ ...s, restaurant }] : [];
    });
  }

  async get(restaurantId: string) {
    const me = await this.ctx.session.peekUserId();
    if (!me) return null;
    const { data, error } = await this.ctx.client
      .from('saved_places')
      .select('*')
      .eq('user_id', me)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    if (error) throw toError(error, 'Saved place');
    return data ? toSavedPlace(data as SavedPlaceRow) : null;
  }

  async save(restaurantId: string, status: SavedStatus) {
    const me = await this.ctx.session.userId();
    // Upsert only sends these columns, so created_at keeps its original value on a status change.
    const { data, error } = await this.ctx.client
      .from('saved_places')
      .upsert(
        { user_id: me, restaurant_id: restaurantId, status },
        { onConflict: 'user_id,restaurant_id' },
      )
      .select()
      .single();
    if (error) throw toError(error, 'Restaurant');
    return toSavedPlace(data as SavedPlaceRow);
  }

  async remove(restaurantId: string) {
    const me = await this.ctx.session.peekUserId();
    if (!me) return;
    const { error } = await this.ctx.client
      .from('saved_places')
      .delete()
      .eq('user_id', me)
      .eq('restaurant_id', restaurantId);
    if (error) throw toError(error, 'Saved place');
  }
}

export function createSupabaseRepositories(client: SupabaseClient): Repositories {
  const ctx = new Context(client);
  return {
    restaurants: new SupabaseRestaurantRepository(ctx),
    visits: new SupabaseVisitRepository(ctx),
    savedPlaces: new SupabaseSavedPlacesRepository(ctx),
  };
}
