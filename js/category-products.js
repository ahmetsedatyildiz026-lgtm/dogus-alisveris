// Category Products JavaScript
// Bu dosya tüm kategori sayfaları için kullanılır
// ===== SAHTE ÜRÜNLER KALDIRILDI - SADECE ADMİN PANELDEKİ GERÇEK ÜRÜNLER GÖSTERİLİYOR =====

let currentProduct = {};
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;

// Gallery variables
let currentImageIndex = 0;
let currentProductImages = [];

// Boş kategori veritabanı - Admin'den doldurulacak
const categoryDatabase = {};

// ===== ADMİN PANELDEKİ ÜRÜNLERİ YÜKLE (Firebase'den + CACHE) =====

// Cache
let categoryProductsCache = null;
let categoryCacheTimestamp = 0;
const CATEGORY_CACHE_DURATION = 5000; // 5 saniye - HIZLI GÜNCELLEME!

async function loadProductsFromAdmin(forceRefresh = false) {
    try {
        // Cache kontrolü - hız için (5 saniye)
        if (!forceRefresh && categoryProductsCache && (Date.now() - categoryCacheTimestamp < CATEGORY_CACHE_DURATION)) {
            console.log('📦 Ürünler cache\'den yüklendi (hızlı)');
            return categoryProductsCache;
        }
        
        console.log('🔄 Ürünler yükleniyor...');
        
        // LocalStorage'dan oku (ÖNCE LocalStorage - HIZLI!)
        let allProducts = JSON.parse(localStorage.getItem('dogusProducts') || '[]');
        console.log(`📦 ${allProducts.length} ürün LocalStorage'dan yüklendi`);
        
        // Firebase'den de oku (opsiyonel, birleştir)
        try {
            if (typeof db !== 'undefined' && db) {
                console.log('🔥 Firebase\'den de ürünler yükleniyor...');
                const snapshot = await db.collection('products')
                    .where('status', '==', 'active')
                    .get({ source: 'cache' })
                    .catch(() => db.collection('products')
                        .where('status', '==', 'active')
                        .get({ source: 'server' })
                    );
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if ((data.stock || 0) > 0) {
                        // Duplicate kontrolü
                        if (!allProducts.find(p => p.id === doc.id)) {
                            allProducts.push({ id: doc.id, ...data });
                        }
                    }
                });
                console.log(`🔥 Firebase ile toplam ${allProducts.length} ürün`);
            }
        } catch (fbError) {
            console.warn('⚠️ Firebase okuma hatası (LocalStorage çalışıyor):', fbError);
        }
        
        const database = {};
        
        // Kategorilere göre grupla (sadece aktif ve stokta olanlar)
        allProducts.forEach(product => {
            if (!product.category) return;
            if (product.status !== 'active') return; // Sadece aktif ürünler
            if ((product.stock || 0) <= 0) return; // Sadece stokta olanlar
            
            if (!database[product.category]) {
                database[product.category] = [];
            }
            
            database[product.category].push(product);
        });
        
        console.log('📊 Kategorilere göre ürünler:', Object.keys(database).map(k => `${k}: ${database[k].length}`));
        
        // Cache'i güncelle
        categoryProductsCache = database;
        categoryCacheTimestamp = Date.now();
        
        return database;
        
    } catch (error) {
        console.error('❌ Ürünler yüklenemedi:', error);
        return categoryProductsCache || {};
    }
}

// ===== PROFESSIONAL CART SYSTEM FOR CATEGORY PAGES =====

// Global sepet yöneticisi - Ana sayfa ile uyumlu
class CartManager {
    constructor() {
        this.storageKey = 'dogusSepet';
        this.initializeCart();
    }

    initializeCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                localStorage.setItem(this.storageKey, JSON.stringify([]));
            }
        } catch (error) {
            console.error('Sepet başlatma hatası:', error);
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    getCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (error) {
            console.error('Sepet okuma hatası:', error);
            return [];
        }
    }

    saveCart(cart) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
            this.updateCartCount();
            
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('cartUpdated', { 
                    detail: { cart: cart, total: this.getTotalItems() }
                }));
            }
            
            return true;
        } catch (error) {
            console.error('Sepet kaydetme hatası:', error);
            return false;
        }
    }

    addItem(name, price, quantity = 1) {
        try {
            const cart = this.getCart();
            const existingItem = cart.find(item => item.name === name);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                const newItem = {
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: name,
                    price: price,
                    quantity: quantity
                };
                cart.push(newItem);
            }
            
            return this.saveCart(cart);
        } catch (error) {
            console.error('❌ Sepete ekleme hatası:', error);
            return false;
        }
    }

    updateQuantity(itemId, newQuantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === itemId);
        
        if (item) {
            if (newQuantity <= 0) {
                return this.removeItem(itemId);
            } else {
                item.quantity = newQuantity;
                return this.saveCart(cart);
            }
        }
        return false;
    }

    removeItem(itemId) {
        const cart = this.getCart();
        const newCart = cart.filter(item => item.id !== itemId);
        return this.saveCart(newCart);
    }

    getTotalItems() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    getTotalPrice() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
            return total + (price * item.quantity);
        }, 0);
    }

    updateCartCount() {
        try {
            const countEl = document.getElementById('cartCount');
            const totalItems = this.getTotalItems();
            
            if (countEl) {
                countEl.textContent = totalItems;
                
                // Görsel feedback - kısa animasyon
                countEl.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    countEl.style.transform = 'scale(1)';
                }, 200);
            }
        } catch (error) {
            console.error('❌ Sepet sayısı güncellenemedi:', error);
        }
    }
}

// Global cart instance
const cartManager = new CartManager();

