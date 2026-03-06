# Tiny Inventory — Frontend

> React single-page application for managing stores and products. Built with React 19, TypeScript, and Vite.

For full setup and run instructions, see the [root README](../README.md).

---

## Scripts

| Script              | Description                           |
|---------------------|---------------------------------------|
| `npm run dev`       | Start Vite dev server with HMR        |
| `npm run build`     | Type-check and build for production   |
| `npm run preview`   | Serve production build locally        |
| `npm test`          | Run unit tests                        |
| `npx eslint src/`   | Lint source files                     |

---

## Pages

### Store List (`/`)

- Store cards in a grid layout — name, address, product count
- Inline form to create new stores
- Delete stores with confirmation dialog

### Store Detail (`/stores/:id`)

- Store info header with edit and delete controls
- Inventory summary panel — total value, product/item counts, per-category breakdown
- Product table with:
  - **Filtering** — category dropdown, price range, in-stock toggle
  - **Sorting** — by name, price, quantity, or date
  - **Pagination** — previous/next with page indicators
- Inline create, edit, and delete for products

### All Products (`/products`)

- Browse products across all stores in a single table
- Filter by store, category, price range, and in-stock status
- Sort and paginate with total count

---

## Project Structure

```
web/
├── src/
│   ├── api/
│   │   └── client.ts          # Typed API client (fetch wrapper)
│   ├── components/
│   │   ├── StoreForm.tsx      # Store create/edit form
│   │   ├── ProductForm.tsx    # Product create/edit form
│   │   └── Form.module.css    # Shared form styles
│   ├── pages/
│   │   ├── StoreList.tsx      # Store listing page
│   │   ├── StoreList.module.css
│   │   ├── StoreDetail.tsx    # Store detail with products
│   │   ├── StoreDetail.module.css
│   │   ├── ProductList.tsx    # Global product browser
│   │   └── ProductList.module.css
│   ├── types/
│   │   └── index.ts           # Shared TypeScript interfaces
│   ├── App.tsx                # Route definitions
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── tests/
│   ├── setup.ts               # Test setup (jsdom, CSS Modules config)
│   └── unit/                  # All unit tests
├── Dockerfile                 # Multi-stage: build + nginx
├── nginx.conf                 # SPA routing + API proxy
└── vite.config.ts             # Vite config with API proxy
```

---

## Testing

**58 unit tests** using Vitest, Testing Library, and jsdom.

| Suite | Count | What it covers |
|-------|-------|----------------|
| **API client** | 15 | All fetch calls, query param building, error extraction |
| **StoreForm / ProductForm** | 17 | Rendering, validation, submission, error display |
| **App routing** | 4 | Correct page rendered per route |
| **StoreList** | 9 | Loading, empty, error states, create/delete flows |
| **StoreDetail** | 13 | Inventory summary, product table, edit/add/delete, navigation |

All API calls are mocked — no server required.

---

## Styling

CSS Modules for component-scoped styles with a small set of global utilities in `index.css`. No external UI framework — all components styled from scratch.

---

## Docker

Multi-stage build:

1. **Build stage** — installs deps, compiles TypeScript, bundles with Vite
2. **Runtime stage** — serves static `dist/` via nginx Alpine

nginx handles SPA routing (non-file requests fall back to `index.html`) and API proxying (`/api/*` -> `server:4000`).
