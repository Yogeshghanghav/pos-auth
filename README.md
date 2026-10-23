# Commercial POS: Authentication and User Management

MERN module: secure login/logout, Admin and Staff roles, protected APIs and pages, and an admin
user management screen.

## Features
- Login and logout with an httpOnly, SameSite cookie holding a signed JWT (no tokens in localStorage)
- bcrypt password hashing (cost 12); passwords are never returned (`select: false` plus a `toJSON` transform)
- Role-based access control enforced on the server (`authenticate`, `authorize('admin')`)
- Deactivated users are blocked immediately, even with a valid token
- Admin user management: list, search, paginate, create, edit, activate and deactivate
- Zod validation with field-level error messages, login rate limiting, helmet, CORS with a fixed origin
- Loading states, skeletons, toasts and error banners in the UI

## Prerequisites
Node 18+ and MongoDB (local or Atlas).

## Setup
```bash
# API
cd server
npm install
cp .env.example .env       # set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed:admin         # creates the first admin from .env
npm run dev                # http://localhost:5000

# Client (new terminal)
cd client
npm install
npm run dev                # http://localhost:5173 (Vite proxies /api to :5000)
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Tests
```bash
cd server && npm test
```
Uses Jest, Supertest and `mongodb-memory-server` (downloads a MongoDB binary on first run).
Behind a firewall, point to a local binary: `MONGOMS_SYSTEM_BINARY=/path/to/mongod npm test`.

## Roles
| Capability | Admin | Staff |
|---|---|---|
| Login, logout, own session | Yes | Yes |
| Products and sales APIs, dashboard, POS | Yes | Yes |
| Reports API | Yes | No |
| User management (`/api/users`, `/users` page) | Yes | No |

## Integrating into an existing project
1. Copy `models/User.js`, `middleware/`, `controllers/`, `routes/authRoutes.js`, `routes/userRoutes.js`.
2. In `app.js`: add `cookie-parser`, `helmet`, `cors({ origin, credentials: true })`, mount `/api/auth` and
   `/api/users`, and wrap existing routers with `authenticate` (and `authorize('admin')` where needed).
   `routes/posRoutes.js` is a placeholder; delete it and use your real routers.
3. Existing `users` collection? Run `npm run migrate:users` (adds `role`, `isActive`, hashes plain-text passwords).
   Back up first.
4. Client: copy `api.js`, `AuthContext.jsx`, `ProtectedRoute.jsx`, `pages/Login.jsx`, `pages/UserManagement.jsx`,
   `components/`, and wire the routes as in `App.jsx`.

## Deploying on different domains
If client and API are on different domains, set `COOKIE_SAMESITE=none` on the server (it requires HTTPS, which
production already uses for the `Secure` flag), set `CLIENT_URL` to the client origin, and `VITE_API_URL` on the client.

## Security notes
- Secrets live only in `.env` (git-ignored). Only `.env.example` is committed.
- Login returns the same error for unknown email and wrong password.
- The error handler logs method, path and message only; never bodies, cookies or tokens.
- Run `npm audit` before releasing. Consider adding CSRF tokens if you ever use `SameSite=none`.

API reference: [docs/API.md](docs/API.md)
