import React from "react";

export type Locale = "he" | "en";

const LOCALE_STORAGE_KEY = "horn-locale";

type Dict = Record<string, string>;

const he: Dict = {
  "app.title": "הורן - מרכז שליטה",
  "nav.command_center": "מרכז פיקוד",
  "nav.alerts_history": "היסטוריית התראות",
  "nav.team": "הצוות",
  "nav.my_dashboard": "הדשבורד שלי",
  "nav.my_responses": "התגובות שלי",
  "nav.profile": "פרופיל",
  "theme.light": "מצב בהיר",
  "theme.dark": "מצב כהה",
  "lang.he": "עברית",
  "lang.en": "English",
  "status.ALL": "הכול",
  "status.OK": "תקין",
  "status.HELP": "סיוע",
  "status.PENDING": "ממתין",
  "toast.error": "שגיאה",
  "toast.success": "הצלחה",
  "toast.info": "עדכון",
  "toast.warning": "שים לב",
  "auth.login.title": "כניסה למערכת",
  "auth.login.subtitle": "התחבר כדי להמשיך למרכז השליטה.",
  "auth.login.email": "אימייל",
  "auth.login.password": "סיסמה",
  "auth.login.submit": "כניסה",
  "auth.login.submitting": "מתחבר...",
  "auth.login.no_account": "אין לך חשבון?",
  "auth.login.register_now": "הירשם עכשיו",
  "auth.register.title": "יצירת חשבון חדש",
  "auth.register.subtitle": "מלא את הפרטים ונחבר אותך מיד למרכז השליטה.",
  "auth.register.name": "שם מלא",
  "auth.register.email": "אימייל",
  "auth.register.password": "סיסמה",
  "auth.register.phone": "טלפון (אופציונלי)",
  "auth.register.area": "אזור שירות",
  "auth.register.select_area": "בחר אזור",
  "auth.register.submit": "הירשם",
  "auth.register.submitting": "יוצר חשבון...",
  "auth.register.have_account": "כבר יש לך חשבון?",
  "auth.register.login": "התחבר",
  "profile.title": "פרופיל",
  "profile.subtitle": "ניהול פרטים, התראות ויציאה מהמערכת.",
  "profile.user_details": "פרטי משתמש",
  "profile.name": "שם",
  "profile.email": "אימייל",
  "profile.phone": "טלפון",
  "profile.area": "אזור",
  "profile.not_available": "לא זמין",
  "profile.not_set": "לא הוגדר",
  "profile.notifications": "התראות",
  "profile.notifications_hint": "אפשר התראות כדי לקבל עדכון מיידי בזמן אירוע.",
  "profile.notifications_enabled": "התראות פעילות",
  "profile.notifications_enable": "אפשר התראות",
  "profile.notifications_test": "שלח התראת בדיקה",
  "profile.actions": "פעולות",
  "profile.logout": "התנתק",
  "profile.logging_out": "מתנתק...",
  "error.enable_notifications": "לא ניתן לאפשר התראות בדפדפן זה.",
  "error.login": "אירעה שגיאה בהתחברות",
  "error.register": "אירעה שגיאה בהרשמה",
  "error.required_fields": "נא למלא את כל השדות",
  "error.required_fields_register": "נא למלא את כל השדות החובה",
  "error.invalid_email": "נא להזין אימייל תקין",
  "error.invalid_name": "נא להזין שם מלא",
  "error.invalid_password": "הסיסמה אינה תקינה",
  "auth.expired": "תוקף ההתחברות פג. התחבר מחדש.",
};

const en: Dict = {
  "app.title": "Horn - Control Center",
  "nav.command_center": "Command Center",
  "nav.alerts_history": "Alerts History",
  "nav.team": "Team",
  "nav.my_dashboard": "My Dashboard",
  "nav.my_responses": "My Responses",
  "nav.profile": "Profile",
  "theme.light": "Light mode",
  "theme.dark": "Dark mode",
  "lang.he": "Hebrew",
  "lang.en": "English",
  "status.ALL": "All",
  "status.OK": "OK",
  "status.HELP": "Help",
  "status.PENDING": "Pending",
  "toast.error": "Error",
  "toast.success": "Success",
  "toast.info": "Info",
  "toast.warning": "Warning",
  "auth.login.title": "Sign In",
  "auth.login.subtitle": "Sign in to continue to the control center.",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.submit": "Sign In",
  "auth.login.submitting": "Signing in...",
  "auth.login.no_account": "Don't have an account?",
  "auth.login.register_now": "Register now",
  "auth.register.title": "Create New Account",
  "auth.register.subtitle": "Fill in your details and connect instantly to control center.",
  "auth.register.name": "Full name",
  "auth.register.email": "Email",
  "auth.register.password": "Password",
  "auth.register.phone": "Phone (optional)",
  "auth.register.area": "Service area",
  "auth.register.select_area": "Select area",
  "auth.register.submit": "Register",
  "auth.register.submitting": "Creating account...",
  "auth.register.have_account": "Already have an account?",
  "auth.register.login": "Login",
  "profile.title": "Profile",
  "profile.subtitle": "Manage details, notifications and logout.",
  "profile.user_details": "User Details",
  "profile.name": "Name",
  "profile.email": "Email",
  "profile.phone": "Phone",
  "profile.area": "Area",
  "profile.not_available": "Not available",
  "profile.not_set": "Not set",
  "profile.notifications": "Notifications",
  "profile.notifications_hint": "Enable notifications to receive immediate event updates.",
  "profile.notifications_enabled": "Notifications enabled",
  "profile.notifications_enable": "Enable notifications",
  "profile.notifications_test": "Send test notification",
  "profile.actions": "Actions",
  "profile.logout": "Logout",
  "profile.logging_out": "Logging out...",
  "error.enable_notifications": "Cannot enable notifications in this browser.",
  "error.login": "Login failed",
  "error.register": "Registration failed",
  "error.required_fields": "Please fill all fields",
  "error.required_fields_register": "Please fill all required fields",
  "error.invalid_email": "Please enter a valid email",
  "error.invalid_name": "Please enter full name",
  "error.invalid_password": "Password is invalid",
  "auth.expired": "Session expired. Please login again.",
};

