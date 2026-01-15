# Horn Backend

Backend service for emergency roll-call alerts, user registration, push notifications, and response collection by area.

## Core Features
- User registration and login with JWT (access + refresh).
- Device registration (FCM device token) per user and area.
- Trigger emergency alerts and push to all users in an area.
- Collect user responses per event (OK / HELP).
- Event status dashboard with counts and user list.

## Tech Stack
- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- Firebase Admin SDK (FCM only)
- Zod validation
- JWT + bcryptjs
- Jest + Supertest

## Requirements
- Node.js 18+ recommended
- PostgreSQL database
- Firebase Service Account credentials (or Application Default Credentials)

## Install
```bash
npm install
```

## Environment Variables
Copy/fill `.env`:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/horn?schema=public
JWT_ACCESS_SECRET=replace_me_access_secret
JWT_REFRESH_SECRET=replace_me_refresh_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
# Use one of the following:
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# GOOGLE_APPLICATION_CREDENTIALS=C:\\path\\to\\service-account.json
```

Notes:
- `DATABASE_URL` must point to your PostgreSQL instance.
- `FIREBASE_SERVICE_ACCOUNT_JSON` allows setting the Service Account as inline JSON.
- Alternatively, use `GOOGLE_APPLICATION_CREDENTIALS` pointing to a local JSON file.
- The server will fail to start if JWT secrets are missing.

## Database Setup (PostgreSQL)
Create the database and run migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Seed Data (Faker)
On the first startup, if the database is empty, the app inserts fake data for all tables (users, refresh tokens, alert events, responses).
Default password for seeded users: `Passw0rd!`

## Run (Dev)
```bash
npm run dev
```

## Run (Production)
```bash
npm run build
npm start
```

## Tests
```bash
npm test
```

## Project Structure (Summary)
- `src/index.ts` Express bootstrap and route registration.
- `src/routes/` route definitions.
- `src/controllers/` HTTP layer.
- `src/services/` business logic and Postgres/FCM access.
- `src/validation/` Zod schemas.
- `src/db/prisma.ts` Prisma client.
- `src/db/firebase.ts` Firebase Admin initialization.
- `tests/` unit tests.

## Data Model (PostgreSQL)
- `users` table
  - `name`, `email`, `passwordHash`, `areaId`, `deviceToken`, `createdAt`
- `auth_refresh_tokens` table
  - `refreshTokenHash`, `updatedAt`
- `alert_events` table
  - `areaId`, `triggeredAt`, `triggeredByUserId`
- `responses` table
  - `userId`, `eventId`, `status`, `respondedAt`

## Inspecting Data
Connect with `psql`:
```bash
psql "postgresql://postgres:postgres@localhost:5432/horn?schema=public"
```
Then:
```sql
\dt
select * from users limit 5;
select * from alert_events limit 5;
```

## Auth (JWT)
Most routes require `Authorization: Bearer <accessToken>`.
Token TTLs are controlled by `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL`.

## Error Format
All errors return:
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "status": 400,
    "issues": []
  }
}
```
`issues` appears only for validation errors.

## API
Base URL: `/api`

### Auth
#### POST `/api/auth/register`
Create a new user.
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Omri",
  "areaId": "area-1"
}
```
Response:
```json
{
  "success": true,
  "user": {
    "id": "uid",
    "name": "Omri",
    "areaId": "area-1",
    "deviceToken": "",
    "createdAt": "2026-01-13T12:00:00.000Z"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```
Response is the same as `register`.

#### POST `/api/auth/refresh`
```json
{
  "refreshToken": "..."
}
```
Response:
```json
{
  "success": true,
  "accessToken": "..."
}
```

#### POST `/api/auth/logout`
Requires `Authorization`.
Request body must be `{}`.
Response:
```json
{
  "success": true,
  "loggedOut": true
}
```

#### GET `/api/auth/me`
Requires `Authorization`.
Response:
```json
{
  "success": true,
  "user": {
    "id": "uid",
    "name": "Omri",
    "areaId": "area-1",
    "deviceToken": "token",
    "createdAt": "..."
  }
}
```

### Users
#### POST `/api/users/register-device`
Requires `Authorization`.
```json
{
  "areaId": "area-1",
  "deviceToken": "fcm_device_token",
  "name": "Omri"
}
```
Response:
```json
{
  "success": true,
  "user": {
    "id": "uid",
    "name": "Omri",
    "areaId": "area-1",
    "deviceToken": "fcm_device_token",
    "createdAt": "..."
  }
}
```

### Alerts
#### POST `/api/alerts/trigger`
Requires `Authorization`.
```json
{
  "areaId": "area-1"
}
```
Response:
```json
{
  "success": true,
  "event": {
    "id": "eventId",
    "areaId": "area-1",
    "triggeredAt": "..."
  },
  "push": {
    "sent": 12,
    "failed": 0
  }
}
```

### Responses
#### POST `/api/responses`
Requires `Authorization`.
```json
{
  "eventId": "eventId",
  "status": "OK"
}
```
Allowed statuses: `OK`, `HELP`.

Response:
```json
{
  "success": true,
  "id": "responseId",
  "userId": "uid",
  "eventId": "eventId",
  "status": "OK",
  "respondedAt": "..."
}
```

### Dashboard
#### GET `/api/dashboard/events/:eventId`
Requires `Authorization`.
Response:
```json
{
  "success": true,
  "event": {
    "id": "eventId",
    "areaId": "area-1",
    "triggeredAt": "..."
  },
  "counts": {
    "ok": 10,
    "help": 2,
    "pending": 4
  },
  "list": [
    {
      "user": {
        "id": "uid",
        "name": "Omri",
        "areaId": "area-1",
        "deviceToken": "token",
        "createdAt": "..."
      },
      "responseStatus": "OK",
      "respondedAt": "..."
    }
  ]
}
```
`responseStatus` can be `OK`, `HELP`, or `PENDING`.

## Push Notifications (FCM)
The system sends a multicast message to all users with a `deviceToken` in the same `areaId`.
Message payload:
```json
{
  "data": {
    "type": "ALERT_EVENT",
    "eventId": "eventId",
    "areaId": "area-1"
  },
  "notification": {
    "title": "Emergency Roll-Call",
    "body": "Please confirm your status immediately."
  }
}
```

## Future Work
There is a placeholder for integrating external alert sources in `src/services/alert-source.service.ts`.
