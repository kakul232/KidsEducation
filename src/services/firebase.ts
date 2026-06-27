import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCvcGkmFYuCVJMpg0OwbHV2tTvf4Snif6A",
  authDomain: "kids-edication.firebaseapp.com",
  projectId: "kids-edication",
  storageBucket: "kids-edication.firebasestorage.app",
  messagingSenderId: "78617643440",
  appId: "1:78617643440:web:01838ba9d17e2b6a142e75"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust multi-tab offline caching persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Auth & Storage
export const auth = getAuth(app);
export const storage = getStorage(app);