// Sepete ekle fonksiyonu - Optimize edilmiş
function addToCart(productName) {
    let price = '₺0';
    
    // 1. Modal'dan fiyat al
    if (typeof currentProduct !== 'undefined' && currentProduct && currentProduct.title === productName) {
        price = currentProduct.price;
    } else {
        // 2. DOM'dan fiyat ara
        const productCards = document.querySelectorAll('.product-card');
        for (const card of productCards) {
            const titleEl = card.querySelector('.product-title');
            if (titleEl && titleEl.textContent.trim() === productName) {
                const priceEl = card.querySelector('.product-price');
                if (priceEl) {
                    price = priceEl.textContent.trim();
                    break;
                }
            }
        }
    }

    // 3. Fiyat kontrolü
    if (price === '₺0') {
        console.error('❌ Ürün fiyatı bulunamadı:', productName);
        showNotification('Ürün fiyatı bulunamadı!', 'error');
        return;
    }

    // 4. Sepete ekle
    try {
        const success = cartManager.addItem(productName, price, 1);
        
        if (success) {
            // 5. Buton animasyonu
            if (window.event && window.event.target) {
                const btn = window.event.target;
                const originalText = btn.textContent;
                const originalBg = btn.style.backgroundColor || '';
                
                btn.style.backgroundColor = '#10B981';
                btn.textContent = 'Eklendi!';
                btn.disabled = true;
                
                setTimeout(() => {
                    btn.style.backgroundColor = originalBg;
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);
            }
            
            showNotification(`${productName} sepete eklendi!`, 'success');
        } else {
            showNotification('Sepete ekleme başarısız!', 'error');
        }
    } catch (error) {
        console.error('❌ Sepete ekleme hatası:', error);
        showNotification('Sepete ekleme sırasında hata oluştu!', 'error');
    }
}

// Sepet modal fonksiyonları
function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        updateCartDisplay();
    }
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.style.display = 'none';
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItems) return;

    const cart = cartManager.getCart();

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Sepetiniz boş</p>
                <small>Ürün eklemek için kategori sayfalarını ziyaret edin</small>
            </div>
        `;
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }

    if (cartSummary) cartSummary.style.display = 'block';

    let cartHTML = '';
    cart.forEach(item => {
        const priceNum = parseFloat(item.price.replace('₺', '').replace(/\./g, ''));
        const itemTotal = priceNum * item.quantity;

        cartHTML += `
            <div class="cart-item">
                <div class="item-info" onclick="goToProduct('${item.name}')" style="cursor: pointer;">
                    <h4>${item.name}</h4>
                    <span class="item-price">${item.price}</span>
                    <small class="product-link">Ürün detayını gör</small>
                </div>
                <div class="item-controls">
                    <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-total">₺${itemTotal.toLocaleString('tr-TR')}</div>
            </div>
        `;
    });

    cartItems.innerHTML = cartHTML;
    
    const totalPriceEl = document.getElementById('totalPrice');
    if (totalPriceEl) {
        totalPriceEl.textContent = `₺${cartManager.getTotalPrice().toLocaleString('tr-TR')}`;
    }
}

function goToProduct(productName) {
    closeCart();
    
    const productCards = document.querySelectorAll('.product-card');
    for (const card of productCards) {
        const titleEl = card.querySelector('.product-title');
        if (titleEl && titleEl.textContent.trim() === productName) {
            card.click();
            return;
        }
    }
    
    window.location.href = 'index.html';
}

function updateQuantity(itemId, newQuantity) {
    cartManager.updateQuantity(itemId, newQuantity);
    updateCartDisplay();
}

function removeFromCart(itemId) {
    cartManager.removeItem(itemId);
    updateCartDisplay();
}

function sendWhatsAppOrder() {
    const cart = cartManager.getCart();
    
    if (cart.length === 0) {
        showNotification('Sepetinizde ürün bulunmuyor!', 'error');
        return;
    }

    let message = 'Merhaba! Aşağıdaki ürünler için sipariş vermek istiyorum:\n\n';
    
    cart.forEach((item, index) => {
        const priceNum = parseFloat(item.price.replace('₺', '').replace(/\./g, ''));
        const itemTotal = priceNum * item.quantity;

        message += `${index + 1}. ${item.name}\n`;
        message += `   Adet: ${item.quantity}\n`;
        message += `   Birim Fiyat: ${item.price}\n`;
        message += `   Toplam: ₺${itemTotal.toLocaleString('tr-TR')}\n\n`;
    });

    message += `GENEL TOPLAM: ₺${cartManager.getTotalPrice().toLocaleString('tr-TR')}\n\n`;
    message += 'Vade farksız taksit seçenekleri ve ödeme detayları için bilgi verebilir misiniz?';

    const whatsappUrl = `https://wa.me/905379429437?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function showInstallmentTable() {
    const totalPrice = cartManager.getTotalPrice();

    if (totalPrice === 0) {
        showNotification('Sepetinizde ürün bulunmuyor!', 'error');
        return;
    }

    const tableBody = document.getElementById('installmentTableBody');
    if (!tableBody) return;
    
    let tableHTML = '';
    let maxMonths = totalPrice <= 5000 ? 6 : 9;

    console.log(`Sepet toplamı: ${totalPrice} TL, Max taksit: ${maxMonths} ay`);

    for (let month = 1; month <= maxMonths; month++) {
        const monthlyPayment = totalPrice / month;
        
        tableHTML += `
            <tr ${month <= 3 ? 'class="recommended"' : ''}>
                <td>${month} Ay ${month <= 3 ? '<span class="badge">Önerilen</span>' : ''}</td>
                <td>₺${monthlyPayment.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td>₺${totalPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td class="no-interest">%0 Faiz</td>
            </tr>
        `;
    }

    tableBody.innerHTML = tableHTML;
    
    const modalTitle = document.querySelector('#installmentModal .modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = `Taksit Seçenekleri (₺${totalPrice.toLocaleString('tr-TR')} - ${maxMonths} Aya Kadar)`;
    }
    
    document.getElementById('installmentModal').style.display = 'block';
}

function closeInstallmentModal() {
    document.getElementById('installmentModal').style.display = 'none';
}

// ===== CATEGORY PAGE INITIALIZATION WITH REAL-TIME =====

async function initializeCategoryPage(categoryName, categoryTitle) {
    // İlk yükleme
    const adminDatabase = await loadProductsFromAdmin(true);
    Object.assign(categoryDatabase, adminDatabase);
    
    loadCategoryProducts(categoryName);
    cartManager.updateCartCount();
    setupEventListeners();
    
    // REAL-TIME LISTENER - Sessiz güncelleme
    if (db) {
        db.collection('products')
            .where('status', '==', 'active')
            .onSnapshot((snapshot) => {
                const products = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if ((data.stock || 0) > 0) {
                        products.push({ id: doc.id, ...data });
                    }
                });
                
                // categoryDatabase'i güncelle
                const newDatabase = {};
                products.forEach(product => {
                    if (!product.category) return;
                    
                    if (!newDatabase[product.category]) {
                        newDatabase[product.category] = [];
                    }
                    
                    newDatabase[product.category].push(product);
                });
                
                Object.assign(categoryDatabase, newDatabase);
                
                // Cache güncelle
                categoryProductsCache = newDatabase;
                categoryCacheTimestamp = Date.now();
                
                // Sayfayı sessizce yeniden yükle
                loadCategoryProducts(categoryName);
            }, (error) => {
                console.error('❌ Real-time listener hatası:', error);
            });
    }
}

