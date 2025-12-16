---
name: Coupon submission + sidebar filter alignment
overview: Align SurveyJS coupon submission requirements and server-side validation with the Drizzle schema, and fix sidebar filter + keyword search mapping so it correctly filters coupons (including cuisine + coupon type).
todos:
  - id: survey-discount-rule
    content: Update SurveyJS coupon submission JSON to enforce required fields and conditional discount_value rules.
    status: pending
  - id: server-validate-submission
    content: Add server-side validation/normalization for submission_data in POST /coupon-submissions.
    status: pending
  - id: persist-cuisine
    content: Persist cuisineType when approving submissions and return cuisine_type in GET /coupons.
    status: pending
  - id: normalize-coupon-type
    content: Centralize and document coupon type mapping (DB percent|amount|bogo|free_item -> UI percentage|amount|bogo|free) in src/utils/helpers.js.
    status: pending
  - id: fix-sidebar-filters
    content: Align CouponBook filter model with SidebarFilters emission and implement keyword search including cuisine + coupon type.
    status: pending
  - id: fix-filter-tags
    content: Update CouponBook active filter tags to reflect keyword/activeOnly/couponType/cuisineType.
    status: pending
  - id: update-tests
    content: Update/add tests covering submission validation and coupons API response shape.
    status: pending
---

## What I found (current mismatches)

- **Sidebar filters don’t match CouponBook’s filter model**: `SidebarFilters.vue` emits `{ keyword, activeOnly, couponType, cuisineType }`, but `CouponBook.vue` expects `{ merchant, title, activeOnly, couponType, foodieGroup, locked, cuisineType }`, so most filters/tags are effectively broken.
- **Coupon type values are inconsistent across DB/API/UI**:
- DB enum is `['percent','amount','bogo','free_item']` (`drizzle/schema.ts`).
- UI filters currently use `percentage/bogo/free` (`SidebarFilters.vue`).
- Client normalizes API coupons via `ensureCouponsHaveCuisine()` which also normalizes `coupon_type` to `percentage/free/...` (`src/utils/helpers.js`).
- **Cuisine type is stored but not returned**: `coupon.cuisineType` exists in Drizzle, but `/api/v1/coupons` doesn’t select it (`server/src/routes/coupons.js`), so the UI relies on inference.
- **Submission → coupon mapping drops cuisine**: submission captures `cuisine_type`, but approval code never writes it to the `coupon` row (`server/src/routes/couponSubmissions.js`).
- **Discount + locked need schema-aware defaults**:
- `coupon.discountValue` is `notNull` (must always be a number).
- `coupon.locked` is `notNull default true`.
- Survey currently makes `discount_value` optional and `locked` is commented out; client coerces blank to `0`, but the server should enforce type-based requirements.

## Plan

### 1) Make coupon submission requirements match schema

- Update SurveyJS JSON in [`/home/cookieninja/viva-spot-coupon-book/src/data/couponSurvey.js`](./src/data/couponSurvey.js):
- Keep required: `group_id`, `merchant_id`, `title`, `description`, `coupon_type`, `valid_from`, `expires_at`.
- Add **conditional requirement** for `discount_value`:
- Required when `coupon_type` is `percent` or `amount`.
- Optional/hidden for `bogo` and `free_item` (default `0`).
- (Optional) add a boolean `locked` question if you want merchants to control it; otherwise remove it from the submission payload and rely on DB default.

### 2) Add server-side validation for submissions

- In [`/home/cookieninja/viva-spot-coupon-book/server/src/routes/couponSubmissions.js`](./server/src/routes/couponSubmissions.js) `POST /coupon-submissions`:
- Validate required fields exist inside `submission_data`.
- Validate `coupon_type` is one of `percent|amount|bogo|free_item`.
- Validate `valid_from`/`expires_at` parse as dates.
- Enforce `discount_value` rule (required for percent/amount; default to `0` otherwise).
- Normalize `locked` to `true` if omitted.

### 3) Persist and return cuisineType end-to-end

- In approval flow (`PUT /coupon-submissions/:id` in `server/src/routes/couponSubmissions.js`): include `cuisineType: submissionData.cuisine_type || null` when inserting into `coupon`.
- In coupons API (`GET /api/v1/coupons` in [`/home/cookieninja/viva-spot-coupon-book/server/src/routes/coupons.js`](./server/src/routes/coupons.js)):
- Add `cuisine_type: coupon.cuisineType` to the select.
- Decide and enforce one **canonical coupon type set** for the frontend: `percentage|amount|bogo|free`.
- DB will remain `percent|amount|bogo|free_item`.
- Document + centralize the mapping in one place: [`/home/cookieninja/viva-spot-coupon-book/src/utils/helpers.js`](./src/utils/helpers.js) (extend `COUPON_TYPE_ALIASES` and ensure both keyword search and display use the canonical values consistently).

