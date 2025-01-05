// Import needed SDK functions
import { initializeApp } from "@firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "@firebase/app-check";
import { getAnalytics } from "@firebase/analytics";
import { getAuth } from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";
import { getDatabase } from "@firebase/database";
import { getFunctions } from "@firebase/functions";
import { getStorage } from "@firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDbHv2fJ4sIvH_MOFrsh57_JtAEwRVXVxM",
  authDomain: "crosspointx-8ed76.firebaseapp.com",
  databaseURL: "https://crosspointx-8ed76-default-rtdb.firebaseio.com",
  projectId: "crosspointx-8ed76",
  storageBucket: "crosspointx-8ed76.appspot.com",
  messagingSenderId: "487616820799",
  appId: "1:487616820799:web:3b3e778f52c3cbcfce2a8a",
  measurementId: "G-NQ8KP37E8Q",
};

const FIREBASE_APP = initializeApp(firebaseConfig);

const FIREBASE_APPCHECK = initializeAppCheck(FIREBASE_APP, {
  provider: new ReCaptchaEnterpriseProvider(
    "6LdXfqQqAAAAAMtIViiwXxFuShhLXM947XVWnO5l",
  ),
  isTokenAutoRefreshEnable: true,
});

const FIREBASE_ANALYTICS = getAnalytics(FIREBASE_APP);
const FIREBASE_AUTH = getAuth(FIREBASE_APP);
const FIREBASE_FUNCTIONS = getFunctions(FIREBASE_APP);
const FIREBASE_DATABASE = getDatabase(FIREBASE_APP);
const FIREBASE_STORAGE = getStorage(FIREBASE_APP);
const FIREBASE_STORE = getFirestore(FIREBASE_APP);

export {
  FIREBASE_ANALYTICS,
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_FUNCTIONS,
  FIREBASE_DATABASE,
  FIREBASE_STORAGE,
  FIREBASE_STORE,
};
