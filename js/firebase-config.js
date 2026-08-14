// ===== FIREBASE CONFIGURATION =====
// Firebase Console'dan alınan config bilgileri buraya girilecek

// FIREBASE KURULUM ADIMLARI:
// 1. https://console.firebase.google.com/ adresine git
// 2. "Add project" veya "Proje ekle" butonuna tıkla
// 3. Proje adı: "dogus-alisveris" (veya istediğin bir isim)
// 4. Google Analytics: İsteğe bağlı (şimdilik hayır diyebilirsin)
// 5. Proje oluşturulduktan sonra:
//    - Sol menüden "Build" → "Firestore Database" → "Create database"
//    - Mode: "Start in test mode" seç (geliştirme için)
//    - Location: "europe-west" seç (Avrupa sunucusu)
// 6. Sol menüden "Build" → "Storage" → "Get started"
//    - Mode: "Start in test mode" seç
// 7. Sol menüden "Project Settings" (⚙️ ikonu) → "General" tab
//    - Aşağı kaydır, "Your apps" bölümünde "Web" (</>)  ikonuna tıkla
//    - App nickname: "dogus-web"
//    - Firebase Hosting: Hayır (GitHub Pages kullanıyoruz)
//    - "Register app" butonuna tıkla
//    - Açılan config kodunu aşağıya kopyala

// ========================================
// FIREBASE CONFIG - CONSOLE'DAN ALINDI
// ========================================
const firebaseConfig = {
  apiKey: "AIzaSyDMsc1umCjPMfOiF03GqhOubLveY6JQEG4",
  authDomain: "dogusalisverismerkezi-da2c1.firebaseapp.com",
  projectId: "dogusalisverismerkezi-da2c1",
  storageBucket: "dogusalisverismerkezi-da2c1.firebasestorage.app",
  messagingSenderId: "640190088546",
  appId: "1:640190088546:web:5027474c11af0e54513d3"
};

// Firebase'i başlat
let app, db, storage, auth;
let firebaseReady = false;
let firebaseReadyResolve, firebaseReadyReject;

// Firebase hazır promise
const firebaseReadyPromise = new Promise((resolve, reject) => {
  firebaseReadyResolve = resolve;
  firebaseReadyReject = reject;
});

// Firebase başlatma fonksiyonu
function initializeFirebase() {
  try {
    // Firebase SDK'ları yüklendiyse başlat
    if (typeof firebase !== 'undefined') {
      app = firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      
      // Storage opsiyonel - varsa yükle, yoksa null
      try {
        storage = firebase.storage();
        console.log('✅ Storage başlatıldı:', typeof storage);
      } catch (storageError) {
        console.warn('⚠️ Storage SDK yüklenmedi, dosya yükleme çalışmayacak');
        storage = null;
      }
      
      auth = firebase.auth();
      
      console.log('✅ Firebase App başlatıldı');
      console.log('✅ Firestore başlatıldı:', typeof db);
      console.log('✅ Auth başlatıldı:', typeof auth);
      
      // OFFLINE PERSISTENCE - Hızlı yüklenme için
      db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
          console.log('✅ Firebase offline persistence aktif');
        })
        .catch((err) => {
          if (err.code == 'failed-precondition') {
            console.warn('⚠️ Persistence sadece bir tab\'ta aktif olabilir');
          } else if (err.code == 'unimplemented') {
            console.warn('⚠️ Tarayıcı offline persistence desteklemiyor');
          }
        });
      
      console.log('✅ Firebase başarıyla başlatıldı');
      firebaseReady = true;
      
      // Global scope'a ekle
      window.firebase = firebase;
      window.db = db;
      window.storage = storage;
      window.auth = auth;
      
      firebaseReadyResolve({ app, db, storage, auth });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase başlatma hatası:', error);
    firebaseReadyReject(error);
    return false;
  }
}

// Hemen başlatmayı dene
if (!initializeFirebase()) {
  // Firebase henüz yüklenmediyse, 2 saniye bekle ve bir kere daha dene
  console.log('⏳ Firebase SDK henüz yüklenmedi, 2 saniye bekleniyor...');
  
  setTimeout(() => {
    if (!initializeFirebase()) {
      const error = new Error('Firebase SDK yüklenemedi');
      console.error('❌', error.message);
      firebaseReadyReject(error);
    }
  }, 2000);
}

