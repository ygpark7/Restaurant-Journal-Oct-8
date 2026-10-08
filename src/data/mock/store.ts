import type { SavedPlace, Visit } from '@/domain/types';
import { readJson, writeJson } from '@/lib/storage';
import { SEED_RESTAURANTS } from './seed/restaurants';
import { SEED_VISITS } from './seed/visits';

const VISITS_KEY = 'rj:v1:visits';
const SAVED_KEY = 'rj:v1:saved';

/**
 * Tiny localStorage-backed store. Seed data lives in code; only what the user creates
 * (visits, saved places) is persisted. Reads go straight to storage, so there's no cache
 * to keep in sync.
 */
export const mockStore = {
  restaurants() {
    return SEED_RESTAURANTS;
  },
  myVisits(): Visit[] {
    return readJson<Visit[]>(VISITS_KEY, []);
  },
  allVisits(): Visit[] {
    return [...SEED_VISITS, ...this.myVisits()];
  },
  addVisit(visit: Visit): void {
    writeJson(VISITS_KEY, [...this.myVisits(), visit]);
  },
  saved(): SavedPlace[] {
    return readJson<SavedPlace[]>(SAVED_KEY, []);
  },
  setSaved(places: SavedPlace[]): void {
    writeJson(SAVED_KEY, places);
  },
};
