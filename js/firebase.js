// ===== FIREBASE ENTEGRASYON KATMANI =====
// LocalStorage ve Firebase arasında geçiş yapmayı sağlar

// Firebase kullanımını kontrol et
const USE_FIREBASE = false; // true yapınca Firebase aktif olur

// Firebase modüllerini yükle (USE_FIREBASE true ise)
let auth, db, storage, googleProvider;

if (USE_FIREBASE) {
    import('./firebase-config.js').then(module => {
        auth = module.auth;
        db = module.db;
        storage = module.storage;
        googleProvider = module.googleProvider;
        console.log('✅ Firebase başarıyla yüklendi');
    }).catch(error => {
        console.error('❌ Firebase yüklenemedi:', error);
        console.log('LocalStorage kullanılıyor');
    });
}

// ===== AUTH FUNCTIONS =====

export async function loginUser(email, password) {
    if (USE_FIREBASE && auth) {
        const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    } else {
        // LocalStorage fallback
        const users = JSON.parse(localStorage.getItem('dogusUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            const session = { ...user, loginTime: new Date().toISOString() };
            delete session.password;
            localStorage.setItem('dogusUserSession', JSON.stringify(session));
            return { success: true, user: session };
        }
        return { success: false, message: 'E-posta veya şifre hatalı!' };
    }
}

export async function registerUser(userData) {
    if (USE_FIREBASE && auth && db) {
        const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const uid = userCredential.user.uid;
            
            // Firestore'a kullanıcı bilgilerini kaydet
            await setDoc(doc(db, 'users', uid), {
                ...userData,
                createdAt: new Date().toISOString(),
                uid: uid
            });
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    } else {
        // LocalStorage fallback
        const users = JSON.parse(localStorage.getItem('dogusUsers') || '[]');
        
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Bu e-posta adresi zaten kayıtlı!' };
        }
        
        const newUser = {
            ...userData,
            id: 'user_' + Date.now(),
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('dogusUsers', JSON.stringify(users));
        
        const session = { ...newUser };
        delete session.password;
        localStorage.setItem('dogusUserSession', JSON.stringify(session));
        
        return { success: true, user: session };
    }
}

export async function loginWithGoogle() {
    if (USE_FIREBASE && auth && googleProvider) {
        const { signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const { doc, setDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Firestore'da kullanıcı var mı kontrol et
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                // İlk kez giriş yapıyor, kullanıcı oluştur
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    createdAt: new Date().toISOString(),
                    uid: user.uid,
                    photoURL: user.photoURL
                });
            }
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    } else {
        return { success: false, message: 'Google giriş şu an kullanılamıyor (Firebase gerekli)' };
    }
}

export async function logoutUser() {
    if (USE_FIREBASE && auth) {
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        await signOut(auth);
    }
    localStorage.removeItem('dogusUserSession');
}

export function getCurrentUser() {
    if (USE_FIREBASE && auth) {
        return auth.currentUser;
    } else {
        const session = localStorage.getItem('dogusUserSession');
        return session ? JSON.parse(session) : null;
    }
}

// ===== PRODUCT FUNCTIONS =====

export async function getProducts() {
    if (USE_FIREBASE && db) {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const querySnapshot = await getDocs(collection(db, 'products'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
        const data = localStorage.getItem('dogusAdminProducts');
        return data ? JSON.parse(data) : [];
    }
}

export async function addProduct(productData) {
    if (USE_FIREBASE && db) {
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const docRef = await addDoc(collection(db, 'products'), {
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { id: docRef.id, ...productData };
    } else {
        const products = await getProducts();
        const product = {
            id: 'prod_' + Date.now(),
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        products.push(product);
        localStorage.setItem('dogusAdminProducts', JSON.stringify(products));
        return product;
    }
}

export async function updateProduct(id, productData) {
    if (USE_FIREBASE && db) {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await updateDoc(doc(db, 'products', id), {
            ...productData,
            updatedAt: new Date().toISOString()
        });
        return { id, ...productData };
    } else {
        const products = await getProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return null;
        products[idx] = { ...products[idx], ...productData, updatedAt: new Date().toISOString() };
        localStorage.setItem('dogusAdminProducts', JSON.stringify(products));
        return products[idx];
    }
}

export async function deleteProduct(id) {
    if (USE_FIREBASE && db) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await deleteDoc(doc(db, 'products', id));
    } else {
        const products = await getProducts();
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('dogusAdminProducts', JSON.stringify(filtered));
    }
}

// ===== IMAGE UPLOAD (Firebase Storage) =====

export async function uploadImage(file, path = 'products') {
    if (USE_FIREBASE && storage) {
        const { ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js");
        
        const fileName = Date.now() + '_' + file.name;
        const storageRef = ref(storage, `${path}/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } else {
        // LocalStorage: base64 olarak kaydet
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export async function uploadMultipleImages(files, path = 'products') {
    const promises = Array.from(files).map(file => uploadImage(file, path));
    return Promise.all(promises);
}

// ===== ORDER FUNCTIONS =====

export async function getOrders() {
    if (USE_FIREBASE && db) {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
        return JSON.parse(localStorage.getItem('dogusOrders') || '[]');
    }
}

export async function addOrder(orderData) {
    if (USE_FIREBASE && db) {
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const docRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...orderData };
    } else {
        const orders = await getOrders();
        const order = {
            id: 'order_' + Date.now(),
            ...orderData,
            createdAt: new Date().toISOString()
        };
        orders.push(order);
        localStorage.setItem('dogusOrders', JSON.stringify(orders));
        return order;
    }
}

// ===== CUSTOMER FUNCTIONS =====

export async function getCustomers() {
    if (USE_FIREBASE && db) {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
        return JSON.parse(localStorage.getItem('dogusUsers') || '[]');
    }
}

// ===== NOTIFICATION =====

console.log(`📦 Firebase Entegrasyon Katmanı Yüklendi`);
console.log(`🔄 Mod: ${USE_FIREBASE ? 'Firebase' : 'LocalStorage'}`);
console.log(`ℹ️  Firebase'e geçmek için js/firebase.js içinde USE_FIREBASE = true yapın`);

// Global olarak export et
window.firebaseAPI = {
    USE_FIREBASE,
    loginUser,
    registerUser,
    loginWithGoogle,
    logoutUser,
    getCurrentUser,
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    uploadMultipleImages,
    getOrders,
    addOrder,
    getCustomers
};
