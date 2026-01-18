# 🎯 Horn System

מערכת דיווח נוכחות וסטטוס לצוותים - Server + Mobile App

---

## 📂 מבנה הפרויקט

```
Horn/
├── server/              ← Backend API (Node.js + PostgreSQL)
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── README.md       📄 תיעוד מלא
│
├── mobile/              ← Mobile App (React Native)
│   ├── src/
│   ├── android/
│   ├── ios/
│   └── README.md       📄 תיעוד מלא
│
└── README.md           📘 (הקובץ הזה)
```

---

## 🚀 התקנה מהירה

### 1️⃣ Server (Backend)

```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

**Server רץ על:** `http://localhost:3000`

📖 **תיעוד מלא:** [server/README.md](server/README.md)

---

### 2️⃣ Mobile (Client)

```bash
cd mobile
npm install

# iOS בלבד (Mac)
cd ios && pod install && cd ..

# הרצת Metro
npm start
```

**בטרמינל נפרד:**

```bash
# Android
npx react-native run-android

# iOS (Mac)
npx react-native run-ios
```

📖 **תיעוד מלא:** [mobile/README.md](mobile/README.md)

---

## 🔗 חיבור Mobile ל-Server

ערוך: `mobile/src/services/api.ts`

```typescript
const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:3000/api" // Android Emulator
  : // ? 'http://localhost:3000/api'  // iOS Simulator
    // ? 'http://192.168.X.XXX:3000/api'  // Physical Device
    "https://your-production-api.com/api";
```

---

## ✨ תכונות

### למפקדים 👨‍✈️

- 🚨 הפעלת אירועי התרעה
- 📊 מעקב בזמן אמת אחר תגובות
- 📞 גישה למספרי טלפון
- 📝 צפייה בהערות והיסטוריה

### לחברי צוות 👤

- 🔔 קבלת התראות Push
- ✅ דיווח סטטוס: OK / HELP
- 💬 הוספת הערות
- 📜 צפייה בהיסטוריה

---

## 🛠️ טכנולוגיות

### Server

- Node.js 18+ & TypeScript 5.3
- Express + PostgreSQL + Prisma ORM
- JWT Authentication
- Jest Testing

### Mobile

- React Native 0.73.2
- TypeScript 5.3
- Redux Toolkit
- React Navigation

---

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - הרשמה
- `POST /api/auth/login` - התחברות
- `GET /api/auth/me` - פרטי משתמש

### Alerts

- `POST /api/alerts/trigger` - הפעלת אירוע
- `GET /api/alerts` - היסטוריית אירועים

### Responses

- `POST /api/responses` - שליחת תגובה (OK/HELP)
- `GET /api/responses/my` - התגובות שלי

### Dashboard

- `GET /api/dashboard/event/:eventId` - סטטוס אירוע מפורט

---

## 🏃 העלאת המערכת

### אופציה 1: שני טרמינלים

**Terminal 1 - Server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Mobile:**

```bash
cd mobile
npm start
```

**Terminal 3 - Run App:**

```bash
cd mobile
npx react-native run-android
```

---

## 🗄️ מסד נתונים

### Models

**User**

```
id, email, passwordHash, name, phone, areaId, deviceToken
```

**AlertEvent**

```
id, areaId, triggeredAt, triggeredByUserId
```

**Response**

```
id, userId, eventId, status (OK/HELP), notes, respondedAt
```

---

## 🐛 Troubleshooting

### Mobile לא מתחבר ל-Server

1. ✅ וודא ש-Server רץ: `http://localhost:3000`
2. ✅ בדוק IP נכון ב-`mobile/src/services/api.ts`
3. ✅ לפיזי device - אותה רשת WiFi
4. ✅ Firewall לא חוסם port 3000

### Database Errors

```bash
cd server
npx prisma migrate reset
npx prisma migrate dev
```

### Metro Bundler Issues

```bash
cd mobile
npm start -- --reset-cache
```

### Android Build Fails

```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native run-android
```

---

## 🧪 בדיקות

### Server Tests

```bash
cd server
npm test
```

### בדיקת חיבור

```bash
# בדוק Server
curl http://localhost:3000

# בדוק API endpoint
curl http://localhost:3000/api/auth/me
```

---

## 🌐 Deploy

### Server

- **Platforms:** Railway, Heroku, Render, DigitalOcean
- **Requirements:** PostgreSQL database, Environment variables
- **Details:** ראה [server/README.md](server/README.md)

### Mobile

- **Android:** Google Play Store (.apk/.aab)
- **iOS:** Apple App Store (Archive via Xcode)
- **Details:** ראה [mobile/README.md](mobile/README.md)

---

## 📁 קבצים חשובים

### Environment Variables (Server)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/horn_db"
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
```

### API Configuration (Mobile)

```typescript
// mobile/src/services/api.ts
const API_BASE_URL = "http://10.0.2.2:3000/api";
```

---

## 🔒 אבטחה

- ✅ JWT Authentication
- ✅ bcrypt Password Hashing
- ✅ Zod Input Validation
- ✅ Prisma ORM (SQL Injection Protection)
- ✅ Environment Variables

---

## 📖 תיעוד נוסף

- **Server:** [server/README.md](server/README.md) - API מלא, Prisma, Deployment
- **Mobile:** [mobile/README.md](mobile/README.md) - Screens, Navigation, Build

---

## 🎉 הכל מוכן!

המערכת מוכנה לעבודה:

1. ✅ הרץ Server: `cd server && npm run dev`
2. ✅ הרץ Mobile: `cd mobile && npm start`
3. ✅ הרץ App: `cd mobile && npx react-native run-android`
4. ✅ התחל לפתח!

---

## 📞 תמיכה

- 📖 Server: [server/README.md](server/README.md)
- 📱 Mobile: [mobile/README.md](mobile/README.md)
- 🧪 Tests: `npm test` בכל תיקייה
- 📋 Logs: `npm run dev` (server) או `npx react-native log-android` (mobile)

---

**Built with ❤️ for Horn Team**

---

## ⚡ Quick Reference

| Task               | Command                                     |
| ------------------ | ------------------------------------------- |
| **Start Server**   | `cd server && npm run dev`                  |
| **Start Mobile**   | `cd mobile && npm start`                    |
| **Run Android**    | `cd mobile && npx react-native run-android` |
| **Run iOS**        | `cd mobile && npx react-native run-ios`     |
| **Tests (Server)** | `cd server && npm test`                     |
| **DB Migration**   | `cd server && npx prisma migrate dev`       |
| **DB Studio**      | `cd server && npx prisma studio`            |
| **Clean Cache**    | `cd mobile && npm start -- --reset-cache`   |
| **Clean Build**    | `cd mobile/android && ./gradlew clean`      |

---

## 🎯 Git Workflow

```bash
# בדיקת שינויים
git status

# הוספת קבצים
git add .

# Commit
git commit -m "הודעה"

# Push
git push origin main
```

**שים ❤️:** `.gitignore` כולל node_modules, build outputs, .env ועוד.

---

**Good Luck! 💪**
