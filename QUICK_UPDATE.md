# 🚀 Quick Start - עדכון מהיר

## אם השרת שלך כבר רץ - עשה את זה:

### 1️⃣ עדכן את מסד הנתונים (חובה!)
```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

או הרץ ידנית:
```sql
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completedByUserId" TEXT;
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completionReason" TEXT;
CREATE INDEX IF NOT EXISTS "AlertEvent_completedAt_idx" ON "AlertEvent"("completedAt");
ALTER DATABASE your_database_name REFRESH COLLATION VERSION;
```

### 2️⃣ צור קובץ .env (אם אין לך)
```bash
# בתיקיית server
cp .env.example .env
# ערוך את הקובץ עם הנתונים שלך
```

משתני סביבה חובה:
- `DATABASE_URL` - החיבור לDB
- `JWT_ACCESS_SECRET` - סיסמה חזקה
- `JWT_REFRESH_SECRET` - סיסמה חזקה אחרת
- `CORS_ORIGINS` - הדומיין שלך

### 3️⃣ התקן dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 4️⃣ בנה ופרוס

**עם Docker:**
```bash
docker compose down
docker compose up --build -d
```

**בלי Docker:**
```bash
# Server
cd server
npm run build
pm2 restart horn-server  # או כל מנהל תהליכים שיש לך

# Client
cd client
npm run build
# העתק dist/ לשרת web שלך
```

### 5️⃣ בדוק שהכל עובד
```bash
# בדוק health
curl http://localhost:3005/health

# אמור להחזיר: {"status":"ok","timestamp":"..."}
```

---

## 📝 מה חדש?
- ✅ עיצוב חדש מטורף לדשבורד
- ✅ כפתורים משופרים בכל המערכת
- ✅ אפשרות לסגור אירועים
- ✅ לוגים נקיים יותר
- ✅ אנימציות חלקות

---

## ⚠️ חשוב!
אם אתה ב-**production**, ודא ש:
```env
SEED_ON_STARTUP=false
TEST_MODE_ENABLED=false
NODE_ENV=production
```

---

**קראת את המדריך המלא?** → `DEPLOYMENT_GUIDE.md`
