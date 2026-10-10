import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCunYAH_KDL1GqFbnEaeZVJJ5tnRQvtiBc",
  authDomain: "the-arc-db.firebaseapp.com",
  projectId: "the-arc-db",
  storageBucket: "the-arc-db.firebasestorage.app",
  messagingSenderId: "211338735655",
  appId: "1:211338735655:web:aa6716a5d53322f85cde02"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
