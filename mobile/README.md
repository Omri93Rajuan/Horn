# 📱 Horn Mobile - React Native App

אפליקציית Mobile לדיווח נוכחות וסטטוס עבור צוותים - תומכת iOS ו-Android.

---

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [תכונות](#תכונות)
- [טכנולוגיות](#טכנולוגיות)
- [דרישות מקדימות](#דרישות-מקדימות)
- [התקנה](#התקנה)
- [הגדרות](#הגדרות)
- [הרצה](#הרצה)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [Build לפרודקשן](#build-לפרודקשן)

---

## 🎯 סקירה כללית

אפליקציית Horn Mobile מאפשרת:
- **למפקדים**: הפעלת אירועי התרעה ומעקב אחר תגובות הצוות בזמן אמת
- **לחברי צוות**: קבלת התראות push, דיווח סטטוס (OK/HELP), והוספת הערות
- **לכולם**: צפייה בהיסטוריית אירועים, פרופיל אישי, וניהול התראות

---

## ✨ תכונות

### 🔐 Authentication
- הרשמה עם שם, אימייל, סיסמה, טלפון ו-Area ID
- התחברות עם JWT tokens
- Refresh token אוטומטי
- שמירת מצב התחברות

### 📊 Dashboard
- כפתור הפעלת אירוע (למפקדים)
- הצגת אירוע פעיל
- ניווט מהיר לכל המסכים
- עדכונים בזמן אמת

### 🚨 Alerts Screen
- רשימת כל האירועים
- לחיצה על אירוע מציגה סטטוס מפורט
- ספירת תגובות: OK, HELP, Pending
- רשימת כל המשתמשים ומצבם
- מספרי טלפון והערות

### ✅ Response Screen
- כפתורים גדולים: OK / HELP
- שדה הערות אופציונלי
- שליחת תגובה לאירוע הפעיל
- ולידציה על נתונים

### 👤 Profile Screen
- פרטי משתמש
- Area ID
- מספר טלפון
- כפתור התנתקות

---

## 🛠️ טכנולוגיות

- **React Native** 0.73.2
- **TypeScript** 5.3
- **Redux Toolkit** 2.0.1 - ניהול State
- **React Navigation** 6.x - ניווט
- **Axios** 1.6.5 - API calls
- **AsyncStorage** 1.21.0 - אחסון מקומי
- **React Native Vector Icons** 10.0.3 - אייקונים

---

## 📦 דרישות מקדימות

### כלים כלליים
- [Node.js](https://nodejs.org/) (גרסה 18 או יותר)
- [Git](https://git-scm.com/)
- [Watchman](https://facebook.github.io/watchman/) (Mac/Linux)

### לפיתוח Android
- [Android Studio](https://developer.android.com/studio)
- Android SDK (API 33 ומעלה)
- JDK 17
- Android Emulator או מכשיר פיזי

### לפיתוח iOS (Mac בלבד)
- [Xcode](https://developer.apple.com/xcode/) 14+
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator או iPhone פיזי

---

## 🚀 התקנה

### 1. התקנת תלויות

```bash
cd horn-mobile
npm install
```

### 2. התקנה ל-iOS (Mac בלבד)

```bash
cd ios
pod install
cd ..
```

---

## ⚙️ הגדרות

### חיבור ל-Server

ערוך את הקובץ: `src/services/api.ts`

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api'  // Android Emulator
  // ? 'http://localhost:3000/api'  // iOS Simulator
  // ? 'http://192.168.1.100:3000/api'  // Physical Device
  : 'https://your-production-api.com/api';
```

#### אפשרויות חיבור:

| סוג המכשיר | URL |
|-----------|-----|
| **Android Emulator** | `http://10.0.2.2:3000/api` |
| **iOS Simulator** | `http://localhost:3000/api` |
| **מכשיר פיזי** | `http://<YOUR_LOCAL_IP>:3000/api` |
| **Production** | `https://your-api.com/api` |

#### למצוא את ה-IP שלך:

```bash
# Windows
ipconfig
# חפש: IPv4 Address

# Mac/Linux
ifconfig
# או
ip addr show
```

---

## 🏃 הרצה

### Development Mode

#### התחלת Metro Bundler (Terminal 1)

```bash
npm start
```

#### הרצה על Android (Terminal 2)

```bash
npx react-native run-android
```

#### הרצה על iOS (Terminal 2, Mac בלבד)

```bash
npx react-native run-ios
```

### עצות מהירות

```bash
# ניקוי Cache
npm start -- --reset-cache

# הרצה על Emulator ספציפי
npx react-native run-android --deviceId=emulator-5554

# הרצה על מכשיר iOS ספציפי
npx react-native run-ios --device="iPhone 14 Pro"
```

---

## 📁 מבנה הפרויקט

```
horn-mobile/
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Root navigator
│   │   ├── AuthNavigator.tsx     # Login/Register
│   │   └── MainNavigator.tsx     # Tab navigation
│   ├── screens/
│   │   ├── LoginScreen.tsx       # מסך התחברות
│   │   ├── RegisterScreen.tsx    # מסך הרשמה
│   │   ├── DashboardScreen.tsx   # דף הבית + trigger
│   │   ├── AlertsScreen.tsx      # רשימת אירועים
│   │   ├── ResponsesScreen.tsx   # דיווח סטטוס
│   │   └── ProfileScreen.tsx     # פרופיל
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── authService.ts       # Login/Register
│   │   ├── alertService.ts      # Alerts API
│   │   ├── responseService.ts   # Responses API
│   │   └── dashboardService.ts  # Dashboard API
│   ├── store/
│   │   ├── index.ts             # Redux store
│   │   ├── authSlice.ts         # User state
│   │   └── dataSlice.ts         # Events & responses
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── utils/
│       ├── theme.ts             # Colors & styles
│       ├── validators.ts        # Input validation
│       ├── dateUtils.ts         # Date formatting
│       └── notificationService.ts # Push notifications
├── App.tsx                      # Root component
├── index.js                     # Entry point
├── package.json
├── tsconfig.json
├── app.json                     # React Native config
├── babel.config.js
└── metro.config.js
```

---

## 🎨 מסכים

### 1. Login Screen
- שדות: Email, Password
- כפתור התחברות
- קישור להרשמה

### 2. Register Screen
- שדות: Name, Email, Password, Phone, Area ID
- ולידציה על כל השדות
- כפתור הרשמה

### 3. Dashboard Screen
- כפתור "Trigger Event" (גדול ובולט)
- הצגת אירוע פעיל
- 3 כרטיסיות ניווט מהירות

### 4. Alerts Screen
- FlatList של כל האירועים
- לחיצה פותחת Modal עם:
  - ספירת OK/HELP/Pending
  - רשימת משתמשים ומצבם
  - מספרי טלפון
  - הערות

### 5. Response Screen
- בחירת סטטוס: OK או HELP
- שדה הערות (אופציונלי)
- כפתור שליחה
- הצגת האירוע הנוכחי

### 6. Profile Screen
- שם המשתמש
- אימייל
- טלפון
- Area ID
- כפתור Logout

---

## 🔧 Debugging

### React Native Debugger

```bash
# הורדה
# https://github.com/jhen0409/react-native-debugger

# פתיחה
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Flipper

Flipper מגיע מובנה עם React Native:
- Network Inspector
- Redux DevTools
- Layout Inspector
- Logs

### Console Logs

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

---

## 📦 Build לפרודקשן

### Android APK

```bash
cd android

# Debug APK
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Android AAB (Google Play)

```bash
cd android
./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS Archive (Mac בלבד)

1. פתח את `ios/HornMobile.xcworkspace` ב-Xcode
2. בחר: Product → Archive
3. לאחר Archive: Window → Organizer
4. בחר את ה-Archive → Distribute App
5. עקוב אחר ההוראות ל-App Store Connect

---

## 🐛 Troubleshooting

### Metro Bundler לא מתחיל

```bash
# ניקוי
npm start -- --reset-cache

# או
rm -rf node_modules
npm install
```

### Build fails על Android

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Build fails על iOS

```bash
cd ios
pod deintegrate
pod install
cd ..
npx react-native run-ios
```

### אפליקציה לא מתחברת ל-Server

1. ✅ וודא שה-Server רץ על `http://localhost:3000`
2. ✅ בדוק את `src/services/api.ts` - IP נכון?
3. ✅ אם מכשיר פיזי - וודא אותה רשת WiFi
4. ✅ Firewall חוסם את Port 3000?

```bash
# בדיקת חיבור
curl http://10.0.2.2:3000
# או
curl http://localhost:3000
```

### אייקונים לא מופיעים

```bash
# Android
cd android
./gradlew clean
cd ..

# iOS
cd ios
rm -rf build
pod install
cd ..
```

---

## 🔔 Push Notifications

### הגדרת Firebase

1. צור פרויקט ב-[Firebase Console](https://console.firebase.google.com/)
2. הוסף אפליקציית Android/iOS
3. הורד `google-services.json` (Android) ו-`GoogleService-Info.plist` (iOS)
4. העתק לתיקיות המתאימות:
   - Android: `android/app/google-services.json`
   - iOS: `ios/HornMobile/GoogleService-Info.plist`

### קוד לדוגמה

```typescript
// utils/notificationService.ts
import messaging from '@react-native-firebase/messaging';

// בקשת הרשאה
const requestPermission = async () => {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
};

// קבלת Token
const getDeviceToken = async () => {
  return await messaging().getToken();
};

// מאזין להודעות
messaging().onMessage(async (remoteMessage) => {
  console.log('Notification:', remoteMessage);
});
```

---

## 🌐 Deploy ל-Stores

### Google Play Store

1. צור [Google Play Developer Account](https://play.google.com/console)
2. צור אפליקציה חדשה
3. העלה AAB: `android/app/build/outputs/bundle/release/app-release.aab`
4. מלא פרטים (תיאור, screenshots, מדיניות פרטיות)
5. שלח לבדיקה

### Apple App Store

1. צור [Apple Developer Account](https://developer.apple.com/)
2. צור App ID ב-[App Store Connect](https://appstoreconnect.apple.com/)
3. Archive ב-Xcode (ראה למעלה)
4. העלה דרך Xcode Organizer
5. מלא פרטים ב-App Store Connect
6. שלח לבדיקה

---

## ✅ Checklist לפני Release

### קוד
- [ ] כל ה-Endpoints עובדים
- [ ] ולידציה על כל הטפסים
- [ ] Error handling מלא
- [ ] Loading states

### UI/UX
- [ ] כל המסכים נראים טוב
- [ ] תמיכה במסכים שונים
- [ ] אייקונים מופיעים
- [ ] צבעים עקביים

### הגדרות
- [ ] Production API URL
- [ ] Firebase מוגדר
- [ ] App icons
- [ ] Splash screen
- [ ] App name
- [ ] Bundle ID / Package name

### Testing
- [ ] בדיקה על Android
- [ ] בדיקה על iOS
- [ ] בדיקה על מכשיר פיזי
- [ ] Push notifications עובדות

### Legal
- [ ] מדיניות פרטיות
- [ ] תנאי שימוש
- [ ] הסכם משתמש

---

## 📞 תמיכה

### בעיות נפוצות
1. בדוק שה-Server רץ
2. וודא IP נכון ב-`api.ts`
3. נקה Cache: `npm start -- --reset-cache`
4. Clean build: `./gradlew clean`

### לוגים
```bash
# Metro
npm start

# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

---

## 🎉 מוכן לעבודה!

האפליקציה שלך מוכנה. כעת:
1. ✅ הרץ את הסרבר (תיקיית `horn-server`)
2. ✅ עדכן IP ב-`api.ts`
3. ✅ הרץ: `npm start` ו-`npx react-native run-android`
4. ✅ התחל לפתח!

---

**Built with ❤️ for Horn Team**
