# 🚀 Horn Server - Backend API

מערכת Backend לאפליקציית Horn - מערכת דיווח נוכחות וסטטוס עבור צוותים.

---

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [טכנולוגיות](#טכנולוגיות)
- [התקנה](#התקנה)
- [הגדרות](#הגדרות)
- [הרצה](#הרצה)
- [API Endpoints](#api-endpoints)
- [מבנה מסד הנתונים](#מבנה-מסד-הנתונים)
- [בדיקות](#בדיקות)

---

## 🎯 סקירה כללית

Backend זה מספק API RESTful לאפליקציית Horn. המערכת מאפשרת:
- **למפקדים**: הפעלת אירועי התרעה ומעקב אחר תגובות הצוות בזמן אמת
- **לחברי צוות**: קבלת התראות push, דיווח סטטוס (OK/HELP), והוספת הערות
- **ניהול אזורים**: כל אירוע מופעל לאזור ספציפי (areaId)

---

## 🛠️ טכנולוגיות

- **Node.js** 18+ & **TypeScript** 5.3
- **Express** - Web framework
- **PostgreSQL** - מסד נתונים
- **Prisma ORM** - ניהול מסד נתונים
- **JWT** - אימות משתמשים
- **bcrypt** - הצפנת סיסמאות
- **Zod** - ולידציה
- **Jest** - בדיקות
- **Firebase Admin** - Push notifications

---

## 📦 התקנה

### 1. דרישות מקדימות

התקן את התוכנות הבאות:
- [Node.js](https://nodejs.org/) (גרסה 18 או יותר)
- [PostgreSQL](https://www.postgresql.org/) (גרסה 14 או יותר)
- [Git](https://git-scm.com/)

### 2. התקנת תלויות

```bash
cd horn-server
npm install
```

---

## ⚙️ הגדרות

### 1. יצירת קובץ .env

צור קובץ `.env` בתיקייה הראשית:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/horn_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-change-this-too"

# Server
PORT=3000
NODE_ENV=development

# Firebase (אופציונלי - להתראות Push)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

### 2. הגדרת PostgreSQL

צור מסד נתונים חדש:

```bash
# התחברות ל-PostgreSQL
psql -U postgres

# יצירת מסד נתונים
CREATE DATABASE horn_db;
\q
```

### 3. הרצת Migrations

```bash
# יצירת טבלאות במסד הנתונים
npx prisma migrate dev --name init

# יצירת Prisma Client
npx prisma generate
```

### 4. Seed (אופציונלי)

להכנסת נתוני דוגמה:

```bash
npx prisma db seed
```

---

## 🚀 הרצה

### Development Mode

```bash
npm run dev
```

השרת יעלה על: `http://localhost:3000`

### Production Mode

```bash
# בניית הפרויקט
npm run build

# הרצה
npm start
```

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "050-1234567",
  "areaId": "area-1"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "050-1234567",
    "areaId": "area-1"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

---

### 🚨 Alerts (`/api/alerts`)

#### Trigger Alert
```http
POST /api/alerts/trigger
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "areaId": "area-1"
}
```

**Response:**
```json
{
  "event": {
    "id": "event-id",
    "areaId": "area-1",
    "triggeredAt": "2026-01-18T10:30:00Z",
    "triggeredByUserId": "user-id"
  }
}
```

#### Get Alert History
```http
GET /api/alerts
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "events": [
    {
      "id": "event-id",
      "areaId": "area-1",
      "triggeredAt": "2026-01-18T10:30:00Z",
      "triggeredBy": {
        "id": "user-id",
        "name": "Commander Name"
      }
    }
  ]
}
```

---

### ✅ Responses (`/api/responses`)

#### Submit Response
```http
POST /api/responses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "eventId": "event-id",
  "status": "OK",
  "notes": "All good here"
}
```

**Status options:** `"OK"` או `"HELP"`

#### Get My Responses
```http
GET /api/responses/my
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "responses": [
    {
      "id": "response-id",
      "eventId": "event-id",
      "status": "OK",
      "notes": "All good",
      "respondedAt": "2026-01-18T10:31:00Z"
    }
  ]
}
```

---

### 📊 Dashboard (`/api/dashboard`)

#### Get Event Status
```http
GET /api/dashboard/event/:eventId
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "event": {
    "id": "event-id",
    "areaId": "area-1",
    "triggeredAt": "2026-01-18T10:30:00Z"
  },
  "stats": {
    "totalUsers": 10,
    "responded": 7,
    "okCount": 5,
    "helpCount": 2,
    "pendingCount": 3
  },
  "responses": [
    {
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "phone": "050-1234567"
      },
      "status": "OK",
      "notes": "Ready",
      "respondedAt": "2026-01-18T10:31:00Z"
    }
  ]
}
```

---

## 🗄️ מבנה מסד הנתונים

### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  phone         String?
  areaId        String
  deviceToken   String?
  createdAt     DateTime  @default(now())
}
```

### AlertEvent
```prisma
model AlertEvent {
  id                String    @id @default(uuid())
  areaId            String
  triggeredAt       DateTime  @default(now())
  triggeredByUserId String
}
```

### Response
```prisma
model Response {
  id          String         @id @default(uuid())
  userId      String
  eventId     String
  status      ResponseStatus
  notes       String?
  respondedAt DateTime       @default(now())
}

enum ResponseStatus {
  OK
  HELP
}
```

---

## 🧪 בדיקות

### הרצת כל הבדיקות

```bash
npm test
```

### הרצת בדיקה ספציפית

```bash
npm test -- auth.service.test
```

### בדיקות עם Coverage

```bash
npm run test:coverage
```

---

## 📁 מבנה תיקיות

```
horn-server/
├── prisma/
│   └── schema.prisma          # הגדרת מסד נתונים
├── src/
│   ├── controllers/           # Route handlers
│   ├── services/             # Business logic
│   ├── routes/               # API routes
│   ├── middlewares/          # Express middlewares
│   ├── validation/           # Zod schemas
│   ├── types/                # TypeScript types
│   ├── helpers/              # Utility functions
│   ├── db/                   # Database connections
│   └── index.ts              # Entry point
├── tests/                    # Unit & integration tests
├── package.json
├── tsconfig.json
└── .env
```

---

## 🔒 אבטחה

- **JWT Authentication**: כל ה-endpoints המוגנים דורשים Bearer token
- **Password Hashing**: bcrypt עם 10 rounds
- **Input Validation**: Zod schemas על כל הקלט
- **SQL Injection Protection**: Prisma ORM
- **Environment Variables**: נתונים רגישים ב-.env

---

## 🌐 Deploy

### Railway / Heroku / Render

1. צור פרויקט חדש
2. חבר את PostgreSQL database
3. הגדר Environment Variables
4. Deploy:

```bash
git push railway main
# או
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🐛 Troubleshooting

### שגיאת חיבור למסד נתונים

ודא ש-PostgreSQL רץ:
```bash
# Windows
services.msc  # חפש PostgreSQL

# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Prisma Migration שגויה

```bash
# אפס את ה-migrations
npx prisma migrate reset

# הרץ מחדש
npx prisma migrate dev
```

### Port כבר בשימוש

שנה את ה-PORT ב-.env או הרוג את התהליך:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## 📞 תמיכה

לשאלות או בעיות:
1. בדוק את הלוגים
2. ודא שכל ה-Environment Variables מוגדרים
3. הרץ `npm run test` לבדיקת תקינות

---

## 🎉 מוכן לעבודה!

השרת שלך מוכן. כעת:
1. ✅ הרץ את הסרבר: `npm run dev`
2. ✅ בדוק ב-browser: `http://localhost:3000`
3. ✅ התחל לפתח את האפליקציה!

---

**Built with ❤️ for Horn Team**
