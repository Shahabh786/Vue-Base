# BrokerDraft

Modern Vue 3 + Vite app with a Node/Express API and MySQL backend.

## Prerequisites

- Node.js 18+ (recommended)
- npm
- MySQL (running and reachable)

## Environment Setup

Create/update `.env` in the project root:

```env
DB_HOST=localhost
DB_NAME=app_database
DB_USER=root
DB_PASSWORD=password

# Optional (server auth token signing)
JWT_SECRET=change-this-in-production

# Optional (frontend API base URL)
VITE_API_BASE_URL=http://localhost:3001
```

Notes:
- `DB_*` values are required for DB/auth endpoints.
- If `JWT_SECRET` is not set, a development default is used.

## Install Dependencies

From the project root:

```bash
npm install
npm --prefix server install
```

## Start Frontend + Backend Together

From the project root:

```bash
npm run dev
# or
npm run dev:all
```

This starts:
- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:3001`

## Start Separately (Optional)

Frontend only:

```bash
npm run dev:client
```

Backend only:

```bash
npm run dev:server
```

## Build Frontend

```bash
npm run build
```

## Useful API Endpoints

- Health: `GET /api/health`
- DB ping: `GET /api/db/ping`
- Login: `POST /api/auth/login`
- First-time password change: `POST /api/auth/change-password`
- Current user: `GET /api/auth/me`

## Login Behavior

- Login validates `users.login_name` + password.
- If `users.password` is not null:
  - login succeeds only if it matches plain password
  - API requires password change flow
- Password change stores:
  - `password_hash` + `password_salt` (bcrypt)
  - clears `password` to `NULL`
- Subsequent logins validate against bcrypt hash/salt.

# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
