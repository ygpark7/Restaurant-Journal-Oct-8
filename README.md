# Table for Little Ones

A mobile-first web app for parents of young kids in New York City: **"Where can we eat tonight with the kids?"** Find relaxed, kid-friendly restaurants, log the places you've been, and share them with other parents.

> **Phase 1: front end only.** All data is **fake** and lives in your browser. There is no back end yet.
> Every restaurant, address, and note is invented. The app shows a "Sample data" badge to make this obvious.

## Run it

Requires Node 20+ (developed on Node 24).

```bash
npm install
npm run dev
```

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the dev server (Vite)           |
| `npm run build`      | Typecheck and build for production    |
| `npm run typecheck`  | TypeScript (strict) with no emit      |
| `npm run lint`       | ESLint (includes accessibility rules) |
| `npm test`           | Run the tests once (Vitest)           |
| `npm run test:watch` | Tests in watch mode                   |
| `npm run format`     | Format with Prettier                  |

### Dev switches for loading and error states

The mock data layer simulates network latency (300-800 ms). Add a query param to the URL to see other states, then reload without it to reset:

- `?mock=slow` for about 2.5 s latency (see the skeletons)
- `?mock=error` makes every request fail (see the error states)
- `?mock=flaky` makes half of the requests fail

Or set `VITE_MOCK_LATENCY_MS=0` in a `.env.local` file for instant responses.

Your saved places and logged visits are stored in `localStorage` (keys start with `rj:v1:`). Clear them in your browser's dev tools to start fresh.

## What's in it

| Screen            | Route                    | Notes                                                                                  |
| ----------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| Discover          | `/`                      | Search, quick filter chips, "Good for tonight", restaurant cards                       |
| Filters           | (bottom sheet)           | Kid-friendly attributes, noise level, cuisine, price. Filters live in the URL          |
| Restaurant detail | `/restaurants/:id`       | Kid-friendliness with "last confirmed" dates, notes from parents, Save, Log, Share     |
| Quick log         | `/log?restaurant=:id`    | Pick a place, rate food and stress, tap to confirm attributes, optional note and photo |
| My places         | `/places?tab=want\|been` | "Want to try" and "Been there" tabs, remove items, share a list                        |
| Share             |                          | Web Share API, falling back to copying the link (the link is a placeholder for now)    |

**"Good for tonight"** ranks places that are open right now (New York time) and welcome walk-ins to the top. It doesn't hide anything else.

**Logging a visit** records the visit, marks the place "Been there", and updates the "last confirmed" date of any attribute you tapped. Only attributes you actually tap are recorded.

## Architecture

```
src/
  app/        Entry point, router, app shell, and repositories.ts (the composition file)
  domain/     Types, attribute config, repository interfaces, pure filter logic (no React, no I/O)
  data/
    mock/     Mock repositories, seed data (FAKE), localStorage store, latency simulation
    contract/ Repository contract tests: any implementation must pass them
  features/   restaurants/  log/  lists/  share/   (screens, hooks, and queries per feature)
  components/ Shared UI: Button, Chip, Badge, BottomSheet, Tabs, Toast, states...
  lib/        Small helpers (dates, storage, query client, repositories context)
```

### The key idea: UI depends on interfaces, never on the mock

```
Component -> useRestaurants() hook -> useRepositories() -> RestaurantRepository (interface)
                                                                 ^
                                              src/app/repositories.ts picks the implementation
```

- `src/domain/repositories.ts` defines `RestaurantRepository`, `VisitRepository`, and `SavedPlacesRepository`.
- `src/data/mock/` implements them against seed data and `localStorage`.
- `src/app/repositories.ts` is the **only** place that imports an implementation. An ESLint rule (`no-restricted-imports`) fails the build if anything else imports from `data/mock`.
- TanStack Query wraps the repository calls in each feature's `queries.ts`. Components never see where data comes from.

### One place to change kid-friendly attributes

`src/domain/attributes.config.ts` is the single source of truth. Add, remove, or rename an attribute there and the following update automatically: filter sheet, quick-filter chips, card badges, the detail page's Kid-friendliness list, the quick-log confirmation step, and the URL filter params.

- Change a `label` or `emoji` freely.
- A `key` is what gets stored, so renaming a key means migrating stored data (see below).
- Cuisines, neighborhoods, and price tiers live in `src/domain/taxonomy.config.ts`.

### Domain types

All in `src/domain/types.ts`, shaped to map onto future tables:

