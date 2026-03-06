# Tiny Inventory — Server

> REST API built with Express.js, TypeScript, Prisma ORM, and PostgreSQL.

For full setup and run instructions, see the [root README](../README.md).

---

## Scripts

| Script               | Description                              |
|----------------------|------------------------------------------|
| `npm run dev`        | Start development server with hot-reload |
| `npm run build`      | Compile TypeScript to `dist/`            |
| `npm start`          | Run production build                     |
| `npm test`           | Run all tests (unit + integration)       |
| `npm run test:watch` | Run tests in watch mode                  |

---

## API Documentation

Interactive Swagger UI at [`localhost:4000/api/docs`](http://localhost:4000/api/docs).

The OpenAPI spec is defined in `src/swagger.ts` — changes are reflected on server restart. No build step required.

---

## Project Structure

```
server/
├── src/
│   ├── routes/
│   │   ├── stores.ts           # Store CRUD + inventory + product listing
│   │   └── products.ts         # Global product listing + product CRUD
│   ├── middleware/
│   │   ├── validation.ts       # Zod-based request body validation
│   │   └── errorHandler.ts     # Centralized error handling (AppError, asyncHandler)
│   ├── schemas/
│   │   └── product.ts          # Shared Zod product schema
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   ├── db.ts                   # PrismaClient singleton with pg adapter
│   ├── swagger.ts              # OpenAPI 3.0 spec (serves Swagger UI)
│   ├── seed.ts                 # Database seed script (3 stores, 75 products)
│   └── index.ts                # Express app setup, graceful shutdown
├── prisma/
│   ├── schema.prisma           # Data model (Store, Product)
│   └── migrations/             # SQL migration files
├── tests/
│   ├── integration/            # Real HTTP + real PostgreSQL
│   │   ├── stores.test.ts      # Store CRUD, inventory, cascade delete
│   │   ├── products.test.ts    # Product CRUD, filtering, pagination, sorting
│   │   └── health.test.ts      # Health endpoint
│   └── unit/                   # No database or HTTP required
│       ├── schemas.test.ts     # Product schema validation rules
│       ├── validation.test.ts  # Validation middleware
│       └── errorHandler.test.ts# Error classes and handler
├── Dockerfile                  # Multi-stage production image (Node 20 Alpine)
├── entrypoint.sh               # Docker entrypoint (seed + start)
└── vitest.config.ts            # Test configuration
```

---

## Testing

**90 tests** — 24 unit + 66 integration, all using Vitest.

| Suite | Count | What it covers |
|-------|-------|----------------|
| **Unit** (`tests/unit/`) | 24 | Zod schemas, validation middleware, error handler classes — no database needed |
| **Integration** (`tests/integration/`) | 66 | Real HTTP via Supertest + real PostgreSQL: CRUD, filtering, pagination, sorting, aggregation, cascade deletes, error handling |

Integration tests require `DATABASE_URL` to be set and the database to be accessible. Tests clean up after themselves (truncate tables between runs).

---

## Docker

Multi-stage build on Node 20 Alpine:

1. **Build stage** — installs all deps, generates Prisma client, compiles TypeScript
2. **Production stage** — copies only compiled JS + production deps. No Prisma CLI, TypeScript, or dev tools

The container runs as non-root `appuser` with a health check on `/api/health`.

On startup, `entrypoint.sh` seeds the database with sample data, then starts the server. The database schema is created by PostgreSQL's init mechanism (via `docker-compose.yml`), not by Prisma at runtime.