// ===== FİREBASE HELPER FUNCTIONS =====

// Firestore koleksiyonları
const COLLECTIONS = {
  PRODUCTS: 'products',
  BRANDS: 'brands',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  SETTINGS: 'settings'
};

// ===== ÜRÜN İŞLEMLERİ =====

/**
 * Tüm ürünleri getir
 */
async function getProductsFromFirebase() {
  try {
    const snapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    console.log(`✅ ${products.length} ürün Firebase'den yüklendi`);
    return products;
  } catch (error) {
    console.error('❌ Ürünler yüklenemedi:', error);
    return [];
  }
}

/**
 * Tek ürün getir
 */
async function getProductByIdFromFirebase(productId) {
  try {
    const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Ürün yüklenemedi:', error);
    return null;
  }
}

/**
 * Ürün ekle
 */
async function addProductToFirebase(product) {
  try {
    const docRef = await db.collection(COLLECTIONS.PRODUCTS).add({
      ...product,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Ürün eklendi:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Ürün eklenemedi:', error);
    throw error;
  }
}

/**
 * Ürün güncelle
 */
async function updateProductInFirebase(productId, updates) {
  try {
    await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Ürün güncellendi:', productId);
    return true;
  } catch (error) {
    console.error('❌ Ürün güncellenemedi:', error);
    throw error;
  }
}

/**
 * Ürün sil
 */
async function deleteProductFromFirebase(productId) {
  try {
    await db.collection(COLLECTIONS.PRODUCTS).doc(productId).delete();
    console.log('✅ Ürün silindi:', productId);
    return true;
  } catch (error) {
    console.error('❌ Ürün silinemedi:', error);
    throw error;
  }
}

// ===== MARKA İŞLEMLERİ =====

/**
 * Tüm markaları getir
 */
async function getBrandsFromFirebase() {
  try {
    const doc = await db.collection(COLLECTIONS.BRANDS).doc('brandsList').get();
    if (doc.exists) {
      return doc.data().brands || {};
    }
    return {};
  } catch (error) {
    console.error('❌ Markalar yüklenemedi:', error);
    return {};
  }
}

/**
 * Markaları kaydet
 */
async function saveBrandsToFirebase(brands) {
  try {
    await db.collection(COLLECTIONS.BRANDS).doc('brandsList').set({
      brands: brands,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ Markalar kaydedildi');
    return true;
  } catch (error) {
    console.error('❌ Markalar kaydedilemedi:', error);
    throw error;
  }
}

// ===== DOSYA YÜKLEME (STORAGE) =====

/**
 * Fotoğraf yükle
 * @param {File} file - Yüklenecek dosya
 * @param {string} folder - Klasör adı (products, brands, etc.)
 * @returns {Promise<string>} - Download URL
 */
async function uploadImageToFirebase(file, folder = 'products') {
  try {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(fileName);
    
    // Metadata ekle
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Dosyayı yükle
    const snapshot = await storageRef.put(file, metadata);
    
    // Download URL al
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    console.log('✅ Dosya yüklendi:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Dosya yüklenemedi:', error);
    throw error;
  }
}

/**
 * Birden fazla fotoğraf yükle
 */
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

/**
 * Storage'dan dosya sil
 */
async function deleteImageFromFirebase(imageUrl) {
  try {
    // URL'den storage path çıkar
    const path = imageUrl.split('/o/')[1].split('?')[0];
    const decodedPath = decodeURIComponent(path);
    
    const storageRef = storage.ref(decodedPath);
    await storageRef.delete();
    
    console.log('✅ Dosya silindi:', decodedPath);
    return true;
  } catch (error) {
    console.error('❌ Dosya silinemedi:', error);
    throw error;
  }
}

// ===== MÜŞTERİ İŞLEMLERİ =====

async function getCustomersFromFirebase() {
  try {
    const snapshot = await db.collection(COLLECTIONS.CUSTOMERS).get();
    const customers = [];
    snapshot.forEach(doc => {
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
    const docRef = await db.collection(COLLECTIONS.CUSTOMERS).add({
      ...customer,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('❌ Müşteri eklenemedi:', error);
    throw error;
  }
}

// ===== SİPARİŞ İŞLEMLERİ =====

async function getOrdersFromFirebase() {
  try {
    const snapshot = await db.collection(COLLECTIONS.ORDERS).get();
    const orders = [];
    snapshot.forEach(doc => {
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
    const docRef = await db.collection(COLLECTIONS.ORDERS).add({
      ...order,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('❌ Sipariş eklenemedi:', error);
    throw error;
  }
}

// ===== GERÇEK ZAMANLI DİNLEYİCİLER =====

/**
 * Ürünleri gerçek zamanlı dinle
 */
function listenToProducts(callback) {
  return db.collection(COLLECTIONS.PRODUCTS).onSnapshot(snapshot => {
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    callback(products);
  }, error => {
    console.error('❌ Ürün dinleme hatası:', error);
  });
}

/**
 * Markaları gerçek zamanlı dinle
 */
function listenToBrands(callback) {
  return db.collection(COLLECTIONS.BRANDS).doc('brandsList').onSnapshot(doc => {
    if (doc.exists) {
      callback(doc.data().brands || {});
    } else {
      callback({});
    }
  }, error => {
    console.error('❌ Marka dinleme hatası:', error);
  });
}

// ===== MIGRATION: LOCALSTORAGE → FIREBASE =====

/**
 * LocalStorage'daki tüm verileri Firebase'e taşı (bir kere çalıştırılacak)
 */
async function migrateLocalStorageToFirebase() {
  try {
    console.log('🔄 LocalStorage → Firebase migrasyonu başlatılıyor...');
    
    // Ürünleri taşı
    const localProducts = JSON.parse(localStorage.getItem('dogusAdminProducts') || '[]');
    if (localProducts.length > 0) {
      console.log(`📦 ${localProducts.length} ürün taşınıyor...`);
      for (const product of localProducts) {
        await addProductToFirebase(product);
      }
      console.log('✅ Ürünler Firebase\'e taşındı');
    }
    
    // Markaları taşı
    const localBrands = JSON.parse(localStorage.getItem('dogusBrands') || '{}');
    if (Object.keys(localBrands).length > 0) {
      console.log(`🏷️ Markalar taşınıyor...`);
      await saveBrandsToFirebase(localBrands);
      console.log('✅ Markalar Firebase\'e taşındı');
    }
    
    // Müşterileri taşı
    const localCustomers = JSON.parse(localStorage.getItem('dogusCustomers') || '[]');
    if (localCustomers.length > 0) {
      console.log(`👥 ${localCustomers.length} müşteri taşınıyor...`);
      for (const customer of localCustomers) {
        await addCustomerToFirebase(customer);
      }
      console.log('✅ Müşteriler Firebase\'e taşındı');
    }
    
    console.log('✅ Migrasyon tamamlandı!');
    console.log('⚠️ LocalStorage verileri korundu (manuel silebilirsiniz)');
    
    return true;
  } catch (error) {
    console.error('❌ Migrasyon hatası:', error);
    throw error;
  }
}

// ===== YARDIMCI FONKSİYONLAR =====

/**
 * Firebase bağlantı durumunu kontrol et
 */
function checkFirebaseConnection() {
  if (!db) {
    console.error('❌ Firebase bağlantısı yok!');
    return false;
  }
  return true;
}

/**
 * Firebase hazır mı?
 */
function isFirebaseReady() {
  return firebaseReady && typeof firebase !== 'undefined' && db !== undefined && auth !== undefined;
}

/**
 * Firebase hazır olana kadar bekle
 */
async function waitForFirebase() {
  if (firebaseReady) return { app, db, storage, auth };
  return await firebaseReadyPromise;
}

// Firebase hazır promise'i global scope'a ekle
window.firebaseReadyPromise = firebaseReadyPromise;
window.waitForFirebase = waitForFirebase;

// Helper fonksiyonları export et
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
window.migrateLocalStorageToFirebase = migrateLocalStorageToFirebase;
window.checkFirebaseConnection = checkFirebaseConnection;
window.isFirebaseReady = isFirebaseReady;
window.COLLECTIONS = COLLECTIONS;