| Type                   | Future table                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| `Restaurant`           | `restaurants`                                                                |
| `RestaurantAttributes` | `restaurant_attributes (restaurant_id, key, value jsonb, last_confirmed_at)` |
| `Visit`                | `visits` (+ `visit_attribute_confirmations`)                                 |
| `SavedPlace`           | `saved_places (user_id, restaurant_id, status)`                              |
| `User`                 | `profiles`                                                                   |

Two design notes:

- A restaurant's attributes are stored as rows keyed by `key`, so adding an attribute needs no database migration.
- "Notes from parents" are just visits that have a note. There is no separate notes table.

## Tests

`npm test` runs a small set of meaningful tests:

- **Filtering logic** (`domain/filterRestaurants.test.ts`): free text, cuisine/price, attribute AND/OR rules, New York time and after-midnight hours, "Good for tonight" ranking.
- **Repository contract** (`data/contract/repositoryContract.ts`): behavior every implementation must have. It runs against the mock today (`data/mock/mock.contract.test.ts`) and should run against Supabase later.
- **Quick-log flow** (`features/log/QuickLogPage.test.tsx`): full log, validation, picking a restaurant, partial confirmations, and save failure.
- **Screens**: Discover (loading, empty, error, filters), My places, Share, and URL filter params.

## How to swap in Supabase later

The goal: **change one file, not the components.**

1. **Install and configure** `@supabase/supabase-js` and add your URL and anon key to `.env.local`.
2. **Create the tables** from the mapping above. Add RLS so users can only write their own visits and saved places.
3. **Implement the three interfaces** in a new `src/data/supabase/` folder (`SupabaseRestaurantRepository`, `SupabaseVisitRepository`, `SupabaseSavedPlacesRepository`), and export a `createSupabaseRepositories(): Repositories`. Things to replicate from the mock:
   - **Effective attributes:** `Restaurant.attributes` should reflect the latest confirmation per attribute. A SQL view or `select` with a join on `visit_attribute_confirmations` does this. The mock does it in `data/mock/effectiveRestaurant.ts`.
   - **Filtering:** `RestaurantFilters` semantics (OR within an attribute, AND across attributes, text matches name/cuisine/neighborhood) are specified by `domain/filterRestaurants.ts` and the contract tests. Translate them to a query. "Good for tonight" ranking can stay client-side, since it only reorders.
   - **Current user:** read it from the Supabase session instead of the mock's `CURRENT_USER`.
   - **Photos:** upload to Supabase Storage and store the URL in `Visit.photoUrl`. Today it's a small data URL.
4. **Run the contract tests against it.** Add `src/data/supabase/supabase.contract.test.ts`:

   ```ts
   import { runRepositoryContract } from '@/data/contract/repositoryContract';
   runRepositoryContract('Supabase', () => createSupabaseRepositories(/* test client */));
   ```

   The contract assumes a fresh user with no saved places or visits for each test, so point it at a test project or reset between tests.

5. **Flip the switch** in `src/app/repositories.ts`: return `createSupabaseRepositories()` from `createAppRepositories()`. Nothing else changes.
6. **Migrate stored data** if you rename an attribute `key`: update the `restaurant_attributes.key` and `visit_attribute_confirmations.key` columns.

Also check the share link: `useShare` builds links on the app's own origin (`/restaurants/:id`). That already works for restaurants. For shared lists, `/places?tab=...` is a placeholder that shows the _viewer's_ saved places. A real shared list needs a list id and a public route.

## Decisions and trade-offs

- **Fictional restaurants:** invented names in real neighborhoods, so nobody mistakes fake attributes for claims about real businesses.
- **Photos:** generated placeholders (gradient plus cuisine emoji), no external image hosting. A photo added in Quick log is shrunk to a small JPEG and kept in `localStorage` only.
- **No UI or icon libraries:** the bottom sheet uses the native `<dialog>` element (focus trap and Esc for free) and icons are a small inline SVG set.
- **Filters apply live** (they're URL state), so the Filters sheet has no draft/apply step.
- **Tests polyfill `<dialog>`:** jsdom doesn't implement `showModal()`, so `src/test/setup.ts` adds a minimal version.
- **ESLint 9, not 10:** `eslint-plugin-jsx-a11y` doesn't support ESLint 10 yet.

## Known limitations

- Single hardcoded mock user. There is no auth.
- Hours are weekly windows in New York time; holidays and special hours aren't modeled.
- If you run the project from a path containing `*` (like the original folder name), Vite prints a warning. It works, but renaming the folder is cleaner.
