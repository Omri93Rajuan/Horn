# 🎯 Horn System

Team Presence Reporting System - Server + Mobile App

---

## 📂 Project Structure

```
Horn/
├── server/              ← Backend API (Node.js + PostgreSQL)
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── README.md       📄 Full documentation
│
├── mobile/              ← Mobile App (React Native)
│   ├── src/
│   ├── android/
│   ├── ios/
│   └── README.md       📄 Full documentation
│
└── README.md           📘 (this file)
```

---

## 🚀 Quick Setup

### 1️⃣ Server (Backend)

```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

**Server runs on:** `http://localhost:3000`

📖 **Full Documentation:** [server/README.md](server/README.md)

---

### 2️⃣ Mobile (Client)

```bash
cd mobile
npm install

# iOS only (Mac)
cd ios && pod install && cd ..

# Start Metro
npm start
```

**In a separate terminal:**

```bash
# Android
npx react-native run-android

# iOS (Mac)
npx react-native run-ios
```

📖 **Full Documentation:** [mobile/README.md](mobile/README.md)

---

## 🔗 Connect Mobile to Server

Edit: `mobile/src/services/api.ts`

```typescript
const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:3000/api" // Android Emulator
  : // ? 'http://localhost:3000/api'  // iOS Simulator
    // ? 'http://192.168.X.XXX:3000/api'  // Physical Device
    "https://your-production-api.com/api";
```

---

## ✨ Features

### For Commanders 👨‍✈️

- 🚨 Trigger alert events
- 📊 Real-time response tracking
- 📞 Access to phone numbers
- 📝 View notes and history

### For Team Members 👤

- 🔔 Receive push notifications
- ✅ Report status: OK / HELP
- 💬 Add notes
- 📜 View history

---

## 🛠️ Tech Stack

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

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get user info

### Alerts

- `POST /api/alerts/trigger` - Trigger event
- `GET /api/alerts` - Event history

### Responses

- `POST /api/responses` - Submit response (OK/HELP)
- `GET /api/responses/my` - My responses

### Dashboard

- `GET /api/dashboard/event/:eventId` - Detailed event status

---

## 🏃 Running the System

### Option 1: Two terminals

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

## 🗄️ Database

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

### Mobile can't connect to Server

1. ✅ Ensure Server is running: `http://localhost:3000`
2. ✅ Check correct IP in `mobile/src/services/api.ts`
3. ✅ For physical device - same WiFi network
4. ✅ Firewall not blocking port 3000

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

## 🧪 Testing

### Server Tests

```bash
cd server
npm test
```

### Connection Test

```bash
# Check Server
curl http://localhost:3000

# Check API endpoint
curl http://localhost:3000/api/auth/me
```

---

## 🌐 Deploy

### Server

- **Platforms:** Railway, Heroku, Render, DigitalOcean
- **Requirements:** PostgreSQL database, Environment variables
- **Details:** See [server/README.md](server/README.md)

### Mobile

- **Android:** Google Play Store (.apk/.aab)
- **iOS:** Apple App Store (Archive via Xcode)
- **Details:** See [mobile/README.md](mobile/README.md)

---

## 📁 Important Files

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

## 🔒 Security

- ✅ JWT Authentication
- ✅ bcrypt Password Hashing
- ✅ Zod Input Validation
- ✅ Prisma ORM (SQL Injection Protection)
- ✅ Environment Variables

---

## 📖 Additional Documentation

- **Server:** [server/README.md](server/README.md) - Full API, Prisma, Deployment
- **Mobile:** [mobile/README.md](mobile/README.md) - Screens, Navigation, Build

---

## 🎉 Ready to Go!

The system is ready:

1. ✅ Run Server: `cd server && npm run dev`
2. ✅ Run Mobile: `cd mobile && npm start`
3. ✅ Run App: `cd mobile && npx react-native run-android`
4. ✅ Start developing!

---

## 📞 Support

- 📖 Server: [server/README.md](server/README.md)
- 📱 Mobile: [mobile/README.md](mobile/README.md)
- 🧪 Tests: `npm test` in each directory
- 📋 Logs: `npm run dev` (server) or `npx react-native log-android` (mobile)

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
# Check changes
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main
```

**Note:** `.gitignore` includes node_modules, build outputs, .env and more.

---

**Good Luck! 💪**
