# Finance Dashboard API

A simple backend for a finance dashboard with role-based access control, transaction management, and analytics endpoints.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Joi validation
- Mocha + Chai + Supertest + mongodb-memory-server

## Design Summary

- Route layer handles URL mapping and middleware composition.
- Controller layer handles request/response validation flow.
- Service layer handles business logic and DB operations.
- Model layer defines data schema and persistence behavior.
- Middleware handles authentication, authorization, and ObjectId validation.

## Roles and Access

- `viewer`: dashboard summary + recent activity only
- `analyst`: viewer access + transaction read + advanced analytics
- `admin`: full access (transactions + users)

| Endpoint group | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| `GET /api/dashboard/summary` | Yes | Yes | Yes |
| `GET /api/dashboard/recent` | Yes | Yes | Yes |
| `GET /api/dashboard/by-category` | No | Yes | Yes |
| `GET /api/dashboard/trends` | No | Yes | Yes |
| `GET /api/transactions` | No | Yes | Yes |
| `POST/PUT/DELETE /api/transactions` | No | No | Yes |
| `GET/PATCH /api/users*` | No | No | Yes |

## API Response Format

All success responses:

```json
{
  "success": true,
  "data": { "...": "..." }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure env

```bash
cp .env.example .env
```

Required values:

- `MONGO_URI`
- `JWT_SECRET`

Optional values:

- `PORT` (default `5000`)
- `FRONTEND_ORIGIN` (default `http://localhost:3000`)
- `JWT_EXPIRES_IN` (default `7d`)
- `JWT_COOKIE_DAYS` (default `7`)
- `RATE_LIMIT_MAX` (default `100` requests / 15 minutes)
- `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`

3. Seed admin user

```bash
npm run seed
```

4. Run server

```bash
npm run dev
# or
npm start
```

5. Run tests

```bash
npm test
```

6. Import API collection (optional, for evaluator convenience)

- File: `Finance-Dashboard-API.postman_collection.json`
- Import into Postman and set:
  - `baseUrl` (default `http://localhost:5000`)
  - `token` (auto-filled after login request)
  - `transactionId`, `userId` for ID-based requests

## Deploy (Render + Vercel)

### Backend on Render

This repo includes `render.yaml` for a one-click style setup.

1. Push this project to GitHub.
2. In Render, create a new Web Service from that repo.
3. Render will use:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set backend environment variables in Render:
   - `NODE_ENV=production`
   - `MONGO_URI=<your_atlas_uri>`
   - `JWT_SECRET=<strong_secret>`
   - `JWT_EXPIRES_IN=7d`
   - `JWT_COOKIE_DAYS=7`
   - `FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app`
5. Deploy and copy your backend URL, for example:
   - `https://finance-dashboard-api.onrender.com`

### Frontend on Vercel

1. Import the same GitHub repo into Vercel.
2. Set **Root Directory** to `Frontend`.
3. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable in Vercel:
   - `VITE_API_URL=https://<your-render-backend>.onrender.com/api`
5. Deploy.

Notes:
- `Frontend/vercel.json` is included for SPA routing fallback.
- Frontend sends cookies cross-origin (`withCredentials: true`), so `FRONTEND_ORIGIN` must exactly match your Vercel URL.

## Main Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users (admin only)

- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/status`

### Transactions

- `GET /api/transactions` (analyst+)
- `GET /api/transactions/:id` (analyst+)
- `POST /api/transactions` (admin)
- `PUT /api/transactions/:id` (admin)
- `DELETE /api/transactions/:id` (admin, soft delete)

Filtering supported on list endpoint:

- `type`, `category`, `startDate`, `endDate`, `search`, `page`, `limit`

### Dashboard

- `GET /api/dashboard/summary` (viewer+)
- `GET /api/dashboard/recent` (viewer+)
- `GET /api/dashboard/by-category` (analyst+)
- `GET /api/dashboard/trends` (analyst+)

## Validation and Reliability Notes

- Joi validates request body for auth, transactions, and user updates.
- Query validation handles invalid `page`, `limit`, `type`, and invalid date ranges.
- Invalid `:id` route parameters return HTTP 400 early via middleware.
- Deactivated users cannot authenticate or access protected APIs.
- Soft-deleted transactions are excluded from all reads and aggregations.
- Rate limiting is enabled on `/api/*`.

## Design Decisions

- Keep architecture simple and explicit:
  - `routes` for access policy and endpoint mapping
  - `controllers` for HTTP concerns and validation
  - `services` for business logic and persistence operations
- Use role hierarchy in middleware instead of duplicating checks in each handler.
- Return a single response contract (`success`, `data`, `message`) to keep frontend integration predictable.
- Prefer soft delete for transactions to preserve auditability while keeping reads clean.
- Add self-protection guardrails for admins to prevent accidental lockout.
- Use HttpOnly cookie-based auth for browser sessions, with bearer token fallback for API tools/tests.

## Assessment Extras

- Added integration tests for:
  - invalid query params
  - invalid ObjectId path params
  - rate limit behavior on `/api/*`

## Assumptions and Tradeoffs

- New user registration always creates `viewer` role.
- Role elevation/deactivation is admin-only.
- Admin self-protection rules:
  - Cannot demote self from `admin`
  - Cannot deactivate self
- Transactions are shared system records (not user-private ledger entries).
- Cookie settings use `SameSite=Lax` in development and `SameSite=None; Secure` in production.
- This is an assessment-focused backend: clear and reliable over over-engineering.
