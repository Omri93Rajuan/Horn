import admin from "firebase-admin";
import { loadEnv } from "../config/env";

loadEnv();

function initAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const serviceAccount = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return;
  }

  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

initAdmin();

export { admin };
