// ⚡ LAZY LOADING - Safari & Mobile Optimization
// Sadece görünen resimleri yükle - Performans artışı

class LazyImageLoader {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        // Intersection Observer kullan (Safari 12.1+ destekler)
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                    }
                });
            }, {
                rootMargin: '50px', // 50px önden yükle
                threshold: 0.01
            });
        } else {
            // Fallback: Hepsini yükle
            console.warn('⚠️ IntersectionObserver desteklenmiyor, tüm görseller yüklenecek');
        }
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // Placeholder'dan gerçek resme geç
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');

        // Observer'dan kaldır
        if (this.observer) {
            this.observer.unobserve(img);
        }
    }

    observe(img) {
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // Fallback: Direkt yükle
            this.loadImage(img);
        }
    }

    observeAll() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.observe(img));
    }
}

// Global instance
window.lazyLoader = new LazyImageLoader();

// Sayfa yüklendiğinde başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lazyLoader.observeAll();
    });
} else {
    window.lazyLoader.observeAll();
}
