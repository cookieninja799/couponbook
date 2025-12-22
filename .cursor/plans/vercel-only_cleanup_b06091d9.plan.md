---
name: Vercel-only cleanup
overview: Standardize repo on Vercel-only deployment, run backend from source (no committed dist), tighten server-side auth/role enforcement, and expand tests (including a Vercel-entry smoke test) to prevent regressions.
todos:
  - id: inventory-docs
    content: Write docs/ARCHITECTURE.md and docs/DATA_MODEL.md describing the final Vercel → Express → Drizzle architecture and key tables/relationships.
    status: pending
  - id: remove-serverless
    content: Remove legacy AWS Lambda/Serverless Framework artifacts and dependencies; update README/env templates to be Vercel-only.
    status: pending
  - id: vercel-entry-normalize
    content: Make one canonical Express app entry (server/src/app.js) and have api/[...slug].js import backend source directly; ensure server-dist is not used and not committed.
    status: pending
  - id: vercel-smoke-test
    content: Add a CI smoke test that imports api/[...slug].js and executes a request (supertest) to catch runtime import/ESM issues early.
    status: pending
  - id: authz-hardening
    content: Enforce auth + role/ownership server-side for coupon creation/update/redemption/submission approval and merchant insights scoping.
    status: pending
  - id: tests-critical-flows
    content: Add/upgrade integration tests for redemption, coupon creation authorization, merchant insights scoping, and submission pipeline permissions.
    status: pending
  - id: cleanup-final
    content: Cleanup pass for docs/scripts/envs; ensure only Vercel deployment is documented and test suite passes.
    status: pending
---

## Ground truth (current state)

- **Vercel deployment exists**: [`vercel.json`](vercel.json) rewrites `/api/:path*` → [`api/[...slug].js`](api/[...slug].js).
- **Backend exists as ESM JavaScript source**: Express + routes in `server/src/*`.
- **Legacy AWS Lambda/Serverless remnants exist**: [`serverless.yaml`](serverless.yaml), [`lambda.js`](lambda.js), root [`index.js`](index.js), `.serverless/`, and zip artifacts.
- **Known risk**: Vercel currently imports `server-dist/*`, which can drift from `server/src/*`. We will remove `server-dist` from runtime and keep **zero committed dist output**.

## 1) Inventory + final architecture docs

- Add [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md):
- Frontend (Vue) → Vercel rewrites → `api/[...slug].js `→ Express app (`server/src/app.js`) → Drizzle DB.
- Auth: Cognito JWT verified server-side in [`server/src/middleware/auth.js`](server/src/middleware/auth.js).
- API contract: `/api/v1/*` plus `/api/health` and `/api/db-ping`.
- Add [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) using [`drizzle/schema.ts`](drizzle/schema.ts), focusing on:
- `coupon`, `coupon_redemption`, `coupon_submission`
- `merchant` ownership (`merchant.owner_id` → `user.id`)
- roles: global `user.role` + per-group `foodie_group_membership.role`
- entitlement: `purchase` and/or membership.

## 2) Remove AWS Lambda / Serverless Framework remnants (Vercel-only)

- Delete legacy deployment artifacts (Vercel is the only supported path):
- [`serverless.yaml`](serverless.yaml)
- [`lambda.js`](lambda.js)
- root [`index.js`](index.js) (serverless wrapper)
- `.serverless/` directory
- any `*.zip` bundles (`function.zip`, `lambda-deploy.zip`, etc.)
- Update [`package.json`](package.json):
- Remove unused Serverless/Lambda deps: `serverless`, `serverless-dotenv-plugin`, `serverless-http`, `@vendia/serverless-express`.
- Remove dead scripts that reference Serverless/Lambda.
- Update docs and env templates:
- Remove serverless/Lambda instructions from [`README.md`](README.md) and `.env.example`.
- Document Vercel-only deployment and required env vars.

## 3) Normalize backend structure for Vercel reliability (run from source)

