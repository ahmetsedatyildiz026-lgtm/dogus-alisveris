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

// ===== ADMİN PANELDEKİ ÜRÜNLERİ YÜKLE (Firebase'den) =====
async function loadProductsFromAdmin() {
    try {
        console.log('🔥 Ürünler Firebase\'den yükleniyor...');
        
        // Firebase kontrolü
        if (!db) {
            console.error('❌ Firebase bağlantısı yok!');
            return {};
        }
        
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ Firebase'den ${products.length} ürün yüklendi`);
        
        const database = {};
        
        // Kategorilere göre grupla
        products.forEach(product => {
            if (!product.category) return;
            
            if (!database[product.category]) {
                database[product.category] = [];
            }
            
            // Sadece aktif ve stokta olan ürünleri göster
            if (product.status === 'active' && (product.stock || 0) > 0) {
                database[product.category].push(product);
            }
        });
        
        Object.keys(database).forEach(cat => {
            console.log(`  - ${cat}: ${database[cat].length} ürün`);
        });
        
        return database;
        
    } catch (error) {
        console.error('❌ Ürünler yüklenemedi:', error);
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
                console.log('Yeni sepet oluşturuldu');
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
        console.log('🛒 CartManager.addItem başladı');
        console.log('📦 Parametreler:', { name, price, quantity });
        
        try {
            const cart = this.getCart();
            console.log('📋 Mevcut sepet:', cart);
            console.log('📊 Sepet tipi:', Array.isArray(cart), 'Uzunluk:', cart.length);
            
            const existingItem = cart.find(item => item.name === name);
            
            if (existingItem) {
                console.log('♻️ Mevcut ürün bulundu:', existingItem);
                existingItem.quantity += quantity;
                console.log('♻️ Ürün miktarı güncellendi:', existingItem);
            } else {
                const newItem = {
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: name,
                    price: price,
                    quantity: quantity
                };
                cart.push(newItem);
                console.log('✨ Yeni ürün eklendi:', newItem);
            }
            
            console.log('💾 Sepet kaydediliyor...');
            const success = this.saveCart(cart);
            console.log('💾 Kaydetme sonucu:', success);
            
            if (success) {
                const newCart = this.getCart();
                console.log('✅ Kaydetme sonrası sepet:', newCart);
                console.log('🔢 Toplam item sayısı:', this.getTotalItems());
            }
            
            return success;
        } catch (error) {
            console.error('❌ CartManager.addItem hatası:', error);
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
            
            console.log('🔄 Sepet sayısı güncelleniyor...');
            console.log('📊 Toplam item:', totalItems);
            console.log('🎯 Count element:', countEl);
            
            if (countEl) {
                countEl.textContent = totalItems;
                console.log('✅ Sepet sayısı DOM\'da güncellendi:', totalItems);
                
                // Görsel feedback için kısa animasyon
                countEl.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    countEl.style.transform = 'scale(1)';
                }, 200);
            } else {
                console.warn('⚠️ cartCount elementi bulunamadı!');
            }
        } catch (error) {
            console.error('❌ updateCartCount hatası:', error);
        }
    }
}

// Global cart instance
const cartManager = new CartManager();

