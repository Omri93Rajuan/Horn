# 🚀 מדריך עדכון השרת - Horn

## 🔄 מה השתנה בבranch הזה?

### 1. **שדות חדשים ב-DB (Alert Completion)**
נוספו שדות חדשים לטבלת `AlertEvent`:
- `completedAt` - תאריך סגירת האירוע
- `completedByUserId` - מי סגר את האירוע
- `completionReason` - סיבת הסגירה

### 2. **שיפורי UI/UX מרכזיים**
- עיצוב חדש לדשבורד המפקדים
- כפתורי פילטר משופרים בכל המערכת
- אנימציות ואפקטים מקצועיים
- הודעות Toast מעוצבות
- מודלים משופרים

### 3. **תיקוני לוגים**
- Health check לא מזבל יותר את הלוגים
- תיקון אזהרות PostgreSQL collation
- Health checks פחות תכופים (30s במקום 5-10s)

---

## 📋 מה צריך לעדכן בשרת שלך?

### **שלב 1: משתני סביבה נדרשים**

צור קובץ `.env` בתיקיית `server/` עם:

```env
# Basic Config
NODE_ENV=production
PORT=3005
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public

# JWT Secrets (החלף בערכים אמיתיים!)
JWT_ACCESS_SECRET=your-very-long-secret-key-here-at-least-32-chars
JWT_REFRESH_SECRET=another-very-long-secret-key-here-different-from-access
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# CORS (הוסף את הדומיין שלך)
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Optional - Seed & Test Mode
SEED_ON_STARTUP=false
TEST_MODE_ENABLED=false
TEST_MODE_RESPONSE_DELAY_MS=900
DEMO_LOGIN_EMAIL=commander.north@horn.local

# Optional - Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=15
```

---

### **שלב 2: עדכון מסד הנתונים**

הרץ את המיגרציות:

```bash
cd server
npm install
npx prisma migrate deploy
npx prisma generate
```

או באופן ידני (אם יש בעיות):
```sql
-- הוסף את השדות החדשים
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completedByUserId" TEXT;
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completionReason" TEXT;

-- הוסף אינדקס לביצועים
CREATE INDEX IF NOT EXISTS "AlertEvent_completedAt_idx" ON "AlertEvent"("completedAt");

-- תיקון collation warning
ALTER DATABASE your_database_name REFRESH COLLATION VERSION;
```

---

### **שלב 3: התקנת Dependencies**

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

---

### **שלב 4: בניית הקוד**

**אופציה A - עם Docker:**
```bash
# בתיקיית הראשית
docker compose build
docker compose up -d
```

**אופציה B - ללא Docker:**

Server:
```bash
cd server
npm run build
npm start
```

Client:
```bash
cd client
npm run build
# העתק את התיקיה dist/ לשרת ה-web שלך (nginx/apache)
```

---

### **שלב 5: הגדרות Nginx (אם רלוונטי)**

```nginx
# Client - Static files
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/horn/client/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Server - API
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## ⚙️ הגדרות Client

עדכן את `client/.env` או `client/.env.production`:

```env
VITE_APP_ENV=production
VITE_API_URL=https://api.your-domain.com
VITE_TEST_MODE=false
```

---

## ✅ בדיקת התקנה

1. **בדוק שהשרת רץ:**
```bash
curl http://localhost:3005/health
# תקבל: {"status":"ok","timestamp":"..."}
```

2. **בדוק חיבור למסד נתונים:**
```bash
cd server
npx prisma db pull
# אמור לעבוד ללא שגיאות
```

3. **בדוק את החשבונות הדמו:**
```bash
# התחבר עם:
email: commander.north@horn.local
password: Horn12345!
```

---

## 🆕 פיצ'רים חדשים

### 1. **סגירת אירועים**
מפקדים יכולים עכשיו לסגור אירועים עם סיבה

### 2. **UI משופר**
- דשבורד מפקדים מחודש לחלוטין
- כפתורים מעוצבים עם גרדיאנטים
- אנימציות חלקות
- הודעות Toast מקצועיות

### 3. **ביצועים טובים יותר**
- לוגים נקיים יותר
- Health checks אופטימליים
- תיקוני PostgreSQL

---

## 🐛 Troubleshooting

### בעיה: "database does not exist"
```bash
cd server
npx prisma migrate dev --name init
```

### בעיה: "JWT secret is missing"
ודא שהגדרת `JWT_ACCESS_SECRET` ו-`JWT_REFRESH_SECRET` ב-.env

### בעיה: CORS errors
הוסף את הדומיין שלך ל-`CORS_ORIGINS` ב-.env

### בעיה: PostgreSQL collation warnings
```sql
ALTER DATABASE your_db_name REFRESH COLLATION VERSION;
```

---

## 📞 צריך עזרה?

1. בדוק את `server/README.md` למידע נוסף
2. הרץ `npm run dev` במצב פיתוח כדי לראות שגיאות מפורטות
3. בדוק לוגים: `docker compose logs -f server` (אם משתמש ב-Docker)

---

**Version:** February 2026  
**Compatibility:** Node.js 18+, PostgreSQL 14+