function loadCategoryProducts(categoryName) {
    const productsGrid = document.getElementById('productsGrid');
    const productsCount = document.getElementById('productsCount');
    
    // Kategori mapping
    const categoryMapping = {
        'beyaz-esya': ['Beyaz Eşya', 'beyaz-esya'],
        'mobilya': ['Mobilya', 'mobilya'],
        'kucuk-ev-aletleri': ['Küçük Ev Aletleri', 'kucuk-ev-aletleri', 'Ev Aletleri'],
        'klima-ventilator': ['Klima & Vantilatör', 'klima-ventilator', 'Klima', 'Klima&Vantilatör'],
        'kisisel-bakim': ['Kişisel Bakım', 'kisisel-bakim', 'Bakım']
    };
    
    if (!productsGrid) {
        console.error('Products grid bulunamadı');
        return;
    }
    
    // Ürünleri bul
    let products = [];
    const possibleNames = categoryMapping[categoryName] || [categoryName];
    
    for (const name of possibleNames) {
        if (categoryDatabase[name]) {
            products = categoryDatabase[name];
            break;
        }
    }
    
    // Son çare: tüm kategorilerde ara
    if (products.length === 0) {
        Object.keys(categoryDatabase).forEach(cat => {
            if (possibleNames.some(name => cat.toLowerCase().includes(name.toLowerCase()))) {
                products = products.concat(categoryDatabase[cat]);
            }
        });
    }
    
    allProducts = products;
    filteredProducts = [...allProducts];
    
    updateProductsCount();
    
    // Arama ve sıralamayı sıfırla
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'default';
    
    renderProducts();
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (pageProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>Ürün bulunamadı</h3>
                <p>Bu kategoride henüz ürün bulunmuyor veya arama kriterlerinize uygun ürün yok.</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '';
    
    pageProducts.forEach(product => {
        let discountHtml = '';
        if (product.originalPrice) {
            const current = parseFloat(product.price.replace('₺', '').replace(/\./g, ''));
            const original = parseFloat(product.originalPrice.replace('₺', '').replace(/\./g, ''));
            const discount = Math.round(((original - current) / original) * 100);
            
            if (discount > 0) {
                discountHtml = `<div class="discount-badge">%${discount} İNDİRİM</div>`;
            }
        }
        
        productsHTML += `
            <div class="product-card" onclick="showProductModal('${product.id}')">
                ${discountHtml}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size: 3rem; color: var(--secondary);\\'></i>';">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price-section">
                        ${product.originalPrice ? `<div class="original-price">${product.originalPrice}</div>` : ''}
                        <div class="product-price">${product.price}</div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product.title}')">
                            <i class="fas fa-cart-plus"></i> Sepete Ekle
                        </button>
                        <button class="btn-offer" onclick="event.stopPropagation(); requestOffer('${product.title}', '${product.price}')">
                            <i class="fas fa-comment-dollar"></i> Teklif Al
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsGrid.innerHTML = productsHTML;
    updatePagination();
}

function showProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    currentProductImages = product.images || [product.image];
    currentImageIndex = 0;
    
    document.getElementById('modalTitle').textContent = product.title;
    document.getElementById('modalProductTitle').textContent = product.title;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductPrice').textContent = product.price;
    
    const originalPriceEl = document.getElementById('modalOriginalPrice');
    if (product.originalPrice) {
        originalPriceEl.textContent = product.originalPrice;
        originalPriceEl.style.display = 'block';
    } else {
        originalPriceEl.style.display = 'none';
    }
    
    if (product.specifications) {
        const specsEl = document.getElementById('modalProductSpecs');
        let specsHTML = '<h4>Ürün Özellikleri</h4><ul class="product-specs-list">';
        
        Object.entries(product.specifications).forEach(([key, value]) => {
            specsHTML += `<li><strong>${key}:</strong> ${value}</li>`;
        });
        
        specsHTML += '</ul>';
        specsEl.innerHTML = specsHTML;
    }
    
    loadProductGallery();
    document.getElementById('productModal').style.display = 'block';
}

function loadProductGallery() {
    const mainImage = document.getElementById('modalMainImage');
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    const indicatorsContainer = document.getElementById('galleryIndicators');
    
    mainImage.src = currentProductImages[currentImageIndex];
    mainImage.alt = currentProduct.title;
    
    thumbnailsContainer.innerHTML = '';
    currentProductImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `gallery-thumbnail ${index === currentImageIndex ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${image}" alt="${currentProduct.title} - Fotoğraf ${index + 1}">`;
        thumbnail.onclick = () => goToImage(index);
        thumbnailsContainer.appendChild(thumbnail);
    });
    
    indicatorsContainer.innerHTML = '';
    currentProductImages.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `gallery-indicator ${index === currentImageIndex ? 'active' : ''}`;
        indicator.onclick = () => goToImage(index);
        indicatorsContainer.appendChild(indicator);
    });
}

