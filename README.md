# signon-homework

Single-page application for managing **trains**, **RBCs** (Radio Block Centres), and the keyed relations between them. The app is fully client-side; there is no backend — API traffic is intercepted by MSW in the browser and persisted to `localStorage`.

## Disclaimer

This project was developed in part with the assistance of [Claude Code](https://claude.ai/code), Anthropic's AI-powered development CLI. It was used as a sparring partner during the planning phase — evaluating library choices, scaffolding the initial application structure, and authoring portions of the component code.

All architectural and structural decisions were made by the author. Component composition, detail-level styling, and the overall design of the application remained under the author's full direction and ownership.

This codebase should be regarded as a raw MVP. In a production context the following areas would be revisited:

- **Styling** — a more systematic design-system approach with consistent spacing, typography, and thorough responsive behaviour.
- **Data modelling** — richer domain types, stricter validation at system boundaries, and a proper persistence layer.
- **Documentation** — inline code documentation, architectural decision records, and contribution guidelines.
- **Testing** — unit, integration, and end-to-end test coverage.

## Quick start

```bash
pnpm install
pnpm dev          # start Vite dev server + MSW worker
pnpm build        # tsc -b && vite build
pnpm lint         # eslint
pnpm preview      # preview the production build
```

Package manager: **pnpm** (use `pnpm`, not `npm`/`npx`).

## Stack

- **React 19** with the React Compiler enabled (auto-memoisation via `babel-plugin-react-compiler`).
- **TypeScript 5.9**.
- **Vite 8** for dev server and build.
- **Tailwind CSS v4** via `@tailwindcss/vite` — design tokens live in `src/index.css` under an `@theme` block (`db-red`, `db-black`, focus blue).
- **MSW 2** (Mock Service Worker) — all `/api/*` calls are mocked in the browser; seed data is reset via `GET /api/reset`.

## Key libraries

- **React Router v7** — client-side routing.
- **TanStack Query v5** — server-state, caching, and invalidation.
- **TanStack Table + TanStack Virtual** — virtualised tables for large data sets.
- **React Hook Form + Zod + `@hookform/resolvers`** — form state with schema validation.
- **Radix UI + shadcn/ui** — accessible, unstyled primitives under `src/components/ui/`.
- **vaul** — drawer component used by the form drawers.
- **cmdk** — command-palette and combobox primitives used in filter bars.
- **lucide-react** — icons.
- **class-variance-authority**, **clsx**, **tailwind-merge** — composed through the `cn()` helper in `src/lib/utils.ts`.
- **lodash-es** — data-handling helpers.

## Project layout

```
src/
├─ api/                      # fetch wrappers + TanStack Query hooks (one file per resource)
│  ├─ trains.ts
│  ├─ rbcs.ts
│  └─ relations.ts
├─ components/               # one folder per component, kebab-case
│  ├─ ui/                    # shadcn/Radix primitives (Button, Dialog, Table, …)
│  ├─ app-layout/
│  ├─ form-drawer/           # shared drawer shell used by all form drawers
│  ├─ train-form-drawer/
│  ├─ rbc-form-drawer/
│  ├─ key-form-drawer/
│  ├─ relation-matrix/
│  ├─ trains-page/
│  ├─ rbcs-page/
│  ├─ matrix-page/
│  └─ …
├─ hooks/                    # custom hooks (use-document-title, use-quick-jump)
├─ lib/                      # framework-agnostic helpers
│  ├─ mixins.ts              # reusable Tailwind class constants
│  └─ utils.ts               # cn() helper
├─ mocks/                    # MSW setup
│  ├─ handlers.ts            # HTTP handlers
│  ├─ data.ts                # in-memory store + localStorage persistence
│  └─ browser.ts             # worker setup
├─ pages/                    # route components
│  ├─ trains-page.tsx
│  ├─ rbcs-page.tsx
│  ├─ matrix-page.tsx
│  └─ settings-page.tsx
├─ assets/                   # static assets (fonts)
├─ app.tsx                   # root component + routing
├─ main.tsx                  # entry point, MSW bootstrap
├─ index.css                 # Tailwind v4 + @theme tokens
└─ types.ts                  # domain types: Train, RBC, Relation
```

Import alias: `@/` → `src/` (configured in `vite.config.ts`).

## API surface (mocked)

All endpoints are defined in `src/mocks/handlers.ts`. Each handler applies a 200–600 ms artificial delay and persists to `localStorage`.

### Trains

| Method | Path                | Purpose                              |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/api/trains`       | List all trains                      |
| POST   | `/api/trains`       | Create a train                       |
| PUT    | `/api/trains/:id`   | Update a train                       |
| DELETE | `/api/trains/:id`   | Delete a train (cascades to relations) |

### RBCs

| Method | Path              | Purpose                              |
| ------ | ----------------- | ------------------------------------ |
| GET    | `/api/rbcs`       | List all RBCs                        |
| POST   | `/api/rbcs`       | Create an RBC                        |
| PUT    | `/api/rbcs/:id`   | Update an RBC                        |
| DELETE | `/api/rbcs/:id`   | Delete an RBC (cascades to relations) |

### Relations

| Method | Path                                        | Purpose                                                  |
| ------ | ------------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/relations`                            | List relations (optional `?trainId=&rbcId=` filters)     |
| POST   | `/api/relations`                            | Create a relation (`{ trainId, rbcId, key }`)            |
| PUT    | `/api/relations/:trainId/:rbcId/key`        | Update the key on an existing relation                   |
| DELETE | `/api/relations/:trainId/:rbcId`            | Delete a relation                                        |

### Utility

| Method | Path         | Purpose                                               |
| ------ | ------------ | ----------------------------------------------------- |
| GET    | `/api/reset` | Reset all data to seed values (used by Settings page) |

## Conventions

### Files & exports

- **kebab-case** file names throughout (`train-form-drawer.tsx`, not `TrainFormDrawer.tsx`).
- **Named exports** preferred — `export function Foo()` over `export default`.
- One folder per component: `components/<name>/<name>.tsx`. Small helpers (`utils.ts`) are co-located in the same folder.

### Forms & drawers

- `FormDrawer` (`src/components/form-drawer/form-drawer.tsx`) is the shared shell: it handles open/close, dirty tracking, cancel-with-confirmation, and save/delete actions.
- Concrete forms (`train-form-drawer`, `rbc-form-drawer`, `key-form-drawer`) compose **react-hook-form** + **zod** through `@hookform/resolvers/zod` with the shadcn `Form` primitives.
- Deletion uses a render-prop: `renderRemoveDialog?: (trigger: ReactNode) => ReactNode` — the drawer renders the trigger, the caller supplies the confirmation dialog.
- Shared field layouts come from `src/lib/mixins.ts` (e.g. `formFieldsContainer`).

### Data access

- Thin `fetch` wrappers in `src/api/*.ts`, one file per resource.
- **TanStack Query v5** with array query keys (`["trains"]`, `["relations", { trainId }]`).
- Mutations invalidate affected keys on success; the UI refreshes automatically.
- `useSuspenseQuery` is used where the page shell already awaits data via a router loader.
- Non-ok responses throw; form/drawer errors are surfaced locally.

### Styling

> **Note:** styling in this codebase is deliberately quick-and-dirty — there is no strict design-system abstraction, utility classes are often composed inline, and some spacing/colour choices are pragmatic rather than systematic.

- Tailwind CSS v4 via `@tailwindcss/vite`.
- Design tokens declared in the `@theme` block in `src/index.css` (DB brand colours: `db-red`, `db-black`, focus blue).
- `clsx` + `tailwind-merge` composed through the `cn()` helper in `src/lib/utils.ts`.
- UI primitives in `src/components/ui/` (shadcn-style, Radix-based).

## Domain model

Defined in `src/types.ts`:

- **Train** — `{ id, trainType, trainNumber, operator, notes }`
- **RBC** — `{ id, name, location, manufacturer, status, notes }`
- **Relation** — `{ trainId, rbcId, key }` (composite key on `(trainId, rbcId)`)

A relation represents a train being keyed against an RBC. Deleting a train or RBC cascades to remove its relations.

## Pages

- **Trains** (`/zuege`) — virtualised table, filter bar, form drawer for create/edit/delete.
- **RBCs** (`/rbcs`) — same pattern as Trains.
- **Matrix** (`/matrix`) — train × RBC grid showing keyed relations; click-to-edit via the key drawer.
- **Settings** (`/einstellungen`) — data reset + in-app documentation (stack, folder tree, API reference, conventions).
