// ===== SERVICE WORKER - OFFLINE & CACHE =====
// Firebase SDK ve statik dosyaları cache'ler
// İkinci yüklemelerde ANINDA açılır!

const CACHE_NAME = 'dogus-v1';
const CACHE_URLS = [
  '/',
  '/kategori-mobilya.html',
  '/kategori-beyaz-esya.html',
  '/kategori-kucuk-ev-aletleri.html',
  '/kategori-klima-ventilator.html',
  '/kategori-kisisel-bakim.html',
  '/js/category-products.js',
  '/js/firebase-config.js',
  '/css/style.css',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install - Cache'e dosyaları ekle
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Service Worker: Dosyalar cache\'lendi');
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate - Eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eski cache silindi:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Cache-first stratejisi
self.addEventListener('fetch', event => {
  // Firebase Firestore istekleri için network-first
  if (event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Diğer dosyalar için cache-first
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache'de varsa hemen döndür (ANINDA!)
      if (response) {
        // Arka planda güncelleme kontrolü yap
        fetch(event.request).then(fetchResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse);
          });
        });
        return response;
      }

      // Cache'de yoksa network'ten al
      return fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          // Cache'e ekle
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
