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

// ===== ÜRÜN FONKSİYONLARI (SADECE Firebase) =====

// SADECE Firebase'den oku
async function getProducts() {
    try {
        if (!db) {
            console.error('❌ Firebase bağlantısı yok!');
            return [];
        }
        
        console.log('🔥 Ürünler Firebase\'den yükleniyor...');
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ ${products.length} ürün Firebase'den yüklendi`);
        return products;
    } catch (error) {
        console.error('❌ Firebase okuma hatası:', error);
        return [];
    }
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

// ESKİ saveProducts fonksiyonu - artık kullanılmıyor ama geriye uyumluluk için
function saveProducts(products) {
    console.warn('⚠️ saveProducts() artık kullanılmıyor. addProduct() veya updateProduct() kullanın.');
}

function getCustomers() {
    // Merge kayıtlı kullanıcılar
    const users = JSON.parse(localStorage.getItem('dogusUsers') || '[]');
    return users;
}

function getOrders() {
    return JSON.parse(localStorage.getItem('dogusOrders') || '[]');
}

function saveOrders(orders) {
    localStorage.setItem('dogusOrders', JSON.stringify(orders));
}

function getStock() {
    return JSON.parse(localStorage.getItem('dogusStock') || '[]');
}

function saveStock(stock) {
    localStorage.setItem('dogusStock', JSON.stringify(stock));
}

function getBrands() {
    const defaultBrands = {
        'Beyaz Eşya': ['ALTUS', 'HOOVER', 'GRUNDİG', 'SUNNY', 'ÇETİNTAŞ', 'TEKA', 'VENTİNO', 'SİMFER', 'REGAL', 'TELEFUNKEN'],
        'Küçük Ev Aletleri': ['FANTOM', 'FAKİR', 'ONVO', 'APRİLLA', 'SİNBO', 'İNOVA', 'ARÇELİK', 'CVS', 'KİWİ', 'ARZUM', 'KORKMAZ', 'PHİLİPS', 'DUBBO', 'VEVANDİN', 'SAREX', 'SUNNY', 'RANGE', 'ARNİCA', 'CONTİ', 'AKSU', 'İTİMAT', 'ALTUS', 'KİNG'],
        'Klima & Vantilatör': ['RAKS', 'İNOVA', 'ALTUS', 'REGAL'],
        'Mobilya': ['PUFFY', 'AKYOL MOBİLYA', 'SUNA SANDALYE', 'MASSA', 'HOMESET', 'BODE', 'TUTKU', 'EVONA', 'SİES', 'RAVİZZA', 'ÇINARCA', 'ASRASAN'],
        'Kişisel Bakım': ['REMİNGTON', 'APRİLLA', 'BABYLİSS', 'FAKİR', 'BRAUN', 'İNOVA', 'RAKS', 'POWERTEC'],
        'Tekstil': ['COTTONBOX', 'ALTINBAŞAK', 'TAC', 'KRİSTAL', 'HOBBY'],
        'Züccaciye': ['TAÇ', 'SCHAFER', 'AKPA', 'FALEZ', 'KORKMAZ', 'İMZA', 'TEFAL']
    };
    const saved = localStorage.getItem('dogusBrands');
    return saved ? JSON.parse(saved) : defaultBrands;
}

function saveBrands(brands) {
    localStorage.setItem('dogusBrands', JSON.stringify(brands));
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function getDashboardStats() {
    const products = getProducts();
    const customers = getCustomers();
    const orders = getOrders();
    const stock = getStock();
    const brands = getBrands();

    const totalBrands = Object.values(brands).reduce((sum, arr) => sum + arr.length, 0);
    const brandCategories = Object.keys(brands).length;

    const stockValue = stock.reduce((sum, item) => {
        const price = parseFloat((item.price || '0').toString().replace(/[₺.,]/g, '')) || 0;
        return sum + (price * (item.quantity || 0));
    }, 0);

    const storeValue = products.reduce((sum, p) => {
        const price = parseFloat((p.price || '0').toString().replace(/[₺.,]/g, '')) || 0;
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

// ─── PRODUCT CRUD ─────────────────────────────────────────────────────────────

function addProduct(productData) {
    const products = getProducts();
    const product = {
        id: 'prod_' + Date.now(),
        ...productData,
        isFeatured: productData.isFeatured || false,
        isActive: productData.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    products.push(product);
    saveProducts(products);
    
    // Site ile senkronizasyon için event dispatch
    window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products: getProducts() } 
    }));
    
    return product;
}

function updateProduct(id, productData) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...productData, updatedAt: new Date().toISOString() };
    saveProducts(products);
    
    // Site ile senkronizasyon için event dispatch
    window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products: getProducts() } 
    }));
    
    return products[idx];
}

function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    
    // Site ile senkronizasyon için event dispatch
    window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products: getProducts() } 
    }));
}

// ─── STOCK CRUD ───────────────────────────────────────────────────────────────

function addStockItem(item) {
    const stock = getStock();
    const entry = {
        id: 'stk_' + Date.now(),
        ...item,
        addedAt: new Date().toISOString()
    };
    stock.push(entry);
    saveStock(stock);
    return entry;
}

function updateStockItem(id, data) {
    const stock = getStock();
    const idx = stock.findIndex(s => s.id === id);
    if (idx === -1) return null;
    stock[idx] = { ...stock[idx], ...data };
    saveStock(stock);
    return stock[idx];
}

function deleteStockItem(id) {
    saveStock(getStock().filter(s => s.id !== id));
}

// ─── ORDER STATUS ─────────────────────────────────────────────────────────────

function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        saveOrders(orders);
    }
}

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

function getMonthlyReport(month, year) {
    const orders = getOrders();
    const products = getProducts();
    const customers = getCustomers();
    
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

function getSalesChartData(days = 30) {
    const orders = getOrders();
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
