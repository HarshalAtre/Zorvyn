# Finance Dashboard API

A RESTful backend for a finance dashboard with role-based access control, financial records management, and analytics. Built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Joi |
| Rate Limiting | express-rate-limit |
| Testing | Mocha + Chai + Supertest + mongodb-memory-server |

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Seed the admin user
```bash
npm run seed
```
> For an observable chart/graph in the dashboard, run this once before starting the app:
```bash
npm run seed:transactions
```

### 4. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

### 5. Run tests
```bash
npm test
```
> Tests use an **in-memory MongoDB** instance - no external database needed.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/finance_dashboard` |
| `JWT_SECRET` | Secret for signing JWTs | *(required)* |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `SEED_ADMIN_NAME` | Seed admin display name | `Admin` |
| `SEED_ADMIN_EMAIL` | Seed admin email | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | Seed admin password | `Admin@1234` |

---

## Roles & Permissions

| Endpoint group | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| `GET /api/dashboard/summary` | Yes | Yes | Yes |
| `GET /api/dashboard/recent` | Yes | Yes | Yes |
| `GET /api/dashboard/by-category` | No | Yes | Yes |
| `GET /api/dashboard/trends` | No | Yes | Yes |
| `GET /api/transactions` | No | Yes | Yes |
| `POST/PUT/DELETE /api/transactions` | No | No | Yes |
| `GET/PATCH /api/users*` | No | No | Yes |

## API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth

#### Register
```
POST /api/auth/register
```
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```
Response: `201` `{ user, token }` - Default role is `viewer`.

#### Login
```
POST /api/auth/login
```
```json
{ "email": "alice@example.com", "password": "secret123" }
```
Response: `200` `{ user, token }`

#### Current User
```
GET /api/auth/me
```
Response: `200` `{ user }`

---

### Users *(Admin only)*

#### List users
```
GET /api/users?page=1&limit=20
```

#### Get user
```
GET /api/users/:id
```

#### Update role
```
PATCH /api/users/:id/role
```
```json
{ "role": "analyst" }
```

#### Activate / Deactivate
```
PATCH /api/users/:id/status
```
```json
{ "isActive": false }
```

---

### Transactions

#### List with filters
```
GET /api/transactions?type=expense&category=food&startDate=2024-01-01&endDate=2024-12-31&search=rent&page=1&limit=20
```

| Query Param | Description |
|---|---|
| `type` | `income` or `expense` |
| `category` | Partial match (case-insensitive) |
| `startDate` | ISO date, inclusive |
| `endDate` | ISO date, inclusive |
| `search` | Searches notes and category |
| `page` | Page number (default: 1) |
| `limit` | Items per page (default: 20) |

Response:
```json
{
  "transactions": [...],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

#### Get one
```
GET /api/transactions/:id
```

#### Create *(Admin)*
```
POST /api/transactions
```
```json
{
  "amount": 3000,
  "type": "income",
  "category": "Salary",
  "date": "2024-03-01",
  "notes": "March salary"
}
```

#### Update *(Admin)*
```
PUT /api/transactions/:id
```
```json
{ "amount": 3500, "notes": "Revised salary" }
```
At least one field required.

#### Delete *(Admin - soft delete)*
```
DELETE /api/transactions/:id
```
Marks `isDeleted: true`. Record disappears from all listings but remains in DB.

---

### Dashboard

#### Summary *(Viewer+)*
```
GET /api/dashboard/summary
```
```json
{ "totalIncome": 10000, "totalExpenses": 4500, "netBalance": 5500 }
```

#### By Category *(Analyst+)*
```
GET /api/dashboard/by-category
```
```json
{
  "categories": [
    { "category": "Food", "type": "expense", "total": 700, "count": 3 }
  ]
}
```

#### Monthly Trends *(Analyst+)*
```
GET /api/dashboard/trends
```
Returns monthly income vs expense totals for the last 12 months.
```json
{
  "trends": [
    { "year": 2024, "month": 3, "type": "income", "total": 4000 },
    { "year": 2024, "month": 3, "type": "expense", "total": 1500 }
  ]
}
```

#### Recent Transactions *(Viewer+)*
```
GET /api/dashboard/recent?limit=10
```

---

## Project Structure

```
|-- src/
|   |-- config/db.js           # Mongoose connection
|   |-- middleware/
|   |   |-- auth.js            # JWT verification
|   |   `-- authorize.js       # Role guard (authorize / authorizeMin)
|   |-- models/
|   |   |-- User.js
|   |   `-- Transaction.js
|   |-- validators/            # Joi schemas
|   |-- services/              # Business logic & DB queries
|   |-- controllers/           # Request/response handling
|   |-- routes/                # Express routers
|   `-- seed.js                # Admin seed script
|-- test/
|   |-- helpers/setup.js       # In-memory MongoDB helpers
|   |-- auth.test.js
|   |-- transaction.test.js
|   `-- dashboard.test.js
|-- app.js                     # Express app (no listen)
|-- server.js                  # Entry point
`-- .env.example
```

---

## Assumptions & Tradeoffs

| Topic | Decision |
|---|---|
| Registration role | New users default to `viewer`; only admins can elevate roles |
| Initial admin | Created via `npm run seed` using env variables |
| Soft delete | Transactions use `isDeleted` flag; deleted records are invisible in all APIs but preserved in DB |
| User deactivation | Deactivated users (`isActive: false`) are rejected at login and token validation |
| Aggregations | Soft-deleted records are explicitly excluded in aggregation pipelines (Mongoose pre-find hook doesn't cover `aggregate()`) |
| Rate limiting | 100 requests per 15 minutes per IP on all `/api/*` routes |
| Test isolation | `mongodb-memory-server` spins up a fresh DB per test run - no external MongoDB needed |
