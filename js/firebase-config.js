// Firebase Configuration
// Bu dosyayı Firebase Console'dan aldığınız config ile doldurun
// https://console.firebase.google.com → Project Settings → Your Apps → Web App

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ⚠️ BURAYA KENDİ FİREBASE CONFIG'İNİZİ GİRİN
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/*
FIREBASE KURULUM ADIMLARI:
1. https://console.firebase.google.com adresine gidin
2. "Create a project" → proje adı girin (örn: dogus-alisveris)
3. Google Analytics: isteğe bağlı
4. Project Settings → Your apps → Web app ekle (</>)
5. Yukarıdaki firebaseConfig'i kopyala-yapıştır
6. Authentication → Sign-in method → Email/Password + Google aç
7. Firestore Database → Create database → Production mode
8. Storage → Get started
9. Firestore Rules:
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth.uid == userId;
       }
       match /products/{productId} {
         allow read: if true;
         allow write: if request.auth != null && 
           get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
       }
       match /orders/{orderId} {
         allow read, write: if request.auth != null;
       }
       match /admins/{adminId} {
         allow read: if request.auth.uid == adminId;
         allow write: if false;
       }
     }
   }
*/
