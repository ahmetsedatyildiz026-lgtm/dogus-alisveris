# 🏪 Doğuş Alışveriş Merkezi - E-Ticaret Platformu

Modern, tam özellikli e-ticaret sitesi ve admin paneli. LocalStorage tabanlı, Firebase entegrasyona hazır.

---

## ✨ Özellikler

### 🛍️ Müşteri Sayfası (index.html)
- ✅ Modern, responsive tasarım
- ✅ Dinamik ürün gösterimi (Admin'den yüklenir)
- ✅ "En Çok Satanlar" bölümü
- ✅ Anlaşmalı Markalar (7 kategori, accordion)
- ✅ Sepet sistemi (LocalStorage)
- ✅ WhatsApp entegrasyonu
- ✅ Taksit hesaplama
- ✅ Ürün detay modal (Lightbox galeri)
- ✅ Arama ve filtreleme
- ✅ Kategori sayfaları (7 adet)

### 🎛️ Admin Paneli
- ✅ **Dashboard** - İstatistikler ve grafikler
- ✅ **Ürün Yönetimi** - CRUD işlemleri
  - Toplu fotoğraf yükleme (6 fotoğraf)
  - Otomatik fotoğraf sıkıştırma (%70 JPEG)
  - "En Çok Satanlar" yönetimi
  - Kategori, marka, fiyat yönetimi
- ✅ **Marka Yönetimi** - 7 kategori, sınırsız marka
- ✅ **Stok Yönetimi** - Depo takibi
- ✅ **Sipariş Yönetimi** - Sipariş listesi
- ✅ **Müşteri Yönetimi** - Toplu mesajlaşma (WhatsApp/SMS/Email)
- ✅ **Raporlar** - Aylık PDF export, istatistikler

### 🔧 Teknik Özellikler
- ✅ 100% JavaScript (Vanilla JS)
- ✅ LocalStorage veritabanı
- ✅ Firebase entegrasyona hazır
- ✅ Responsive design (mobil uyumlu)
- ✅ Fotoğraf optimizasyonu (max 5MB → sıkıştırma)
- ✅ Gerçek zamanlı senkronizasyon
- ✅ Browser storage yönetimi

---

## 🚀 Hızlı Başlangıç

### 1. LocalStorage Temizle
```bash
# Tarayıcıda aç:
temizle-localstorage.html
```

### 2. Admin Girişi
```
URL: admin.html
Email: admin@dogus.com
Şifre: dogus2024admin
```

### 3. Markaları Ekle
```
Admin → Markalar → Her kategoriye marka ekle
(Otomatik kaydediliyor!)
```

### 4. Ürün Ekle
```
Admin → Ürünler → Yeni Ürün
Toplu fotoğraf yükle (6 adet)
```

### 5. Kontrol Et
```
index.html → Markalar ve ürünler görünüyor mu?
```

**Detaylı bilgi:** 📄 `HIZLI-BASLANGIC.md`

---

## 📂 Dosya Yapısı

```
📁 Doğuş Alışveriş Merkezi/
├── 📄 index.html                    # Ana sayfa
├── 📄 admin.html                    # Admin dashboard
├── 📄 admin-urunler.html            # Ürün yönetimi
├── 📄 admin-markalar.html           # Marka yönetimi
├── 📄 admin-depo.html               # Stok yönetimi
├── 📄 admin-siparisler.html         # Sipariş yönetimi
├── 📄 admin-musteriler.html         # Müşteri yönetimi
├── 📄 admin-raporlar.html           # Raporlar
├── 📄 kategori-*.html               # Kategori sayfaları (7 adet)
├── 📄 temizle-localstorage.html     # Veri yönetim aracı
│
├── 📁 css/
│   ├── style.css                    # Ana site stilleri
│   └── admin.css                    # Admin panel stilleri
│
├── 📁 js/
│   ├── admin.js                     # Admin fonksiyonları
│   └── category-products.js         # Kategori ürün yönetimi
│
├── 📁 img/
│   └── [görsel dosyaları]
│
├── 📄 HIZLI-BASLANGIC.md           # ⚡ 5 dakikada başla
├── 📄 YAYINLAMA-KILAVUZU.md        # 🚀 Deployment rehberi
├── 📄 FIREBASE-SETUP.md             # 🔥 Firebase kurulumu
└── 📄 README.md                     # Bu dosya
```

---

## 🌐 Yayınlama

### Netlify (Önerilen - Ücretsiz)
```bash
1. https://netlify.com → Kayıt ol
2. "Deploy manually" → Klasörü sürükle-bırak
3. 2 dakikada yayında!
```

### GitHub Pages (Ücretsiz)
```bash
git init
git add .
git commit -m "İlk commit"
git push origin main
# GitHub Settings → Pages → Aktif et
```

### Vercel (Ücretsiz)
```bash
1. https://vercel.com → Kayıt ol
2. Projeyi yükle
3. Deploy!
```

**Detaylı bilgi:** 📄 `YAYINLAMA-KILAVUZU.md`

---

## 🔧 Konfigürasyon

### WhatsApp Numarası Değiştir
```javascript
// Tüm HTML dosyalarında ara ve değiştir:
"905379429437" → "YENİ_NUMARA"
```

### Admin Şifre Değiştir
```javascript
// js/admin.js dosyasında:
const validEmail = 'admin@dogus.com';
const validPassword = 'YENI_SIFRE';
```

### Kategori Ekle/Çıkar
```javascript
// admin-urunler.html içinde:
const CATEGORIES = {
    'yeni-kategori': 'Yeni Kategori Adı'
};
```

---

## 📊 Teknik Detaylar

### LocalStorage Limitleri
- **Maksimum:** ~5-10MB (tarayıcıya göre)
- **Çözüm:** Ürün sayısını 50-100 arası tut
- **Alternatif:** Firebase kullan (FIREBASE-SETUP.md)

### Fotoğraf Optimizasyonu
```javascript
// Otomatik sıkıştırma:
- Kalite: %70 JPEG
- Max genişlik: 1200px
- Tek fotoğraf limiti: 5MB
- Toplam limit: 15MB (6 fotoğraf)
```

### Browser Desteği
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🛠️ Geliştirme

### Debug Araçları
```javascript
// Tarayıcı konsolunda:
localStorage.getItem('dogusAdminProducts')  // Ürünleri göster
localStorage.getItem('dogusBrands')         // Markaları göster
localStorage.getItem('dogusSepet')          // Sepeti göster
```

### Veri Temizleme
```html
<!-- Kullan: -->
temizle-localstorage.html
```

### Firebase Geçişi
```
Adım adım rehber: FIREBASE-SETUP.md
```

---

## 📱 Mobil Uyumluluk

- ✅ Responsive design
- ✅ Touch-friendly buttons
- ✅ Mobile-optimized images
- ✅ Fast loading

Test: https://www.responsivedesignchecker.com/

---

## ⚠️ Bilinen Sınırlamalar

1. **LocalStorage Limiti:** ~5-10MB
   - Çözüm: Firebase'e geç veya ürün sayısını sınırla

2. **Güvenlik:** Admin şifresi localStorage'da
   - Çözüm: Gerçek backend veya Firebase Auth

3. **Çok Kullanıcılı Değil:** Tek admin hesabı
   - Çözüm: Firebase veya backend gerekli

4. **Offline Çalışmıyor:** İnternet gerekli
   - Çözüm: Service Worker ekle (PWA)

---

## 🆘 Sorun Giderme

### "Quota Exceeded" Hatası
```
Çözüm: temizle-localstorage.html → "Ürünleri Optimize Et"
```

### Ürünler Görünmüyor
```
1. Admin panelde ürün durumu "active" mi?
2. Stok > 0 mı?
3. Kategori doğru seçilmiş mi?
```

### Markalar Görünmüyor
```
1. Admin → Markalar → Marka ekle
2. Otomatik kaydediliyor (2 saniye içinde ana sayfada görünür)
```

### Fotoğraf Yüklenmiyor
```
1. Maksimum 5MB olmalı
2. Format: JPG, PNG, WEBP
3. Önce https://tinypng.com ile küçült
```

---

## 📈 İstatistikler

- **Toplam Dosya:** 20+ HTML, 2 CSS, 2 JS
- **Kod Satırı:** ~5000+ satır
- **Kategoriler:** 7 adet
- **Admin Sayfaları:** 7 adet
- **Özellikler:** 30+ özellik

---

## 🎯 Roadmap

### Gelecek Özellikler
- [ ] Firebase entegrasyonu (backend)
- [ ] Gerçek ödeme sistemi
- [ ] Kargo takibi
- [ ] Canlı chat
- [ ] PWA (Offline çalışma)
- [ ] SEO optimizasyonu
- [ ] Çok dilli destek
- [ ] Admin kullanıcı yönetimi

---

## 📞 İletişim

**WhatsApp:** +90 537 942 9437  
**Site:** Yayınlandıktan sonra eklenecek

---

## 📄 Lisans

Bu proje Doğuş Alışveriş Merkezi için özel olarak geliştirilmiştir.

---

## 🙏 Teşekkürler

Bu projeyi kullandığınız için teşekkür ederiz!

**Başarılar! 🚀**

---

## 📚 Dokümantasyon

- 📄 **HIZLI-BASLANGIC.md** - 5 dakikada başla
- 📄 **YAYINLAMA-KILAVUZU.md** - Deployment rehberi
- 📄 **FIREBASE-SETUP.md** - Firebase entegrasyonu
- 📄 **TAMAMLANAN-ÖZELLIKLER.md** - Özellik listesi

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0
**Durum:** ✅ Yayına Hazır
