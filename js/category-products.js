// Category Products JavaScript
// Bu dosya tüm kategori sayfaları için kullanılır
let currentProduct = {};
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 12; // Tüm kategoriler için 12 ürün

// Gallery variables
let currentImageIndex = 0;
let currentProductImages = [];

// ===== GLOBAL ÜRÜN VERİTABANI - FIREBASE'DEN YÜKLENECEK =====
window.categoryDatabase = {};

// ===== TÜM KATEGORİLER İÇİN HAFIZA =====
let allCategoriesCache = null;
let allCategoriesCacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika - Dengeli ⚡

// ===== FIREBASE'DEN ÜRÜNLERİ YÜKLE =====
async function loadProductsFromAdmin(onlyFirstPage = false) {
    try {
        // 1. ÖNCE LOCALSTORAGE KONTROL ET! (EN HIZLI!)
        const localStorageKey = 'dogus_products_cache';
        const localStorageTimeKey = 'dogus_products_cache_time';
        
        try {
            const cachedData = localStorage.getItem(localStorageKey);
            const cachedTime = localStorage.getItem(localStorageTimeKey);
            
            if (cachedData && cachedTime) {
                const age = Date.now() - parseInt(cachedTime);
                if (age < CACHE_DURATION) {
                    const ageInSeconds = Math.floor(age / 1000);
                    console.log(`⚡⚡⚡ LOCALSTORAGE CACHE (${ageInSeconds}sn önce) - SÜPER HIZLI!`);
                    const database = JSON.parse(cachedData);
                    window.categoryDatabase = database;
                    allCategoriesCache = database;
                    allCategoriesCacheTime = parseInt(cachedTime);
                    return database;
                }
            }
        } catch (localStorageError) {
            console.warn('⚠️ localStorage okuma hatası:', localStorageError);
        }
        
        // 2. RAM CACHE KONTROL ET!
        const now = Date.now();
        if (allCategoriesCache && (now - allCategoriesCacheTime) < CACHE_DURATION) {
            const age = Math.floor((now - allCategoriesCacheTime) / 1000);
            console.log(`✅ RAM CACHE (${age}sn önce - 2 SAAT GEÇERLİ) - HIZLI! ⚡⚡`);
            window.categoryDatabase = allCategoriesCache;
            return allCategoriesCache;
        }
        
        console.log(`📦 Firebase'den yükleniyor... ${onlyFirstPage ? '(Sadece ilk sayfa)' : '(Tüm ürünler)'}`);
        
        // Firebase'den ürünleri al
        const products = await getProductsFromFirebase();
        console.log(`📦 ${products.length} ürün Firebase'dan yüklendi`);
        
        // Kategorilere göre grupla
        const database = {};
        
        products.forEach(product => {
            if (!product.category || product.status !== 'active' || (product.stock || 0) <= 0) {
                return;
            }
            
            if (!database[product.category]) {
                database[product.category] = [];
            }
            
            database[product.category].push(product);
        });
        
        console.log('📊 Kategori veritabanı:', database);
        
        // RAM CACHE'E KAYDET
        allCategoriesCache = database;
        allCategoriesCacheTime = Date.now();
        console.log('💾 RAM: Tüm kategoriler hafızaya kaydedildi (2 SAAT) ⚡⚡');
        
        // LOCALSTORAGE'A DA KAYDET! (Sayfa kapatılsa bile kalır)
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(database));
            localStorage.setItem(localStorageTimeKey, Date.now().toString());
            console.log('💾 LOCALSTORAGE: Kalıcı cache kaydedildi! ⚡⚡⚡');
        } catch (localStorageError) {
            console.warn('⚠️ localStorage kaydetme hatası (QuotaExceededError olabilir):', localStorageError);
        }
        
        window.categoryDatabase = database;
        return database;
        
    } catch (error) {
        console.error('❌ Ürün yükleme hatası:', error);
        return {};
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
                    <small class="product-link" style="color: var(--success);"><i class="fas fa-whatsapp"></i> Fiyat WhatsApp'tan verilecek</small>
                </div>
                <div class="item-controls">
                    <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartItems.innerHTML = cartHTML;
    
    // TOPLAM FİYAT GÖSTERME - WhatsApp'tan verilecek
    const totalPriceEl = document.getElementById('totalPrice');
    if (totalPriceEl) {
        totalPriceEl.innerHTML = '<i class="fas fa-whatsapp"></i> Fiyat WhatsApp\'tan öğrenin';
        totalPriceEl.style.color = 'var(--success)';
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

    let message = 'Merhaba! Aşağıdaki ürünler için fiyat öğrenmek ve sipariş vermek istiyorum:\n\n';
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Adet: ${item.quantity}\n\n`;
    });

    message += 'Bu ürünler için toplam fiyat nedir?\n';
    message += 'Vade farksız taksit seçenekleri var mı?';

    const whatsappUrl = `https://wa.me/905379429437?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function showInstallmentTable() {
    // Taksit bilgisi göster - fiyat yok ama 9 aya kadar vade farksız taksit olduğunu belirt
    const modal = document.getElementById('installmentModal');
    const tableBody = document.getElementById('installmentTableBody');
    
    if (!modal || !tableBody) return;
    
    // Basit bilgilendirme tablosu - fiyatsız
    tableBody.innerHTML = `
        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <td colspan="2" style="text-align: center; padding: 2rem; font-size: 1.2rem; font-weight: 700;">
                <i class="fas fa-credit-card" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <div style="margin-bottom: 0.5rem;">9 AYA KADAR VADE FARKSIZ TAKSİT</div>
                <small style="font-size: 0.875rem; opacity: 0.9; display: block; margin-top: 0.5rem;">
                    Tüm ürünlerimizde geçerli
                </small>
            </td>
        </tr>
        <tr>
            <td style="padding: 1.5rem; text-align: center;">
                <i class="fas fa-percent" style="color: var(--success); font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                <strong style="display: block; margin-bottom: 0.25rem;">%0 FAİZ</strong>
                <small style="color: var(--text-light);">Hiçbir ek ücret yok</small>
            </td>
            <td style="padding: 1.5rem; text-align: center;">
                <i class="fas fa-calendar-alt" style="color: var(--primary); font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                <strong style="display: block; margin-bottom: 0.25rem;">9 AYA KADAR</strong>
                <small style="color: var(--text-light);">Esnek ödeme seçenekleri</small>
            </td>
        </tr>
        <tr style="background: var(--surface);">
            <td colspan="2" style="padding: 1.5rem; text-align: center;">
                <p style="margin-bottom: 1rem; color: var(--text);">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                    <strong>Ürün fiyatları ve detaylı taksit planı için:</strong>
                </p>
                <button onclick="closeInstallmentModal(); setTimeout(() => { const message = 'Merhaba, taksit seçenekleri hakkında bilgi almak istiyorum.'; window.open('https://wa.me/905379429437?text=' + encodeURIComponent(message), '_blank'); }, 300);" 
                        style="background: var(--success); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-whatsapp"></i>
                    WhatsApp'tan İletişime Geç
                </button>
            </td>
        </tr>
    `;
    
    modal.style.display = 'block';
}

function closeInstallmentModal() {
    document.getElementById('installmentModal').style.display = 'none';
}

// ===== CATEGORY PAGE INITIALIZATION - ESKİ VERSİYON SİLİNDİ =====
// Artık sadece bir initializeCategoryPage kullanıyoruz (aşağıda)

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
                        <button class="btn-offer" onclick="event.stopPropagation(); requestOffer('${product.title}')">
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
    
    // FİYAT KONTROLÜ
    const showPrice = product.showPriceToCustomer === true;
    const priceEl = document.getElementById('modalProductPrice');
    
    if (priceEl) {
        if (showPrice) {
            // Fiyat göster
            priceEl.innerHTML = product.price;
            priceEl.style.color = 'var(--accent)';
            priceEl.style.fontSize = '2rem';
            priceEl.style.fontWeight = '700';
        } else {
            // Fiyat gizle
            priceEl.innerHTML = '<i class="fas fa-whatsapp"></i> Fiyat için WhatsApp\'tan bilgi alın';
            priceEl.style.color = 'var(--success)';
            priceEl.style.fontSize = '1.1rem';
            priceEl.style.fontWeight = '600';
        }
    }
    
    const originalPriceEl = document.getElementById('modalOriginalPrice');
    if (showPrice && product.originalPrice) {
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
        // Ürün sayısını gösterme - gizli tut
        productsCount.textContent = '';
        // Parent elementi de gizle
        const parentDiv = productsCount.closest('.products-count');
        if (parentDiv) {
            parentDiv.style.display = 'none';
        }
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
    const message = `Merhaba, ${productName} ürünü için teklif almak istiyorum. Fiyat bilgisi alabilir miyim?`;
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
    console.log(`🚀 Kategori başlatılıyor: ${categorySlug}`);
    
    try {
        window.currentCategory = categorySlug;
        window.currentCategoryName = categoryName;
        
        // MOBİLYA için 12 ürün, diğerleri 12 ürün (EN BAŞTA AYARLA!)
        productsPerPage = (categorySlug === 'mobilya') ? 12 : 12;
        console.log(`📄 Sayfa başına ${productsPerPage} ürün (${categorySlug})`);
        
        // LOADİNG GÖSTER
        showLoadingState();
        
        // Ürünleri yükle
        console.log('📦 loadProductsFromAdmin çağrılıyor...');
        const database = await loadProductsFromAdmin();
        console.log('✅ Database yüklendi:', database);
        
        // Kategori mapping - Firebase'deki tüm key'leri dene
        console.log('📦 Database keys:', Object.keys(database));
        console.log(`🔍 İstenen categorySlug: "${categorySlug}"`);
        
        // Önce direkt key'i dene
        let dbKey = null;
        
        // 1. Direkt slug'ı dene
        if (database[categorySlug]) {
            dbKey = categorySlug;
        }
        // 2. Türkçe karakterli varyasyonları dene
        else {
            const possibleKeys = [
                'Mobilya', 'mobilya', 'MOBİLYA',
                'Beyaz Eşya', 'beyaz-esya', 'Beyaz Esya',
                'Küçük Ev Aletleri', 'kucuk-ev-aletleri', 'Ev Aletleri',
                'Klima & Vantilatör', 'klima-ventilator', 'Klima',
                'Kişisel Bakım', 'kisisel-bakim', 'Bakım'
            ];
            
            // Slug ile eşleşen key'i bul
            for (const key of Object.keys(database)) {
                const keyLower = key.toLowerCase().replace(/\s+/g, '-').replace(/[ğüşıöç]/g, match => {
                    const map = {'ğ':'g','ü':'u','ş':'s','ı':'i','ö':'o','ç':'c'};
                    return map[match] || match;
                });
                
                if (keyLower === categorySlug || key.toLowerCase().includes(categorySlug.replace(/-/g, ' '))) {
                    dbKey = key;
                    break;
                }
            }
        }
        
        console.log(`🔍 Bulunan dbKey: "${dbKey}"`);
        
        // Kategori ürünlerini al
        const allCategoryProducts = database[dbKey] || [];
        
        // ⚡⚡⚡ ANINDA GÖSTER: İlk 3 ürünü hemen render et!
        const instantLoadCount = 3; // İLK 3 ÜRÜN ANINDA!
        allProducts = allCategoryProducts.slice(0, instantLoadCount);
        filteredProducts = [...allProducts];
        
        console.log(`⚡⚡⚡ İLK ${allProducts.length} ÜRÜN ANINDA RENDER! (toplam: ${allCategoryProducts.length})`);
        
        // HEMEN RENDER ET!
        renderProducts();
        setupEventListeners();
        
        // Cart count güncelle
        if (typeof cartManager !== 'undefined') {
            cartManager.updateCartCount();
        }
        
        console.log('✅ İlk ürünler ekranda! ⚡⚡⚡');
        
        // ⚡ 1MS SONRA: Sayfa başına kadar olan ürünleri yükle
        setTimeout(() => {
            allProducts = allCategoryProducts.slice(0, productsPerPage);
            filteredProducts = [...allProducts];
            renderProducts();
            console.log(`⚡ ${allProducts.length} ürün yüklendi (1. sayfa)`);
        }, 1);
        
        // ⚡ 10MS SONRA: Tüm ürünleri yükle
        setTimeout(() => {
            console.log('📦 Arka plan: Tüm ürünler yükleniyor...');
            allProducts = allCategoryProducts;
            filteredProducts = [...allProducts];
            console.log(`✅ Tüm ${allProducts.length} ürün hazır!`);
            
            // Sayfalama butonlarını güncelle
            updatePagination();
        }, 10);
        
        console.log('✅ Kategori sayfası başlatıldı!');
        
    } catch (error) {
        console.error('❌ initializeCategoryPage hatası:', error);
        console.error('❌ Hata mesajı:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff3cd; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #856404; margin-bottom: 1rem;"></i>
                    <p style="color: #856404; font-size: 1.2rem;">Sayfa yüklenirken hata oluştu</p>
                    <small style="color: #856404;">Hata: ${error.message}</small><br>
                    <small style="color: #856404;">Lütfen sayfayı yenileyin (F5)</small>
                </div>
            `;
        }
    }
}

window.initializeCategoryPage = initializeCategoryPage;


// ===== LOADİNG GÖSTER =====
function showLoadingState() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    // ⚡ SKELETON CARDS - Kullanıcı hemen içerik görür!
    const skeletonHTML = `
        <style>
            .skeleton-card {
                background: white;
                border-radius: 12px;
                padding: 1rem;
                animation: skeleton-pulse 1.5s ease-in-out infinite;
            }
            @keyframes skeleton-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .skeleton-image {
                width: 100%;
                height: 200px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s ease-in-out infinite;
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .skeleton-text {
                height: 20px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s ease-in-out infinite;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            .skeleton-text-short {
                width: 60%;
            }
        </style>
    `;
    
    // 6 adet skeleton card göster
    let cards = '';
    for (let i = 0; i < 6; i++) {
        cards += `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text skeleton-text-short"></div>
            </div>
        `;
    }
    
    grid.innerHTML = skeletonHTML + cards;
}

// ===== ÜRÜN RENDER FONKSİYONU =====
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const productsCount = document.getElementById('productsCount');
    
    if (!grid) return;
    
    console.log(`🎨 ${filteredProducts.length} ürün render ediliyor`);
    
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
    
    console.log(`📄 Sayfa: ${currentPage}/${totalPages}, Gösterilecek: ${pageProducts.length} ürün`);
    console.log(`📦 İlk ürün:`, pageProducts[0]);
    
    // Ürün sayısını güncelle (GİZLİ - gösterme)
    if (productsCount) {
        productsCount.textContent = '';
        const parentDiv = productsCount.closest('.products-count');
        if (parentDiv) {
            parentDiv.style.display = 'none';
        }
    }
    
    // Ürünleri render et
    if (pageProducts.length === 0) {
        console.warn('⚠️ pageProducts boş!');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-box-open" style="font-size: 3rem; color: #999; margin-bottom: 1rem;"></i>
                <p style="color: #666;">Bu sayfada ürün yok</p>
            </div>
        `;
        return;
    }
    
    // LAZY LOADING: Sadece bu sayfadaki ürünlerin HTML'ini oluştur
    grid.innerHTML = pageProducts.map(product => {
        const mainImage = product.images && product.images[0] 
            ? product.images[0] 
            : (product.image || 'https://via.placeholder.com/400x300?text=Ürün');
        
        // FİYAT KONTROLÜ
        const showPrice = product.showPriceToCustomer === true;
        
        let priceHtml = '';
        if (showPrice) {
            priceHtml = `
                <div class="product-price-section">
                    ${product.originalPrice ? `<span class="product-price-old">${product.originalPrice}</span>` : ''}
                    <span class="product-price">${product.price}</span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="product-price-section" style="height: 2rem;"></div>
            `;
        }
        
        return `
            <div class="product-card" onclick='showProductModal("${product.id}")'>
                <div class="product-image">
                    <img data-src="${mainImage}" alt="${product.title}" class="lazy-img" 
                         src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%23f9fafb' width='300' height='200'/%3E%3C/svg%3E"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/e5e7eb/999999?text=Ürün+Resmi'; console.warn('Görsel yüklenemedi:', '${mainImage}');"
                         style="width: 100%; height: auto; display: block;">
                    ${product.isFeatured ? '<span class="badge badge-featured">ÖNE ÇIKAN</span>' : ''}
                    ${product.originalPrice && showPrice ? '<span class="badge badge-discount">İNDİRİM</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-meta">
                        <span class="product-brand">${product.brand || 'Marka'}</span>
                        ${product.stock > 0 ? `<span class="product-stock">Stokta</span>` : '<span class="product-stock out-of-stock">Stokta Yok</span>'}
                    </div>
                    ${priceHtml}
                    <div class="product-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button onclick="event.stopPropagation(); addToCart('${product.title.replace(/'/g, "\\'")}', '${showPrice ? product.price : "Fiyat WhatsApp\\'tan verilecek"}')" style="flex: 1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fas fa-shopping-cart"></i>
                            Sepete Ekle
                        </button>
                        <button onclick="event.stopPropagation(); requestOffer('${product.title.replace(/'/g, "\\'")}', '${showPrice ? product.price : ""}')" style="flex: 1; padding: 0.75rem; background: var(--success); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fas fa-comment-dollar"></i>
                            ${showPrice ? 'Teklif Al' : 'Fiyat Bilgisi Al'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ ${pageProducts.length} ürün kartı oluşturuldu`);
    
    // INTERSECTION OBSERVER - Sadece görünen resimleri yükle
    initLazyLoading();
    
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
window.showProductModal = showProductModal;
window.closeModal = closeModal;
window.updateCartCount = function() { cartManager.updateCartCount(); };

// ===== LAZY LOADING OBSERVER =====
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-img');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        // Yeni image objesi oluştur (pre-load)
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            img.src = src;
                            img.classList.remove('lazy-img');
                            img.classList.add('loaded');
                            console.log('✅ Görsel yüklendi:', src.substring(0, 50));
                        };
                        tempImg.onerror = () => {
                            console.warn('❌ Görsel yüklenemedi:', src);
                            img.src = 'https://via.placeholder.com/300x200/e5e7eb/999999?text=Ürün+Resmi';
                            img.classList.remove('lazy-img');
                        };
                        tempImg.src = src;
                        
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '150px' // 150px önceden yükle
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
        console.log(`🎨 ${lazyImages.length} resim için lazy loading aktif`);
    } else {
        // Fallback: IntersectionObserver yoksa hepsini yükle
        lazyImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.classList.remove('lazy-img');
            }
        });
        console.log(`📷 ${lazyImages.length} resim yüklendi (fallback)`);
    }
}

