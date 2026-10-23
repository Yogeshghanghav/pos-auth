# API documentation

Base path: `/api`. Auth uses an **httpOnly cookie** named `token` (8h). Clients must send credentials
(`withCredentials: true`). Errors always look like `{ "message": "..." }`; validation errors add
`"errors": [{ "field": "email", "message": "Enter a valid email" }]`.

| Method | Endpoint | Access | Body | Responses |
|---|---|---|---|---|
| POST | `/auth/login` | Public, rate limited (10 / 15 min) | `email, password` | 200, 400, 401, 403, 429 |
| POST | `/auth/logout` | Logged in | none | 200, 401 |
| GET | `/auth/me` | Logged in | none | 200, 401 |
| GET | `/users?search=&page=&limit=` | Admin | none | 200, 401, 403 |
| POST | `/users` | Admin | `name, email, password, role?` | 201, 400, 401, 403, 409 |
| PUT | `/users/:id` | Admin | `name?, email?, role?, password?` | 200, 400, 401, 403, 404, 409 |
| PATCH | `/users/:id/status` | Admin | `isActive` (boolean) | 200, 400, 401, 403, 404 |
| GET | `/products`, `/sales` | Admin, Staff | none | 200, 401 |
| GET | `/reports` | Admin | none | 200, 401, 403 |

Password rule: at least 8 characters, one uppercase letter, one number.

## POST /auth/login
Request
```json
{ "email": "admin@example.com", "password": "Admin1234" }
```
200 (also sets `Set-Cookie: token=...; HttpOnly; SameSite=Strict`)
```json
{ "user": { "_id": "665f...", "name": "Admin", "email": "admin@example.com", "role": "admin", "isActive": true, "lastLoginAt": "2026-10-23T10:00:00.000Z" } }
```
401 `{ "message": "Invalid email or password" }` (same for unknown email and wrong password)
403 `{ "message": "Your account has been deactivated. Contact an admin." }`
400 `{ "message": "Validation failed", "errors": [{ "field": "email", "message": "Enter a valid email" }] }`

## POST /auth/logout
200 `{ "message": "Logged out" }` and the cookie is cleared.

## GET /auth/me
200 `{ "user": { ... } }`. 401 if the cookie is missing, invalid, expired, or the account is inactive.

## GET /users
`GET /users?search=jane&page=1&limit=10`
```json
{ "users": [ { "_id": "...", "name": "Jane", "email": "jane@example.com", "role": "staff", "isActive": true } ], "total": 1, "page": 1, "limit": 10 }
```

## POST /users
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Welcome123", "role": "staff" }
```
201 `{ "user": { ... } }` · 409 `{ "message": "Email already in use" }`

## PUT /users/:id
Any subset of `name, email, role, password`. Unknown fields are rejected with 400.
200 `{ "user": { ... } }`. An admin cannot demote their own role (400).

## PATCH /users/:id/status
```json
{ "isActive": false }
```
200 `{ "user": { ... } }`. An admin cannot deactivate their own account (400).
Deactivation takes effect immediately: the server re-checks the user on every request.
