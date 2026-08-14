// Admin Panel JavaScript
// LocalStorage tabanlı - Firebase'e geçiş hazır yapı

const ADMIN_CREDENTIALS = {
    email: 'admin@dogus.com',
    password: 'dogus2024admin'
};

// Admin Auth Guard
function checkAdminAuth() {
    const adminSession = localStorage.getItem('dogusAdminSession');
    if (!adminSession) {
        window.location.href = 'admin-giris.html';
        return null;
    }
    return JSON.parse(adminSession);
}

function adminLogin(email, password) {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const session = { email, role: 'admin', loginTime: new Date().toISOString() };
        localStorage.setItem('dogusAdminSession', JSON.stringify(session));
        return { success: true };
    }
    return { success: false, message: 'E-posta veya şifre hatalı!' };
}

function adminLogout() {
    localStorage.removeItem('dogusAdminSession');
    window.location.href = 'admin-giris.html';
}

// ─── DATA HELPERS ────────────────────────────────────────────────────────────

// ===== ÜRÜN FONKSİYONLARI (SADECE Firebase + CACHE) =====

// CACHE - Ürünleri bellekte tut
let productsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 saniye cache

// SADECE Firebase'den oku (CACHE ile hızlandırılmış)
async function getProducts(forceRefresh = false) {
    try {
        // Cache kontrolü - 30 saniye içinde tekrar sorma
        if (!forceRefresh && productsCache && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            console.log('📦 Ürünler cache\'den yüklendi (hızlı)');
            return productsCache;
        }
        
        if (!db) {
            console.error('❌ Firebase bağlantısı yok!');
            return productsCache || []; // Cache varsa onu döndür
        }
        
        console.log('🔥 Ürünler Firebase\'den yükleniyor...');
        const snapshot = await db.collection('products')
            .orderBy('createdAt', 'desc') // Son eklenenler önce
            .get({ source: 'default' }); // Cache'den de alabilir
        
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // Cache'i güncelle
        productsCache = products;
        cacheTimestamp = Date.now();
        
        console.log(`✅ ${products.length} ürün Firebase'den yüklendi`);
        return products;
    } catch (error) {
        console.error('❌ Firebase okuma hatası:', error);
        // Hata durumunda cache'deki veriyi döndür
        return productsCache || [];
    }
}

// Cache'i temizle (ürün ekleme/silme/güncelleme sonrası)
function clearProductsCache() {
    productsCache = null;
    cacheTimestamp = 0;
    console.log('🗑️ Ürün cache temizlendi');
}

// Geriye uyumluluk için
async function getProductsAsync() {
    return await getProducts();
}