// Sepete ekle fonksiyonu (inline button için)
window.addToCart = function(productName, price) {
    try {
        const success = cartManager.addItem(productName, price, 1);
        
        if (success) {
            showNotification(`${productName} sepete eklendi!`, 'success');
            cartManager.updateCartCount();
        } else {
            showNotification('Sepete ekleme başarısız!', 'error');
        }
    } catch (error) {
        console.error('❌ Sepete ekleme hatası:', error);
        showNotification('Sepete ekleme sırasında hata oluştu!', 'error');
    }
};

// Teklif al fonksiyonu
window.requestOffer = function(productName, price) {
    const message = price 
        ? `Merhaba, ${productName} (${price}) ürünü için teklif almak istiyorum. Daha uygun bir fiyat verebilir misiniz?`
        : `Merhaba, ${productName} ürünü için fiyat bilgisi almak istiyorum. En uygun fiyat nedir? Taksit seçenekleri var mı?`;
    const whatsappUrl = `https://wa.me/905379429437?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
};

// ===== OTOMATİK SAĞDIRMA SİSTEMİ - GEÇİCİ OLARAK KAPALI =====
function autoResizeProductImages() {
    console.log('🔄 Otomatik sığdırma geçici olarak devre dışı - CSS kontrol ediyor');
    
    // JavaScript boyut ayarını devre dışı bırak
    // CSS'teki 95% x 98% değerleri kullanılacak
    return;
    
    const productImages = document.querySelectorAll('.product-card .product-image img');
    
    productImages.forEach((img, index) => {
        img.onload = function() {
            const container = this.parentElement;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            
            // Görsel orijinal boyutları
            const imgWidth = this.naturalWidth;
            const imgHeight = this.naturalHeight;
            
            // Aspect ratio hesapla
            const imgRatio = imgWidth / imgHeight;
            const containerRatio = containerWidth / containerHeight;
            
            console.log(`📐 Ürün ${index}: ${imgWidth}x${imgHeight} (ratio: ${imgRatio.toFixed(2)})`);
            
            // Uzun ürünler için (yükseklik > genişlik)
            if (imgRatio < 0.8) { // Uzun ürün (çamaşır makinesi, buzdolabı)
                this.style.width = '75% !important';
                this.style.height = '98% !important';
                console.log(`✅ Uzun ürün: ${this.alt} - 75% x 98%`);
            }
            // Geniş ürünler için (genişlik > yükseklik) 
            else if (imgRatio > 1.5) { // Geniş ürün (TV, monitor)
                this.style.width = '95% !important';
                this.style.height = '85% !important';
                console.log(`✅ Geniş ürün: ${this.alt} - 95% x 85%`);
            }
            // Kare ürünler için
            else { // Normal ürün
                this.style.width = '90% !important';
                this.style.height = '95% !important';
                console.log(`✅ Normal ürün: ${this.alt} - 90% x 95%`);
            }
            
            // Zorla uygula
            this.style.objectFit = 'contain';
            this.style.objectPosition = 'center';
        };
        
        // Eğer görsel zaten yüklüyse
        if (img.complete) {
            img.onload();
        }
    });
}

// Sayfa yüklendiğinde ve ürünler render edildiğinde çalıştır
document.addEventListener('DOMContentLoaded', autoResizeProductImages);

// renderProducts fonksiyonundan sonra da çalıştır
const originalRenderProducts = window.renderProducts;
if (originalRenderProducts) {
    window.renderProducts = function() {
        originalRenderProducts();
        setTimeout(autoResizeProductImages, 500); // 500ms sonra çalıştır
    };
}