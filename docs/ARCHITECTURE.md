# Architecture

This document describes the high-level architecture of the Viva Spot Coupon Book application.

## Overview

The application is built with a modern stack optimized for developer productivity and Vercel deployment.

- **Frontend**: Vue.js (SPA)
- **Backend**: Express.js (Node.js) running as a Vercel Serverless Function
- **Database**: PostgreSQL (managed via Drizzle ORM)
- **Auth**: AWS Cognito (JWT verification server-side)

## Request Flow

1. **Frontend Request**: The Vue.js application makes a request to `/api/v1/*`.
2. **Vercel Rewrite**: `vercel.json` rewrites all `/api/:path*` requests to `api/[...slug].js`.
3. **Vercel Entrypoint**: `api/[...slug].js` imports the Express application from `server/src/app.js` and delegates the request to it.
4. **Express Routing**: The Express app mounts various routers (coupons, merchants, users, etc.) and handles the request.
5. **Auth Middleware**: Server-side JWT verification happens in `server/src/middleware/auth.js`.
6. **Database Access**: Routes use Drizzle ORM to interact with the PostgreSQL database.

## Key Components

### Backend (`server/src/`)

- `app.js`: The canonical Express app definition. Does not listen on a port; exported for use in Vercel and local dev.
- `db.js`: Database connection management and Drizzle initialization.
- `middleware/auth.js`: Cognito JWT verification and user resolution.
- `routes/`: Express routers for different entities.

### Deployment Entrypoints

- `api/[...slug].js`: The entrypoint used by Vercel in production.
- `server/src/dev.js`: Local development entrypoint that starts a listener on a port.

## API Design

- Base URL: `/api/v1`
- Format: JSON
- Authentication: Bearer token (JWT from Cognito)
- Error Handling: Consistent JSON error responses with appropriate HTTP status codes.