// Sepete ekle fonksiyonu - İyileştirilmiş ve Debug
function addToCart(productName) {
    console.log('=== SEPETE EKLEME BAŞLADI ===');
    console.log('Ürün adı:', productName);
    console.log('Event:', window.event);
    console.log('CartManager mevcut mu?', typeof cartManager !== 'undefined');
    
    let price = '₺0';
    
    // 1. Önce currentProduct'tan kontrol et (modal açıkken)
    if (typeof currentProduct !== 'undefined' && currentProduct && currentProduct.title === productName) {
        price = currentProduct.price;
        console.log('✓ Modal\'dan fiyat alındı:', price);
    } else {
        // 2. DOM'dan product card'larını ara
        console.log('DOM\'dan fiyat aranıyor...');
        const productCards = document.querySelectorAll('.product-card');
        console.log('Bulunan product card sayısı:', productCards.length);
        
        for (const card of productCards) {
            const titleEl = card.querySelector('.product-title');
            if (titleEl) {
                const cardTitle = titleEl.textContent.trim();
                console.log('Kart başlığı:', cardTitle, '- Aranan:', productName);
                
                if (cardTitle === productName) {
                    const priceEl = card.querySelector('.product-price');
                    if (priceEl) {
                        price = priceEl.textContent.trim();
                        console.log('✓ DOM\'dan fiyat alındı:', price);
                        break;
                    } else {
                        console.log('❌ Price element bulunamadı');
                    }
                }
            }
        }
    }

    console.log('Final fiyat:', price);

    // 3. Fiyat kontrolü
    if (price === '₺0') {
        console.error('❌ Ürün fiyatı bulunamadı:', productName);
        showNotification('Ürün fiyatı bulunamadı!', 'error');
        return;
    }

    // 4. CartManager'a ekleme
    console.log('CartManager\'a ekleniyor...');
    try {
        const success = cartManager.addItem(productName, price, 1);
        
        console.log('Sepete ekleme sonucu:', success);
        console.log('Güncel sepet:', cartManager.getCart());
        console.log('Sepet item sayısı:', cartManager.getTotalItems());
        
        if (success) {
            // 5. Buton animasyonu
            if (window.event && window.event.target) {
                const btn = window.event.target;
                const originalText = btn.textContent;
                const originalBg = btn.style.backgroundColor || '';
                
                console.log('Buton animasyonu başlatılıyor...');
                btn.style.backgroundColor = '#10B981'; // success green
                btn.textContent = 'Eklendi!';
                btn.disabled = true;
                
                setTimeout(() => {
                    btn.style.backgroundColor = originalBg;
                    btn.textContent = originalText;
                    btn.disabled = false;
                    console.log('Buton animasyonu tamamlandı');
                }, 2000);
            }
            
            showNotification(`${productName} sepete eklendi!`, 'success');
            console.log('=== SEPETE EKLEME BAŞARILI ===');
        } else {
            console.error('❌ Sepete ekleme başarısız!');
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

// ===== CATEGORY PAGE INITIALIZATION =====

async function initializeCategoryPage(categoryName, categoryTitle) {
    console.log(`Kategori sayfası başlatılıyor: ${categoryName}`);
    
    // Admin'den ürünleri yükle ve categoryDatabase'e ekle
    const adminDatabase = await loadProductsFromAdmin();
    Object.assign(categoryDatabase, adminDatabase);
    
    loadCategoryProducts(categoryName);
    cartManager.updateCartCount();
    setupEventListeners();
}

function loadCategoryProducts(categoryName) {
    const productsGrid = document.getElementById('productsGrid');
    const productsCount = document.getElementById('productsCount');
    
    console.log(`=== loadCategoryProducts başladı ===`);
    console.log(`Kategori adı: ${categoryName}`);
    console.log(`categoryDatabase objesi:`, categoryDatabase);
    console.log(`categoryDatabase keys:`, Object.keys(categoryDatabase));
    console.log(`Aranan kategori var mı?`, categoryDatabase.hasOwnProperty(categoryName));
    
    if (!productsGrid) {
        console.error('Products grid bulunamadı');
        return;
    }
    
    const products = categoryDatabase[categoryName] || [];
    console.log(`${categoryName} kategorisinde ${products.length} ürün bulundu`);
    console.log(`Ürünler:`, products);
    
    allProducts = products;
    filteredProducts = [...allProducts];
    
    // Ürün sayısını güncelle
    updateProductsCount();
    
    // Arama kutusunu temizle
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Sıralama seçimini sıfırla
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = 'default';
    }
    
    renderProducts();
}

function renderProducts() {
    console.log(`=== renderProducts başladı ===`);
    console.log(`filteredProducts:`, filteredProducts);
    console.log(`filteredProducts.length:`, filteredProducts.length);
    console.log(`currentPage:`, currentPage, `productsPerPage:`, productsPerPage);
    
    const productsGrid = document.getElementById('productsGrid');
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`startIndex: ${startIndex}, endIndex: ${endIndex}`);
    console.log(`pageProducts:`, pageProducts);
    
    if (pageProducts.length === 0) {
        console.log(`Ürün bulunamadı, boş mesaj gösteriliyor`);
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>Ürün bulunamadı</h3>
                <p>Bu kategoride henüz ürün bulunmuyor veya arama kriterlerinize uygun ürün yok.</p>
                <p><strong>Admin panelden ürün ekleyin!</strong></p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '';
    
    pageProducts.forEach(product => {
        console.log(`Ürün işleniyor:`, product.title);
        
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
    
    console.log(`productsHTML uzunluğu:`, productsHTML.length);
    productsGrid.innerHTML = productsHTML;
    console.log(`DOM güncellendi`);
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
    
    console.log(`=== searchProducts ===`);
    console.log(`Arama terimi: "${searchTerm}"`);
    console.log(`Tüm ürünler:`, allProducts.length);
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
        console.log(`Arama boş, tüm ürünler gösteriliyor: ${filteredProducts.length}`);
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
        console.log(`Filtrelenmiş ürünler: ${filteredProducts.length}`);
    }
    
    // Sayacı güncelle
    updateProductsCount();
    
    // İlk sayfaya dön
    currentPage = 1;
    
    // Ürünleri yeniden render et
    renderProducts();
}

function sortProducts() {
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect.value;
    
    console.log(`=== sortProducts ===`);
    console.log(`Sıralama değeri: ${sortValue}`);
    console.log(`Sıralanacak ürün sayısı: ${filteredProducts.length}`);
    
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                const priceB = parseFloat(b.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                console.log(`${a.title}: ${priceA} vs ${b.title}: ${priceB}`);
                return priceA - priceB;
            });
            console.log(`Düşükten yükseğe sıralandı`);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                const priceB = parseFloat(b.price.replace('₺', '').replace(/\./g, '').replace(/,/g, ''));
                return priceB - priceA;
            });
            console.log(`Yüksekten düşüğe sıralandı`);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
            console.log(`İsme göre sıralandı`);
            break;
        default:
            // Varsayılan sıralama - orijinal sıraya dön
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            
            if (searchTerm === '') {
                filteredProducts = [...allProducts];
            } else {
                // Arama varsa arama sonucunu koru
                searchProducts();
                return; // searchProducts zaten renderProducts'ı çağırıyor
            }
            console.log(`Varsayılan sıraya döndü`);
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
