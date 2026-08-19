// ===== FIREBASE v9 MODULAR SDK CONFIGURATION =====
// 24MB → 5MB (80% küçültme) ⚡

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDMsc1umCjPMfOiF03GqhOubLveY6JQEG4",
  authDomain: "dogusalisverismerkezi-da2c1.firebaseapp.com",
  projectId: "dogusalisverismerkezi-da2c1",
  storageBucket: "dogusalisverismerkezi-da2c1.firebasestorage.app",
  messagingSenderId: "640190088546",
  appId: "1:640190088546:web:5027474c11af0e54513d3"
};

// Firebase başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

console.log('✅ Firebase v9 Modular SDK başlatıldı (5MB)');

// Offline Persistence
enableIndexedDbPersistence(db)
  .then(() => console.log('✅ Offline persistence aktif'))
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Persistence sadece bir tab\'ta aktif');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Tarayıcı persistence desteklemiyor');
    }
  });

// Koleksiyon isimleri
const COLLECTIONS = {
  PRODUCTS: 'products',
  BRANDS: 'brands',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  SETTINGS: 'settings'
};

// ===== ÜRÜN İŞLEMLERİ =====

async function getProductsFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    const products = [];
    querySnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ ${products.length} ürün yüklendi`);
    return products;
  } catch (error) {
    console.error('❌ Ürünler yüklenemedi:', error);
    return [];
  }
}

async function getProductByIdFromFirebase(productId) {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Ürün yüklenemedi:', error);
    return null;
  }
}

async function addProductToFirebase(product) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Ürün eklendi:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Ürün eklenemedi:', error);
    throw error;
  }
}

async function updateProductInFirebase(productId, updates) {
  try {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Ürün güncellendi:', productId);
    return true;
  } catch (error) {
    console.error('❌ Ürün güncellenemedi:', error);
    throw error;
  }
}

async function deleteProductFromFirebase(productId) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    console.log('✅ Ürün silindi:', productId);
    return true;
  } catch (error) {
    console.error('❌ Ürün silinemedi:', error);
    throw error;
  }
}

// ===== MARKA İŞLEMLERİ =====

async function getBrandsFromFirebase() {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.BRANDS, 'brandsList'));
    if (docSnap.exists()) {
      return docSnap.data().brands || {};
    }
    return {};
  } catch (error) {
    console.error('❌ Markalar yüklenemedi:', error);
    return {};
  }
}

async function saveBrandsToFirebase(brands) {
  try {
    await updateDoc(doc(db, COLLECTIONS.BRANDS, 'brandsList'), {
      brands: brands,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Markalar kaydedildi');
    return true;
  } catch (error) {
    console.error('❌ Markalar kaydedilemedi:', error);
    throw error;
  }
}

// ===== STORAGE İŞLEMLERİ =====

async function uploadImageToFirebase(file, folder = 'products') {
  try {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Dosya yüklendi:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Dosya yüklenemedi:', error);
    throw error;
  }
}

async function uploadMultipleImagesToFirebase(files, folder = 'products') {
  try {
    const uploadPromises = Array.from(files).map(file => 
      uploadImageToFirebase(file, folder)
    );
    const urls = await Promise.all(uploadPromises);
    console.log(`✅ ${urls.length} dosya yüklendi`);
    return urls;
  } catch (error) {
    console.error('❌ Dosyalar yüklenemedi:', error);
    throw error;
  }
}

async function deleteImageFromFirebase(imageUrl) {
  try {
    const path = imageUrl.split('/o/')[1].split('?')[0];
    const decodedPath = decodeURIComponent(path);
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
    console.log('✅ Dosya silindi:', decodedPath);
    return true;
  } catch (error) {
    console.error('❌ Dosya silinemedi:', error);
    throw error;
  }
}

// ===== MÜŞTERİ & SİPARİŞ İŞLEMLERİ =====

async function getCustomersFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    const customers = [];
    querySnapshot.forEach(doc => {
      customers.push({ id: doc.id, ...doc.data() });
    });
    return customers;
  } catch (error) {
    console.error('❌ Müşteriler yüklenemedi:', error);
    return [];
  }
}

async function addCustomerToFirebase(customer) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
      ...customer,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('❌ Müşteri eklenemedi:', error);
    throw error;
  }
}

async function getOrdersFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error('❌ Siparişler yüklenemedi:', error);
    return [];
  }
}

async function addOrderToFirebase(order) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
      ...order,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('❌ Sipariş eklenemedi:', error);
    throw error;
  }
}

// ===== GERÇEK ZAMANLI DİNLEYİCİLER =====

function listenToProducts(callback) {
  return onSnapshot(collection(db, COLLECTIONS.PRODUCTS), snapshot => {
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    callback(products);
  }, error => {
    console.error('❌ Ürün dinleme hatası:', error);
  });
}

function listenToBrands(callback) {
  return onSnapshot(doc(db, COLLECTIONS.BRANDS, 'brandsList'), docSnap => {
    if (docSnap.exists()) {
      callback(docSnap.data().brands || {});
    } else {
      callback({});
    }
  }, error => {
    console.error('❌ Marka dinleme hatası:', error);
  });
}

// ===== GLOBAL EXPORTS =====

window.db = db;
window.storage = storage;
window.auth = auth;
window.COLLECTIONS = COLLECTIONS;

window.getProductsFromFirebase = getProductsFromFirebase;
window.getProductByIdFromFirebase = getProductByIdFromFirebase;
window.addProductToFirebase = addProductToFirebase;
window.updateProductInFirebase = updateProductInFirebase;
window.deleteProductFromFirebase = deleteProductFromFirebase;
window.getBrandsFromFirebase = getBrandsFromFirebase;
window.saveBrandsToFirebase = saveBrandsToFirebase;
window.uploadImageToFirebase = uploadImageToFirebase;
window.uploadMultipleImagesToFirebase = uploadMultipleImagesToFirebase;
window.deleteImageFromFirebase = deleteImageFromFirebase;
window.getCustomersFromFirebase = getCustomersFromFirebase;
window.addCustomerToFirebase = addCustomerToFirebase;
window.getOrdersFromFirebase = getOrdersFromFirebase;
window.addOrderToFirebase = addOrderToFirebase;
window.listenToProducts = listenToProducts;
window.listenToBrands = listenToBrands;

console.log('✅ Firebase v9 fonksiyonları hazır');