const resources: Record<Locale, Dict> = { he, en };

const sourceEn: Dict = {
  "הורן - מרכז שליטה": "Horn - Control Center",
  "מרכז פיקוד": "Command Center",
  "היסטוריית התראות": "Alerts History",
  "הצוות": "Team",
  "הדשבורד שלי": "My Dashboard",
  "התגובות שלי": "My Responses",
  "פרופיל": "Profile",
  "מצב בהיר": "Light mode",
  "מצב כהה": "Dark mode",
  "כניסה למערכת": "Sign In",
  "התחבר כדי להמשיך למרכז השליטה.": "Sign in to continue to the control center.",
  "יצירת חשבון חדש": "Create New Account",
  "מלא את הפרטים ונחבר אותך מיד למרכז השליטה.": "Fill details to connect immediately.",
  "אימייל": "Email",
  "סיסמה": "Password",
  "שם מלא": "Full name",
  "טלפון (אופציונלי)": "Phone (optional)",
  "אזור שירות": "Service area",
  "בחר אזור": "Select area",
  "כניסה": "Sign In",
  "מתחבר...": "Signing in...",
  "הירשם": "Register",
  "יוצר חשבון...": "Creating account...",
  "כבר יש לך חשבון?": "Already have an account?",
  "התחבר": "Login",
  "אין לך חשבון?": "Don't have an account?",
  "הירשם עכשיו": "Register now",
  "התראות": "Notifications",
  "פעולות": "Actions",
  "התנתק": "Logout",
  "מתנתק...": "Logging out...",
  "פרטי משתמש": "User Details",
  "שם": "Name",
  "טלפון": "Phone",
  "אזור": "Area",
  "לא זמין": "Not available",
  "לא הוגדר": "Not set",
  "שלח התראת בדיקה": "Send test notification",
  "תקין": "OK",
  "סיוע": "Help",
  "ממתין": "Pending",
  "הכול": "All",
};

function getStoredLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" ? "en" : "he";
}

function rawTranslate(locale: Locale, key: string) {
  return resources[locale][key] ?? resources.he[key] ?? key;
}

function translateSource(locale: Locale, value: string) {
  if (locale === "he") return value;
  return sourceEn[value] ?? value;
}

function translateNode(node: React.ReactNode, locale: Locale): React.ReactNode {
  if (typeof node === "string") {
    return translateSource(locale, node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => translateNode(child, locale));
  }

  if (!React.isValidElement(node)) {
    return node;
  }

  const nodeProps = (node.props ?? {}) as Record<string, unknown>;
  const props: Record<string, unknown> = {};
  const translatableProps = ["placeholder", "title", "aria-label", "alt"] as const;
  for (const prop of translatableProps) {
    const value = nodeProps[prop];
    if (typeof value === "string") {
      props[prop] = translateSource(locale, value);
    }
  }

  if (nodeProps.children !== undefined) {
    props.children = translateNode(nodeProps.children as React.ReactNode, locale);
  }

  return React.cloneElement(node, props);
}

type I18nCtx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = React.createContext<I18nCtx>({
  locale: "he",
  setLocale: () => undefined,
  t: (key) => key,
});

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocaleState] = React.useState<Locale>(getStoredLocale);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
  }, [locale]);

  const value = React.useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => rawTranslate(locale, key),
    }),
    [locale, setLocale],
  );

  const translatedTree = React.useMemo(() => translateNode(children, locale), [children, locale]);

  return <I18nContext.Provider value={value}>{translatedTree}</I18nContext.Provider>;
};

export function useI18n() {
  return React.useContext(I18nContext);
}

export function tStatic(key: string) {
  return rawTranslate(getStoredLocale(), key);
}
