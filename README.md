# Table for Little Ones

A mobile-first web app for parents of young kids in New York City: **"Where can we eat tonight with the kids?"** Find relaxed, kid-friendly restaurants, log the places you've been, and share them with other parents.

> **Phase 1: front end only.** All data is **fake** and lives in your browser. There is no back end yet.
> Every restaurant, address, and note is invented. The app shows a "Sample data" badge to make this obvious.

## Run it

Requires Node 20+ (developed on Node 24; regenerating the Supabase seed file needs Node 22.6+).

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

### The key idea: UI depends on interfaces, never on an implementation

```
Component -> useRestaurants() hook -> useRepositories() -> RestaurantRepository (interface)
                                                                 ^
                                              src/app/repositories.ts picks the implementation
```

- `src/domain/repositories.ts` defines `RestaurantRepository`, `VisitRepository`, and `SavedPlacesRepository`.
- `src/data/mock/` implements them against seed data and `localStorage`.
- `src/app/repositories.ts` is the **only** place that imports an implementation. An ESLint rule (`no-restricted-imports`) fails the build if anything else imports from `data/mock`, `data/supabase`, or `@supabase/supabase-js`.
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

## Using Supabase

The app runs on the in-browser mock by default. It switches to Supabase when two env vars are set. **Nothing in `src/features` or `src/components` changes between the two**: the only file that picks an implementation is `src/app/repositories.ts`.

### One-time setup

1. **Enable anonymous sign-ins:** Supabase dashboard -> Authentication -> Sign In / Providers -> turn on **Allow anonymous sign-ins**. Each browser then gets its own private user automatically (no login screen). Real login can be added later and keeps the same user ids.
2. **Create the schema:** open the SQL editor, paste and run [supabase/migrations/20261008000000_init.sql](supabase/migrations/20261008000000_init.sql). It creates the tables, row-level security, the `restaurant_attributes_effective` view, and the `log_visit` function.
3. **Load the sample data:** run [supabase/seed.sql](supabase/seed.sql) in the same editor. It is generated from the app's fake seed data (`npm run seed:sql` regenerates it) and is safe to run twice.
4. **Add your keys:** copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL`, and set `VITE_SUPABASE_ANON_KEY` to the public **anon / publishable** key (Project Settings -> API). **Never** use the `service_role` / secret key: everything prefixed `VITE_` is shipped to the browser.
5. Restart `npm run dev`. The browser console says `[data] Using Supabase`. Add `?data=mock` to the URL to force the mock.

### How it works

- **Identity:** the first time someone saves a place or logs a visit, they are signed in anonymously and Supabase keeps the session in `localStorage`. Merely browsing never creates a user. (`src/data/supabase/session.ts`)
- **Security (row-level security):** restaurants, attributes, and parents' notes are readable by everyone; visits and saved places can only be written as yourself; saved places are private to their owner. Clients can't update or delete visits.
- **Effective attributes:** the view returns, per attribute, the latest of the stored value and any visit confirmation (the same rule as `data/mock/effectiveRestaurant.ts`).
- **Logging a visit** is one atomic `log_visit` call (the visit plus its confirmations). The hook then marks the place "Been there", same as with the mock.
- **Filtering** is done in the browser with the same pure `filterRestaurants` function the mock uses, after fetching all restaurants. That is fine for a few dozen places; push the filters into the SQL query if the catalog grows large.
- **Photos** are small data URLs stored in `visits.photo_url`. Move them to Supabase Storage when you're ready.

### Verifying a real project

The shared contract tests can run against your real project. They sign in as brand-new anonymous users and create visits and saved places, so prefer a test project:

```bash
SUPABASE_CONTRACT_URL=https://xxx.supabase.co SUPABASE_CONTRACT_KEY=<anon key> npm test
```

Without those variables the Supabase contract test is skipped.

Also note the share link: `useShare` builds links on the app's own origin. `/restaurants/:id` already works for everyone. A shared _list_ link (`/places?tab=...`) is still a placeholder that shows the _viewer's_ saved places; a real shared list needs a list id and a public route.

## Decisions and trade-offs

- **Fictional restaurants:** invented names in real neighborhoods, so nobody mistakes fake attributes for claims about real businesses.
- **Photos:** generated placeholders (gradient plus cuisine emoji), no external image hosting. A photo added in Quick log is shrunk to a small JPEG and kept in `localStorage` only.
- **No UI or icon libraries:** the bottom sheet uses the native `<dialog>` element (focus trap and Esc for free) and icons are a small inline SVG set.
- **Filters apply live** (they're URL state), so the Filters sheet has no draft/apply step.
- **Tests polyfill `<dialog>`:** jsdom doesn't implement `showModal()`, so `src/test/setup.ts` adds a minimal version.
- **ESLint 9, not 10:** `eslint-plugin-jsx-a11y` doesn't support ESLint 10 yet.

## Known limitations

- No login screen: with the mock there is one hardcoded user; with Supabase each browser is an anonymous user (clearing site data loses that identity and its saved places).
- Hours are weekly windows in New York time; holidays and special hours aren't modeled.
- If you run the project from a path containing `*` (like the original folder name), Vite prints a warning. It works, but renaming the folder is cleaner.