function goToImage(index) {
    currentImageIndex = index;
    loadProductGallery();
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentProductImages.length;
    loadProductGallery();
}

function previousImage() {
    currentImageIndex = (currentImageIndex - 1 + currentProductImages.length) % currentProductImages.length;
    loadProductGallery();
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginationEl = document.getElementById('pagination');
    
    if (!paginationEl || totalPages <= 1) {
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationEl.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProductsCount() {
    const productsCount = document.getElementById('productsCount');
    if (productsCount) {
        productsCount.textContent = filteredProducts.length;
    }
}

function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => {
            const titleMatch = product.title.toLowerCase().includes(searchTerm);
            const descMatch = product.description.toLowerCase().includes(searchTerm);
            
            // Spesifikasyonlarda arama
            let specMatch = false;
            if (product.specifications) {
                specMatch = Object.values(product.specifications).some(spec => 
                    spec.toLowerCase().includes(searchTerm)
                );
            }
            
            return titleMatch || descMatch || specMatch;
        });
    }
    
    updateProductsCount();
    currentPage = 1;
    renderProducts();
}

function sortProducts() {
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect.value;
    
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                const priceB = parseFloat(b.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                return priceA - priceB;
            });
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                const priceB = parseFloat(b.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                return priceB - priceA;
            });
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
            break;
        default:
            // Varsayılan - orijinal sıraya dön
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            
            if (searchTerm === '') {
                filteredProducts = [...allProducts];
            } else {
                searchProducts();
                return;
            }
            break;
    }
    
    currentPage = 1;
    renderProducts();
}

function requestOffer(productName, price) {
    const message = `Merhaba, ${productName} (${price}) ürünü için teklif almak istiyorum. Daha uygun bir fiyat verebilir misiniz?`;
    const whatsappUrl = `https://wa.me/905379429437?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function setupEventListeners() {
    window.onclick = function(event) {
        const productModal = document.getElementById('productModal');
        const cartModal = document.getElementById('cartModal');
        const installmentModal = document.getElementById('installmentModal');
        
        if (event.target === productModal) {
            closeModal();
        } else if (event.target === cartModal) {
            closeCart();
        } else if (event.target === installmentModal) {
            closeInstallmentModal();
        }
    }
    
    document.addEventListener('keydown', function(e) {
        const productModal = document.getElementById('productModal');
        if (productModal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                previousImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'secondary'});
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}


// ===== SAYFA BAŞLATMA FONKSİYONU =====
async function initializeCategoryPage(categorySlug, categoryName) {
    console.log(`🚀 initializeCategoryPage çağrıldı: ${categorySlug}`);
    
    try {
        // Global kategori bilgisini sakla
        window.currentCategory = categorySlug;
        window.currentCategoryName = categoryName;
        
        // Ürünleri yükle
        console.log('📦 Ürünler yükleniyor...');
        const database = await loadProductsFromAdmin(true); // Force refresh
        
        console.log('📊 Yüklenen database:', database);
        console.log(`📦 ${categorySlug} kategorisinde ${(database[categorySlug] || []).length} ürün var`);
        
        // Kategori ürünlerini global değişkene ata
        allProducts = database[categorySlug] || [];
        filteredProducts = [...allProducts];
        
        console.log(`✅ ${allProducts.length} ürün kategoriye yüklendi`);
        
        // Ürünleri render et
        renderProducts();
        setupEventListeners();
        updateCartCount();
        
        console.log('✅ Kategori sayfası başlatıldı!');
        
    } catch (error) {
        console.error('❌ Kategori başlatma hatası:', error);
        
        // Hata durumunda boş mesaj göster
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <p style="color: #1a1a1a; font-size: 1.2rem; margin-bottom: 0.5rem;">Ürünler yüklenirken hata oluştu</p>
                    <small style="color: #666;">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin</small>
                </div>
            `;
        }
    }
}

