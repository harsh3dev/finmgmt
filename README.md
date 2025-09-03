## Finance Dashboard (Frontend)

**Adaptive, secure, and extensible financial data workspace with smart widget intelligence.**  
*Connect market & currency APIs • Auto-generate visualizations • Persist & secure API keys • Explore JSON dynamically*

Links: [Demo](#demo) · [Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Roadmap](#roadmap)

---

## Demo

Live App: (placeholder – deploy URL)  
Video Walkthrough: (placeholder – Loom/YouTube link)


---

## Features

Core functionality:

- ✅ Smart widget type inference (auto card / table / chart selection from raw JSON)
- ✅ Hierarchical field explorer (nested objects & arrays with type detection)
- ✅ Secure API key encryption (AES‑GCM + device-derived key, masked display)
- ✅ Responsive bento grid with drag‑and‑drop & expansion logic
- ✅ Table widgets: search, pagination, adaptive column formatting
- ✅ Chart widgets: numeric string parsing & adaptive chart selection
- ✅ Manual refresh + intelligent caching layer (avoids redundant calls)
- ✅ Persistent local storage hydration (stable pre-hydration gating)
- ✅ Theming (dark / light) + accessible semantic styling
- ✅ Inline API endpoint creation & re-use across widgets
- ✅ Widget reconfiguration (rename, reselect fields, change layout)
- ✅ Template system groundwork (API key injection + metadata integration)
- ✅ Import / export sharable dashboard configurations
- ✅ Sidebar navigation system & multi-page restructuring
- ✅ Advanced template marketplace & sharing
- ✅ Pluggable widget module architecture
- ✅ Shared template + layout export for collaboration


---

## Tech Stack

| Layer | Tool / Library | Why |
|-------|----------------|-----|
| Framework | Next.js (App Router) | File-based routing, server components, SSR/ISR flexibility |
| Language | TypeScript | Type safety, maintainability |
| Styling | Tailwind CSS + shadcn/ui | consistent design + reusable components |
| State (app) | Redux Toolkit | Central persistence (widgets, endpoints, layout) |
| Persistence | LocalStorage + controlled hydration middleware | Prevents race conditions & ensures atomic restore |
| Security | Web Crypto | Local encryption of API keys |
| Validation | Zod (via internal modules) | Input resilience + safer runtime checks |

---

## Architecture

High-level flow:

```mermaid
flowchart LR
	U[User] --> UI[Dashboard UI]
	UI --> WG[Widget Layer]
	subgraph Redux
		ST["State Slices (widgets, apis, layout)"]
	end
	WG -->|needs data| APIService
	APIService --> Cache["In-Memory Cache"]
	APIService --> ExternalAPIs["External Financial APIs"]
	WG --> FieldAnalyzer["Field Analyzer"]
	FieldAnalyzer --> Renderer["Smart Renderer (Card / Table / Chart)"]
	ST --> Persistence["LocalStorage"]
	SecureKeys["Secure Storage (AES-GCM)"] --> APIService
	SecureKeys --> ST
```

Component / Responsibility Map:

```mermaid
graph TD
	A[page.tsx / layout.tsx] --> B[Dashboard Pages]
	B --> C[Add Widget Modal]
	B --> D[API Manager]
	C --> E[Field Selection UI]
	E --> F[Field Analyzer]
	F --> G[Widget Renderer Helpers]
	G --> H[Card/Table/Chart Components]
	D --> I[Secure API Key Hook]
	I --> J[Encryption Utilities]
	B --> K[Template Manager]
	K --> L[API Injection Flow]
	B --> M[Export / Import System]
	M --> N[Validation + Tracker]
	B --> O[Persistence Middleware]
	O --> P[LocalStorage]
```

### Directory Overview

```
src/
	app/                # Next.js routes (home, dashboard)
	components/         # UI + feature components (modals, lists, widgets)
	hooks/              # Custom logic (API testing, encryption, field mapping, persistence)
	lib/                # Core service modules (api-service, storage, analyzer, exporters)
	store/              # Redux slices, middleware, root reducer
	types/              # Shared TypeScript contracts
	constants/          # Template, navigation, modal configuration metadata
```

### Key Concepts

1. Smart Rendering: Widget creation defers choosing a visualization until data shape analysis (array vs object vs scalar) completes.
2. Field Analyzer: Parses nested JSON → tree nodes with metadata (isArray, numeric, date-like, etc.) enabling context-aware UI.
3. Secure API Keys: Keys encrypted with AES-GCM using a derived per-device key; only decrypted transiently for outbound requests.
4. Controlled Hydration: Middleware blocks persistence writes until initial state restored to prevent destructive overwrites.
5. Adaptive Layout: Bento grid assigns variable spans to widget types (e.g. tables wider) with drag-and-drop ordering.
6. Caching Strategy: In-memory map keyed by endpoint + params; manual refresh bypasses cache.
7. Template System: Provides blueprint objects referencing required API keys; injects resolved keys at apply time.

---

## Data Lifecycle

1. User defines or selects an API endpoint (optionally via cURL parser) → stored in Redux & encrypted if key-bound.
2. Widget created referencing endpoint ID → fetch triggered via api-service.
3. Response analyzed → tree metadata generated → optimal display mode inferred (card, table, chart).
4. Renderer builds UI; user can expand, reconfigure, rename, or refresh.
5. State (widgets, layout, endpoints) persisted after hydration gate opens.

---

## Persistence Flow (Redux + localStorage)

End-to-end view of how state is restored and then persisted without race conditions.

```mermaid
flowchart TD
	Mount[App Mount] --> MWInit["Persistence Middleware Init"]
	MWInit --> StorageMgr["Storage Manager (dashboard-storage.ts)"]
	StorageMgr --> ReadLS{Snapshot Exists?}
	ReadLS -- Yes --> Load["Read & Parse JSON"]
	Load --> Hydrate["Dispatch HYDRATE actions per slice"]
	ReadLS -- No --> GateOpen["Set hydrated = true"]
	Hydrate --> GateOpen
	GateOpen --> UserAction["User Action (add / update / remove widget / endpoint)"]
	UserAction --> ReduxUpdate["Redux State Updated"]
	ReduxUpdate --> PersistCheck{hydrated?}
	PersistCheck -- No --> Skip["Skip Write"]
	PersistCheck -- Yes --> Select["Select Persisted Slices (widgets, endpoints, layout)"]
	Select --> Serialize["JSON Serialize"]
	Serialize --> StorageMgr
	StorageMgr --> WriteLS["localStorage Write"]
	WriteLS --> Ready["State Persisted"]
	Ready --> UserAction
```

Key points:

- Hydration Gate: Prevents clobbering stored state during initial mount; writes are suppressed until hydrate completes.
- Slice Selection: Only whitelisted slices (widgets, endpoints, layout) are serialized—avoids volatile/transient UI state.
- Atomic Writes: Full snapshot replace strategy keeps structure consistent and simplifies versioning.
- Extensibility: New slices can be added by extending the allowlist in the persistence middleware.
- Safety: Malformed JSON triggers a guarded fallback (fresh state) without crashing the app (implemented via try/catch in middleware logic).
 - Storage Manager: Encapsulates read/write (with version tag + future migration hooks) so middleware stays pure and testable.

### Import / Export Flow

The import/export system ensures portable, safe dashboard state sharing without leaking sensitive credentials.

Export (dashboard-export.ts):
1. Aggregate: Collect whitelisted slices (widgets, endpoints, layout, templates metadata).
2. Sanitize: Strip or mask sensitive fields (encrypted API key payloads excluded; only key references kept).
3. Normalize: Re-map transient UI-only flags out (e.g., expansion state) to keep export deterministic.
4. Annotate: Attach version, timestamp, and schema signature for forward compatibility.
5. Serialize & Download: Generate JSON blob; user triggers browser download.

Import (dashboard-import.ts + import-tracker.ts):
1. Parse: Attempt JSON parse; reject early on size or invalid structure.
2. Validate: Run Zod schema validation (shape, required arrays, version).
3. Migrate (if needed): Apply lightweight transformation when version < current (placeholder hooks).
4. Reconcile IDs: Generate new UUIDs where collisions exist (widgets/endpoints) while maintaining internal references.
5. Merge Strategy: Existing state can be replaced or merged (future toggle) — current behavior: additive merge with overwrite for identical endpoint signatures.
6. Dispatch: Batched Redux actions hydrate imported entities after hydration gate.
7. Track: Import tracker logs summary (counts, skipped, newly added) for future UI feedback.

Guarantees:
- No secret material injected (API keys must still be supplied locally post-import).
- Consistent ordering for deterministic diffs.
- Forward-compatible via version + optional migration layer.
- Safe failure modes (partial writes avoided; import only commits after full validation passes).

---

## Development

Install deps:
```bash
npm install
```

Run (local):
```bash
npm run dev
```

Build:
```bash
npm run build
```

Lint:
```bash
npm run lint
```

Type Check:
```bash
tsc --noEmit
```

---