- Create **one canonical Express app module** with no server-start side effects:
- Add `server/src/app.js` that creates the Express app, mounts routers, and exports `app`.
- Keep `server/src/dev.js` as the local entrypoint (`connectDB()` + `app.listen()`).
- Keep `server/src/index.js` as a thin re-export if helpful, but avoid multiple competing entrypoints.
- Update [`api/[...slug].js`](api/[...slug].js) to import the app from `server/src/app.js` (ESM JS source).
- Remove `server-dist/` from the runtime story:
- Delete `server-dist/` from git and add it to `.gitignore`.
- Update `vercel-build` to not require a backend compile step (frontend build only).
- Keep serverless-safe middleware ordering and behavior:
- CORS + JSON parsing + consistent route prefix (`/api/v1/*`).
- Health endpoints should still work when DB is down.
- Error handler returns JSON.

## 4) Add a Vercel-entry smoke test (catches import/runtime drift)

- Add a new integration test (e.g. `tests/integration/api/vercel-entry.test.js`) that:
- imports the real Vercel entry: `import handler from '../../../api/[...slug].js'`
- uses `supertest(handler)` to run requests through it:
- `GET /api/health` → `200` and `{ ok: true }`
- `GET /api/v1/events` (or similar protected route) → `401`

This is specifically to fail CI early on:

- ESM/CJS import issues
- missing/incorrect exports
- entrypoint drift (Vercel path differs from what tests exercise)

## 5) Tighten server-side auth + role/ownership enforcement

- Introduce shared authorization helpers (e.g. `server/src/authz/index.js`) to:
- resolve `req.user.sub` → local `user` row (`user.cognitoSub`)
- enforce roles (`admin`, `merchant`, `foodie_group_admin`) and merchant/group ownership
- centralize 401 vs 403 behavior.

### Coupon endpoints

- Harden coupon write endpoints in [`server/src/routes/coupons.js`](server/src/routes/coupons.js):
- **POST `/api/v1/coupons`**: require auth; allow only admin OR owner of `merchant_id`; else `403`.
- **PATCH `/api/v1/coupons/:id`**: require auth; allow only admin OR owner of coupon’s merchant.
- **DELETE `/api/v1/coupons/:id`**: require auth; allow only admin OR owner.
- Harden redemption:
- Keep existing behavior: 401 unauth, 400 validity window, 200 alreadyRedeemed, 201 created.
- Add server-side entitlement enforcement for `locked` coupons (purchase/membership), not frontend-only gating.

### Coupon submission pipeline

- Ensure submission routes are correctly gated (already mostly implemented):
- submit requires auth + merchant ownership (admin bypass)
- approve/reject requires group admin role (or global admin)
- approval creates coupon safely and with correct state transitions.

### Merchant insights

- Keep `/api/v1/coupons/redemptions/merchant-insights` scoped by merchant ownership and add tests proving it.

## 6) Tests as progress meter + required new API tests

- Run the existing test suite frequently.
- Add API-level integration tests using the existing in-memory Postgres harness in [`tests/helpers/db.js`](tests/helpers/db.js).

### Required new tests (minimum)

1) **POST `/api/v1/coupons/:id/redeem`**

- unauthenticated → 401
- expired / not yet valid → 400
- first redeem → 201
- second redeem → 200 with `{ alreadyRedeemed: true }`

2) **POST `/api/v1/coupons`** (creation authz)

- unauthenticated → 401
- authenticated but wrong role / not owner → 403
- correct role (admin or merchant owner) → 201

3) **GET `/api/v1/coupons/redemptions/merchant-insights`**

- only returns coupons for merchants owned by the caller

4) **Coupon submission pipeline** (if applicable)

- submit requires auth
- approve/reject requires admin/group admin role
- approval results in published coupon (or correct status transitions)

## 7) Cleanup pass: docs, scripts, envs

- Update [`README.md`](README.md):
- how to run locally