// Tek ürün ekle
async function addProduct(product) {
    try {
        if (!db) {
            throw new Error('Firebase bağlantısı yok!');
        }
        
        const productData = {
            ...product,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('products').add(productData);
        console.log('✅ Ürün Firebase\'e eklendi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Ürün eklenemedi:', error);
        throw error;
    }
}

// Ürün güncelle
async function updateProduct(productId, updates) {
    try {
        if (!db) {
            throw new Error('Firebase bağlantısı yok!');
        }
        
        await db.collection('products').doc(productId).update({
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

// Ürün sil
async function deleteProduct(productId) {
    try {
        if (!db) {
            throw new Error('Firebase bağlantısı yok!');
        }
        
        await db.collection('products').doc(productId).delete();
        console.log('✅ Ürün silindi:', productId);
        return true;
    } catch (error) {
        console.error('❌ Ürün silinemedi:', error);
        throw error;
    }
}

/**
 * Gerçek zamanlı dinleme - Firebase'deki değişiklikleri anında yakala
 */
function listenToProducts(callback) {
    if (!db) {
        console.error('❌ Firebase bağlantısı yok!');
        return null;
    }
    
    return db.collection('products').onSnapshot(snapshot => {
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        console.log('🔄 Ürünler güncellendi:', products.length);
        callback(products);
    }, error => {
        console.error('❌ Ürün dinleme hatası:', error);
    });
}

/**
 * Gerçek zamanlı dinlemeyi başlat (admin panelde kullan)
 */
let unsubscribeProducts = null;

function startListeningProducts() {
    if (unsubscribeProducts) {
        console.log('⚠️ Zaten dinleniyor');
        return;
    }
    
    unsubscribeProducts = listenToProducts((products) => {
        console.log('🔥 Ürünler güncellendi, sayfa yenileniyor...');
        if (typeof renderProducts === 'function') {
            renderProducts();
        }
        // Admin panelde event gönder
        window.dispatchEvent(new CustomEvent('productsUpdated', { detail: { products } }));
    });
    
    console.log('✅ Gerçek zamanlı dinleme başlatıldı');
}

function stopListeningProducts() {
    if (unsubscribeProducts) {
        unsubscribeProducts();
        unsubscribeProducts = null;
        console.log('❌ Gerçek zamanlı dinleme durduruldu');
    }
}

// ESKİ saveProducts fonksiyonu - artık kullanılmıyor
// Firebase async fonksiyonları kullanın: addProduct(), updateProduct(), deleteProduct()

// ─── CUSTOMERS (Firebase) ─────────────────────────────────────────────────────

async function getCustomers() {
    try {
        if (typeof db !== 'undefined' && db) {
            const snapshot = await db.collection('customers').get();
            const customers = [];
            snapshot.forEach(doc => {
                customers.push({ id: doc.id, ...doc.data() });
            });
            return customers;
        }
    } catch (error) {
        console.error('❌ Müşteriler yüklenirken hata:', error);
    }
    return [];
}

async function addCustomer(customer) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        const docRef = await db.collection('customers').add({
            ...customer,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Müşteri eklendi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Müşteri eklenirken hata:', error);
        throw error;
    }
}

// ─── ORDERS (Firebase) ────────────────────────────────────────────────────────

async function getOrders() {
    try {
        if (typeof db !== 'undefined' && db) {
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            return orders;
        }
    } catch (error) {
        console.error('❌ Siparişler yüklenirken hata:', error);
    }
    return [];
}

async function saveOrder(order) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        const docRef = await db.collection('orders').add({
            ...order,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Sipariş kaydedildi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Sipariş kaydedilirken hata:', error);
        throw error;
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        await db.collection('orders').doc(orderId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Sipariş durumu güncellendi:', orderId);
    } catch (error) {
        console.error('❌ Sipariş güncellenirken hata:', error);
        throw error;
    }
}

// ─── STOCK (Firebase) ─────────────────────────────────────────────────────────

async function getStock() {
    try {
        if (typeof db !== 'undefined' && db) {
            const snapshot = await db.collection('stock').get();
            const stock = [];
            snapshot.forEach(doc => {
                stock.push({ id: doc.id, ...doc.data() });
            });
            return stock;
        }
    } catch (error) {
        console.error('❌ Stok yüklenirken hata:', error);
    }
    return [];
}

async function addStockItem(item) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        const docRef = await db.collection('stock').add({
            ...item,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Stok eklendi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Stok eklenirken hata:', error);
        throw error;
    }
}

async function updateStockItem(id, data) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        await db.collection('stock').doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Stok güncellendi:', id);
    } catch (error) {
        console.error('❌ Stok güncellenirken hata:', error);
        throw error;
    }
}

async function deleteStockItem(id) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        await db.collection('stock').doc(id).delete();
        console.log('✅ Stok silindi:', id);
    } catch (error) {
        console.error('❌ Stok silinirken hata:', error);
        throw error;
    }
}

// ─── BRANDS (Firebase) ────────────────────────────────────────────────────────

async function getBrands() {
    try {
        if (typeof db !== 'undefined' && db) {
            const doc = await db.collection('settings').doc('brands').get();
            if (doc.exists) {
                return doc.data().brands || getDefaultBrands();
            }
        }
    } catch (error) {
        console.error('❌ Markalar yüklenirken hata:', error);
    }
    return getDefaultBrands();
}

function getDefaultBrands() {
    return {
        'Beyaz Eşya': ['ALTUS', 'HOOVER', 'GRUNDİG', 'SUNNY', 'ÇETİNTAŞ', 'TEKA', 'VENTİNO', 'SİMFER', 'REGAL', 'TELEFUNKEN'],
        'Küçük Ev Aletleri': ['FANTOM', 'FAKİR', 'ONVO', 'APRİLLA', 'SİNBO', 'İNOVA', 'ARÇELİK', 'CVS', 'KİWİ', 'ARZUM', 'KORKMAZ', 'PHİLİPS', 'DUBBO', 'VEVANDİN', 'SAREX', 'SUNNY', 'RANGE', 'ARNİCA', 'CONTİ', 'AKSU', 'İTİMAT', 'ALTUS', 'KİNG'],
        'Klima & Vantilatör': ['RAKS', 'İNOVA', 'ALTUS', 'REGAL'],
        'Mobilya': ['PUFFY', 'AKYOL MOBİLYA', 'SUNA SANDALYE', 'MASSA', 'HOMESET', 'BODE', 'TUTKU', 'EVONA', 'SİES', 'RAVİZZA', 'ÇINARCA', 'ASRASAN'],
        'Kişisel Bakım': ['REMİNGTON', 'APRİLLA', 'BABYLİSS', 'FAKİR', 'BRAUN', 'İNOVA', 'RAKS', 'POWERTEC'],
        'Tekstil': ['COTTONBOX', 'ALTINBAŞAK', 'TAC', 'KRİSTAL', 'HOBBY'],
        'Züccaciye': ['TAÇ', 'SCHAFER', 'AKPA', 'FALEZ', 'KORKMAZ', 'İMZA', 'TEFAL']
    };
}

async function saveBrands(brands) {
    try {
        if (!db) throw new Error('Firebase bağlantısı yok!');
        
        await db.collection('settings').doc('brands').set({
            brands: brands,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Markalar kaydedildi');
    } catch (error) {
        console.error('❌ Markalar kaydedilirken hata:', error);
        throw error;
    }
}

// ─── STATS ────────────────────────────────────────────────────────────────────

async function getDashboardStats() {
    const products = await getProducts();
    const customers = await getCustomers();
    const orders = await getOrders();
    const stock = await getStock();
    const brands = await getBrands();

    const totalBrands = Object.values(brands).reduce((sum, arr) => sum + arr.length, 0);
    const brandCategories = Object.keys(brands).length;

    const stockValue = stock.reduce((sum, item) => {
        // Türk para formatını parse et: "₺15.500,50" -> 15500.50
        let priceStr = (item.price || '0').toString()
            .replace(/₺/g, '')          // ₺ işaretini kaldır
            .replace(/\s/g, '')         // Boşlukları kaldır
            .replace(/\./g, '')         // Binlik ayırıcıyı kaldır (15.000 -> 15000)
            .replace(/,/g, '.');        // Ondalık virgülü noktaya çevir (500,50 -> 500.50)
        const price = parseFloat(priceStr) || 0;
        return sum + (price * (item.quantity || 0));
    }, 0);

    const storeValue = products.reduce((sum, p) => {
        // Türk para formatını parse et: "₺15.500,50" -> 15500.50
        let priceStr = (p.price || '0').toString()
            .replace(/₺/g, '')          // ₺ işaretini kaldır
            .replace(/\s/g, '')         // Boşlukları kaldır
            .replace(/\./g, '')         // Binlik ayırıcıyı kaldır (15.000 -> 15000)
            .replace(/,/g, '.');        // Ondalık virgülü noktaya çevir (500,50 -> 500.50)
        const price = parseFloat(priceStr) || 0;
        const qty = p.stock || 0;
        return sum + price * qty;
    }, 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    return {
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        pendingOrders,
        totalBrands,
        brandCategories,
        stockValue,
        storeValue,
        totalValue: stockValue + storeValue
    };
}

// ─── PRODUCT CRUD (Firebase) ──────────────────────────────────────────────────

// Yeni ürün ekle - Firebase'e direkt
async function addProduct(productData) {
    try {
        if (!db) {
            throw new Error('Firebase bağlantısı yok!');
        }
        
        const product = {
            ...productData,
            isFeatured: productData.isFeatured || false,
            isActive: productData.isActive !== false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('products').add(product);
        console.log('✅ Ürün Firebase\'e eklendi:', docRef.id);
        
        // Cache'i temizle
        clearProductsCache();
        
        // Site ile senkronizasyon için event dispatch
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Ürün eklenemedi:', error);
        throw error;
    }
}

// Ürün güncelle - Firebase'de direkt
async function updateProduct(id, productData) {
    try {
        if (!db) {
            throw new Error('Firebase bağlantısı yok!');
        }
        
        await db.collection('products').doc(id).update({
            ...productData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Ürün güncellendi:', id);
        
        // Cache'i temizle
        clearProductsCache();
        
        // Site ile senkronizasyon için event dispatch
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        
        return true;
    } catch (error) {
        console.error('❌ Ürün güncellenemedi:', error);
        throw error;
    }
}

// Ürün sil - Firebase'den direkt
async function deleteProduct(id) {
    try {
        if (!db) {
            throw new Error('Firebase bağlantısı yok!');
        }
        
        await db.collection('products').doc(id).delete();
        console.log('✅ Ürün silindi:', id);
        
        // Cache'i temizle
        clearProductsCache();
        
        // Site ile senkronizasyon için event dispatch
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        
        return true;
    } catch (error) {
        console.error('❌ Ürün silinemedi:', error);
        throw error;
    }
}

// ─── STOCK CRUD ───────────────────────────────────────────────────────────────

// ─── IMAGE HELPERS ────────────────────────────────────────────────────────────

function readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function processImageFiles(files, maxCount = 6) {
    const results = [];
    const toProcess = Array.from(files).slice(0, maxCount);
    
    for (const file of toProcess) {
        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} dosyası 5MB'dan büyük, atlandı.`);
            continue;
        }
        
        try {
            // Fotoğrafı sıkıştır
            const compressedDataUrl = await compressImage(file, 0.7, 1200); // 70% kalite, max 1200px
            results.push(compressedDataUrl);
        } catch (error) {
            console.error('Fotoğraf işleme hatası:', error);
            alert(`${file.name} işlenirken hata oluştu, atlandı.`);
        }
    }
    return results;
}

// Fotoğraf sıkıştırma fonksiyonu
function compressImage(file, quality = 0.7, maxWidth = 1200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Boyut kontrolü
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // JPEG olarak sıkıştır
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                console.log(`📸 Fotoğraf sıkıştırıldı: ${file.name}`);
                console.log(`   Orijinal: ${(file.size / 1024).toFixed(2)} KB`);
                console.log(`   Sıkıştırılmış: ${(compressedDataUrl.length / 1024).toFixed(2)} KB`);
                
                resolve(compressedDataUrl);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────

function formatCurrency(value) {
    return '₺' + Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
}

function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showAdminNotification(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `admin-notification admin-notification-${type}`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 50);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── NOTIFICATIONS SYSTEM ─────────────────────────────────────────────────────

function getNotifications() {
    return JSON.parse(localStorage.getItem('dogusNotifications') || '[]');
}

function saveNotifications(notifications) {
    localStorage.setItem('dogusNotifications', JSON.stringify(notifications));
}

function addNotification(type, title, message) {
    const notifications = getNotifications();
    notifications.push({
        id: 'notif_' + Date.now(),
        type: type, // 'order', 'stock', 'customer', 'system'
        title: title,
        message: message,
        read: false,
        createdAt: new Date().toISOString()
    });
    saveNotifications(notifications);
}

function markNotificationRead(id) {
    const notifications = getNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications(notifications);
    }
}

// ─── ANALYTICS & REPORTS ──────────────────────────────────────────────────────

async function getMonthlyReport(month, year) {
    const orders = await getOrders();
    const products = await getProducts();
    const customers = await getCustomers();
    
    const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
    });
    
    const totalRevenue = monthOrders.reduce((sum, o) => {
        const price = parseFloat((o.totalPrice || '0').toString().replace(/[₺.,]/g, '')) || 0;
        return sum + price;
    }, 0);
    
    const newCustomers = customers.filter(c => {
        const joinDate = new Date(c.createdAt);
        return joinDate.getMonth() === month && joinDate.getFullYear() === year;
    }).length;
    
    // Kategori performansı
    const categoryPerformance = {};
    products.forEach(p => {
        if (!categoryPerformance[p.category]) {
            categoryPerformance[p.category] = { sales: 0, revenue: 0 };
        }
        // Satış sayısını sipariş verilerinden hesapla
        const productOrders = monthOrders.filter(o => 
            o.items && o.items.some(item => item.productId === p.id)
        );
        categoryPerformance[p.category].sales += productOrders.length;
    });
    
    return {
        month,
        year,
        totalOrders: monthOrders.length,
        totalRevenue,
        newCustomers,
        avgOrderValue: monthOrders.length > 0 ? totalRevenue / monthOrders.length : 0,
        categoryPerformance
    };
}

async function getSalesChartData(days = 30) {
    const orders = await getOrders();
    const now = new Date();
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
            return orderDate === dateStr;
        });
        
        const dayRevenue = dayOrders.reduce((sum, o) => {
            const price = parseFloat((o.totalPrice || '0').toString().replace(/[₺.,]/g, '')) || 0;
            return sum + price;
        }, 0);
        
        data.push({
            date: dateStr,
            orders: dayOrders.length,
            revenue: dayRevenue
        });
    }
    
    return data;
}

// ─── CUSTOMER MESSAGING ────────────────────────────────────────────────────────

function prepareCustomerMessage(customerIds, message) {
    const customers = getCustomers();
    const recipients = customerIds === 'all' 
        ? customers 
        : customers.filter(c => customerIds.includes(c.id));
    
    return {
        recipients: recipients,
        message: message,
        timestamp: new Date().toISOString()
    };
}

function generateWhatsAppBulkMessage(customers, message) {
    // WhatsApp Business API entegrasyonu için hazırlık
    const numbers = customers.map(c => c.phone).filter(Boolean);
    return {
        numbers: numbers,
        message: message,
        method: 'whatsapp'
    };
}