### 4) Fix sidebar filter logic and implement keyword search across cuisine + coupon type

- Make `CouponBook.vue` use the filter shape emitted by `SidebarFilters.vue` (i.e., store `filters.keyword`, not `filters.merchant/title`).
- Update filtering in [`/home/cookieninja/viva-spot-coupon-book/src/views/CouponBook.vue`](./src/views/CouponBook.vue):
- Apply keyword search across: merchant name, title, description, foodie group name, **cuisine_type**, and **coupon_type** (normalized).
- Keep `activeOnly` as-is.
- Keep explicit dropdown filters for `couponType` and `cuisineType` working.
- Update **Active Filter Tags** in `CouponBook.vue` so they reflect the actual sidebar-emitted filters (`keyword`, `activeOnly`, `couponType`, `cuisineType`) instead of the legacy tag set (`merchant`, `title`, `foodieGroup`, `locked`).
- Make **Cuisine Type options data-driven** (no hardcoded list):
- Derive `availableCuisines` from the loaded `coupons` (after normalization) by collecting unique `coupon.cuisine_type` values.
- Pass `availableCuisines` into [`/home/cookieninja/viva-spot-coupon-book/src/components/Coupons/SidebarFilters.vue`](./src/components/Coupons/SidebarFilters.vue) as a prop and render dropdown/chips from it.
- Hide the Cuisine Type filter section entirely if `availableCuisines.length === 0`.
- Update coupon type options in [`/home/cookieninja/viva-spot-coupon-book/src/components/Coupons/SidebarFilters.vue`](./src/components/Coupons/SidebarFilters.vue):
- Ensure option values match the normalized UI values used elsewhere (e.g. `percentage|amount|bogo|free`).
- Add missing `amount` option.

### 5) Sanity-check tests

- Update/add automated tests around:
- Submission validation rules (`tests/unit/server/routes/couponSubmissions.test.js`): required fields, coupon_type enum validation, discount_value rule (required for percent/amount), defaulting (locked=true, discount_value=0 for bogo/free_item).
- Approval mapping (`tests/unit/server/routes/couponSubmissions.test.js`): approving a submission writes `coupon.cuisineType` from `submissionData.cuisine_type`.
- Coupon API shape (`tests/unit/server/routes/coupons.test.js`): `GET /api/v1/coupons` includes `cuisine_type` and uses the expected snake_case response fields.

- Manual smoke test (dev server) after changes:
- **Coupon submission**: submit each coupon type (percent/amount/bogo/free_item) and confirm required fields behave as expected; confirm percent/amount require a discount value; confirm submission saves.
- **Approval → coupon creation**: approve a submission and confirm the created coupon row has `cuisine_type` populated (and coupon_type/discount_value as expected).
- **Coupon Book sidebar**: keyword search matches merchant/title/description + cuisine + coupon type; couponType dropdown filters; cuisine dropdown only shows cuisines that exist in loaded coupons; active filter tags match the new filters and clear correctly.

## Key files to change

- Frontend:
- [`src/data/couponSurvey.js`](./src/data/couponSurvey.js)
- [`src/views/CouponBook.vue`](./src/views/CouponBook.vue)
- [`src/components/Coupons/SidebarFilters.vue`](./src/components/Coupons/SidebarFilters.vue)
- (Possibly) [`src/utils/helpers.js`](./src/utils/helpers.js) to ensure keyword assembly includes cuisine/type.
- Backend:
- [`server/src/routes/couponSubmissions.js`](./server/src/routes/couponSubmissions.js)
- [`server/src/routes/coupons.js`](./server/src/routes/coupons.js)
- Schema reference:
- [`drizzle/schema.ts`](./drizzle/schema.ts)

## Implementation todos

- **survey-discount-rule**: Add conditional requirement + defaults for `discount_value` in SurveyJS JSON.
- **server-validate-submission**: Enforce required fields + type/date validation in `POST /coupon-submissions`.
- **persist-cuisine**: Write `cuisineType` on approval; return `cuisine_type` in `GET /coupons`.
- **fix-sidebar-filters**: Align emitted filters with `CouponBook.vue` state; implement keyword search across cuisine + coupon type.
- **update-tests**: Adjust/add tests for validation + new API fields.