// Global scope'a ekle
window.initializeCategoryPage = initializeCategoryPage;


// ===== ÜRÜN RENDER FONKSİYONU =====
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const productsCount = document.getElementById('productsCount');
    
    if (!grid) {
        console.error('❌ productsGrid elementi bulunamadı!');
        return;
    }
    
    console.log(`🎨 renderProducts: ${filteredProducts.length} ürün render ediliyor`);
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-box-open" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-light); font-size: 1.2rem;">Bu kategoride henüz ürün yok</p>
                <small style="color: var(--text-light);">Admin panelden ürün ekleyebilirsiniz</small>
            </div>
        `;
        if (pagination) pagination.innerHTML = '';
        if (productsCount) productsCount.textContent = '0';
        return;
    }
    
    // Sayfalama hesapla
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Ürün sayısını güncelle
    if (productsCount) {
        productsCount.textContent = filteredProducts.length;
    }
    
    // Ürünleri render et
    grid.innerHTML = pageProducts.map(product => {
        const mainImage = product.images && product.images[0] 
            ? product.images[0] 
            : (product.image || 'https://via.placeholder.com/400x300?text=Ürün');
        
        return `
            <div class="product-card" onclick='showProductDetail(${JSON.stringify(product).replace(/'/g, "&#39;")})'>
                <div class="product-image">
                    <img src="${mainImage}" alt="${product.title}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/400x300?text=Ürün'">
                    ${product.isFeatured ? '<span class="badge badge-featured">ÖNE ÇIKAN</span>' : ''}
                    ${product.originalPrice ? '<span class="badge badge-discount">İNDİRİM</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-meta">
                        <span class="product-brand">${product.brand || 'Marka'}</span>
                        ${product.stock > 0 ? `<span class="product-stock">Stokta ${product.stock} adet</span>` : '<span class="product-stock out-of-stock">Stokta Yok</span>'}
                    </div>
                    <div class="product-price-section">
                        ${product.originalPrice ? `<span class="product-price-old">${product.originalPrice}</span>` : ''}
                        <span class="product-price">${product.price}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Sayfalama render et
    if (pagination && totalPages > 1) {
        let paginationHTML = '';
        
        // Önceki butonu
        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
        }
        
        // Sayfa numaraları
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<button class="pagination-btn active">${i}</button>`;
            } else if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `<button class="pagination-btn" onclick="changePage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }
        
        // Sonraki butonu
        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        }
        
        pagination.innerHTML = paginationHTML;
    } else if (pagination) {
        pagination.innerHTML = '';
    }
    
    console.log(`✅ ${pageProducts.length} ürün render edildi (Sayfa ${currentPage}/${totalPages})`);
}

// Sayfa değiştirme
function changePage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Arama
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Sıralama
function sortProducts() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    
    const sortValue = sortSelect.value;
    
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace(/[₺.,]/g, '')) || 0;
                const priceB = parseFloat(b.price.replace(/[₺.,]/g, '')) || 0;
                return priceA - priceB;
            });
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace(/[₺.,]/g, '')) || 0;
                const priceB = parseFloat(b.price.replace(/[₺.,]/g, '')) || 0;
                return priceB - priceA;
            });
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
            break;
        default:
            filteredProducts = [...allProducts];
            break;
    }
    
    currentPage = 1;
    renderProducts();
}

// Global scope'a ekle
window.renderProducts = renderProducts;
window.changePage = changePage;
window.searchProducts = searchProducts;
window.sortProducts = sortProducts;
