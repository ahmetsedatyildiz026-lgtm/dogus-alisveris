# 🔥 Firebase Kurulum Kılavuzu

Bu dosya, Doğuş Alışveriş Merkezi projesine Firebase entegrasyonunu adım adım anlatır.

---

## 📋 İçindekiler
1. [Firebase Projesi Oluşturma](#1-firebase-projesi-oluşturma)
2. [Firestore Database Kurulumu](#2-firestore-database-kurulumu)
3. [Storage Kurulumu](#3-storage-kurulumu)
4. [Web App Config Alma](#4-web-app-config-alma)
5. [Config'i Projeye Ekleme](#5-configi-projeye-ekleme)
6. [HTML Dosyalarına Firebase SDK Ekleme](#6-html-dosyalarına-firebase-sdk-ekleme)
7. [LocalStorage Verilerini Firebase'e Taşıma](#7-localstorage-verilerini-firebasee-taşıma)
8. [Test Etme](#8-test-etme)

---

## 1. Firebase Projesi Oluşturma

### Adımlar:
1. **Firebase Console'a git:** https://console.firebase.google.com/
2. **"Add project" veya "Proje ekle"** butonuna tıkla
3. **Proje adını gir:**
   - Örnek: `dogus-alisveris`
   - Project ID otomatik oluşturulacak
4. **Google Analytics:**
   - İsteğe bağlı (şimdilik **HAYIR** seçebilirsin)
5. **"Create project" veya "Proje oluştur"** butonuna tıkla
6. Proje hazırlanırken bekle (30-60 saniye)
7. **"Continue" veya "Devam"** butonuna tıkla

✅ **Sonuç:** Firebase projen oluşturuldu!

---

## 2. Firestore Database Kurulumu

### Adımlar:
1. Sol menüden **"Build"** → **"Firestore Database"** seç
2. **"Create database" veya "Veritabanı oluştur"** butonuna tıkla
3. **Security rules** seçeneği çıkacak:
   - **"Start in test mode"** seç (geliştirme için güvenlik kuralları kapalı)
   - ⚠️ **ÖNEMLİ:** Production'da test mode kullanma! Sonra değiştireceğiz.
4. **"Next" veya "İleri"** butonuna tıkla
5. **Location** seç:
   - **`europe-west`** veya **`europe-west3 (Frankfurt)`** önerilir (Türkiye'ye yakın)
6. **"Enable" veya "Etkinleştir"** butonuna tıkla
7. Veritabanı hazırlanırken bekle (30-60 saniye)

✅ **Sonuç:** Firestore Database aktif!

### Test Mode Security Rules (Geliştirme için):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### Production Security Rules (Yayın için - SONRA):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ürünler - Herkes okuyabilir, sadece admin yazabilir
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Markalar - Herkes okuyabilir, sadece admin yazabilir
    match /brands/{brandDoc} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Müşteriler - Sadece kendi verisini okuyabilir
    match /customers/{customerId} {
      allow read, write: if request.auth != null && request.auth.uid == customerId;
    }
    
    // Siparişler - Sadece kendi siparişlerini okuyabilir
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     resource.data.customerId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 3. Storage Kurulumu

### Adımlar:
1. Sol menüden **"Build"** → **"Storage"** seç
2. **"Get started" veya "Başlayın"** butonuna tıkla
3. **Security rules** seçeneği çıkacak:
   - **"Start in test mode"** seç
   - ⚠️ **ÖNEMLİ:** Production'da test mode kullanma!
4. **"Next" veya "İleri"** butonuna tıkla
5. **Location** seç:
   - **Firestore ile aynı location'ı seç** (`europe-west`)
6. **"Done" veya "Bitti"** butonuna tıkla

✅ **Sonuç:** Firebase Storage aktif!

### Test Mode Storage Rules (Geliştirme için):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### Production Storage Rules (Yayın için - SONRA):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Ürün fotoğrafları - Herkes okuyabilir, sadece admin yazabilir
    match /products/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Marka logoları - Herkes okuyabilir, sadece admin yazabilir
    match /brands/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Dosya boyutu kontrolü (max 5MB)
    allow write: if request.resource.size < 5 * 1024 * 1024;
  }
}
```

---

## 4. Web App Config Alma

### Adımlar:
1. Sol menüden **⚙️ (Settings)** ikonuna tıkla → **"Project Settings"** seç
2. **"General" tab'ına** git (varsayılan olarak açık)
3. Aşağı kaydır, **"Your apps"** bölümünü bul
4. **Web app** yoksa:
   - **`</>`** (Web) ikonuna tıkla
   - App nickname: **`dogus-web`**
   - **Firebase Hosting:** İşaretleme (GitHub Pages kullanıyoruz)
   - **"Register app" veya "Uygulamayı kaydet"** butonuna tıkla
5. **Firebase config** kodu görünecek:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "dogus-alisveris.firebaseapp.com",
  projectId: "dogus-alisveris",
  storageBucket: "dogus-alisveris.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd..."
};
```

6. **Bu kodu kopyala!** (Sonra kullanacağız)
7. **"Continue to console" veya "Konsola devam"** butonuna tıkla

✅ **Sonuç:** Firebase config kodunu aldın!

---

## 5. Config'i Projeye Ekleme

### Adımlar:
1. **`js/firebase-config.js`** dosyasını aç
2. Dosyanın başında şu kısmı bul:

```javascript
const firebaseConfig = {
  apiKey: "BURAYA_API_KEY_GELECEK",
  authDomain: "BURAYA_AUTH_DOMAIN_GELECEK",
  projectId: "BURAYA_PROJECT_ID_GELECEK",
  storageBucket: "BURAYA_STORAGE_BUCKET_GELECEK",
  messagingSenderId: "BURAYA_MESSAGING_SENDER_ID_GELECEK",
  appId: "BURAYA_APP_ID_GELECEK"
};
```

3. **Firebase Console'dan aldığın config ile değiştir:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",  // Firebase'den kopyala
  authDomain: "dogus-alisveris.firebaseapp.com",
  projectId: "dogus-alisveris",
  storageBucket: "dogus-alisveris.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd..."
};
```

4. **Dosyayı kaydet**

✅ **Sonuç:** Firebase config projeye eklendi!

---

## 6. HTML Dosyalarına Firebase SDK Ekleme

Tüm HTML dosyalarının `</body>` tag'inden **ÖNCE** şu scriptleri ekle:

### Ana Sayfa (index.html):
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Firebase Config -->
<script src="js/firebase-config.js"></script>

<!-- Mevcut scriptler -->
<script src="js/admin.js"></script>
</body>
</html>
```

### Admin Sayfaları (admin.html, admin-urunler.html, vs.):
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Firebase Config -->
<script src="js/firebase-config.js"></script>

<!-- Admin JS -->
<script src="js/admin.js"></script>
</body>
</html>
```

### Kategori Sayfaları:
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- Firebase Config -->
<script src="js/firebase-config.js"></script>

<!-- Category JS -->
<script src="js/category-products.js"></script>
</body>
</html>
```

✅ **Sonuç:** Firebase SDK tüm sayfalara eklendi!

---

## 7. LocalStorage Verilerini Firebase'e Taşıma

### Adımlar:
1. **Admin paneline giriş yap:** `admin.html`
2. **Tarayıcı konsolunu aç:** 
   - Chrome: `Cmd + Option + J` (Mac) veya `F12` (Windows)
3. **Konsola şu komutu yaz ve Enter'a bas:**

```javascript
migrateLocalStorageToFirebase()
```

4. **Konsolda şu mesajları görmelisin:**
```
🔄 LocalStorage → Firebase migrasyonu başlatılıyor...
📦 X ürün taşınıyor...
✅ Ürünler Firebase'e taşındı
🏷️ Markalar taşınıyor...
✅ Markalar Firebase'e taşındı
✅ Migrasyon tamamlandı!
```

5. **Firebase Console'da kontrol et:**
   - **Firestore Database** → **Data** sekmesi
   - `products` koleksiyonunu aç → Ürünleri gör
   - `brands` koleksiyonunu aç → Markaları gör

✅ **Sonuç:** Tüm veriler Firebase'e taşındı!

⚠️ **NOT:** LocalStorage verileri korunur (istersen manuel silebilirsin)

---

## 8. Test Etme

### Admin Panelinde Test:
1. **Yeni ürün ekle** → Firebase'e kaydediliyor mu?
2. **Ürün düzenle** → Firebase'de güncelleniy or mu?
3. **Ürün sil** → Firebase'den siliniyor mu?
4. **Marka ekle** → Firebase'e kaydediliyor mu?

### Ana Sayfada Test:
1. **Ana sayfayı aç:** `index.html`
2. **Konsolu aç:** `Cmd + Option + J` veya `F12`
3. **Şu mesajı görmelisin:**
```
✅ Firebase başarıyla başlatıldı
✅ X ürün Firebase'den yüklendi
```

4. **"En Çok Satanlar" bölümünde ürünler görünüyor mu?**

### Kategori Sayfalarında Test:
1. **Kategori sayfasını aç:** `kategori-beyaz-esya.html`
2. **Ürünler Firebase'den yükleniyor mu?**

✅ **Sonuç:** Her şey çalışıyor!

---

## 🔒 Production'a Geçiş (SONRA)

### Security Rules Güncelleme:
1. **Firestore Database** → **Rules** sekmesi
2. Production rules'u yapıştır (yukarıda ver ildi)
3. **"Publish" veya "Yayınla"** butonuna tıkla

### Storage Rules Güncelleme:
1. **Storage** → **Rules** sekmesi
2. Production rules'u yapıştır
3. **"Publish" veya "Yayınla"** butonuna tıkla

### Admin Kimlik Doğrulama (İSTEĞE BAĞLI):
- Firebase Authentication kullanarak admin girişi ekle
- Custom claims ile admin rolü tanımla

---

## 🆘 Sorun Giderme

### "Firebase SDK yüklenmedi" hatası:
- HTML dosyalarında Firebase script taglerini kontrol et
- CDN linkleri doğru mu?

### "Firebase bağlantısı yok" hatası:
- `firebase-config.js` dosyasında config doğru mu?
- Firebase Console'da proje aktif mi?

### "Permission denied" hatası:
- Firestore/Storage rules test mode'da mı?
- Test mode süresi dolmuş olabilir (timestamp kontrol et)

### Ürünler yüklenmiyor:
- Konsolu aç, hata mesajlarını kontrol et
- Firebase Console'da ürünler var mı?
- `getProductsFromFirebase()` fonksiyonu çağrılıyor mu?

---

## 📞 Yardım

- Firebase Documentation: https://firebase.google.com/docs
- Firestore Quickstart: https://firebase.google.com/docs/firestore/quickstart
- Storage Quickstart: https://firebase.google.com/docs/storage/web/start

---

## ✅ Tamamlandı!

Firebase entegrasyonu tamamlandı. Artık:
- ✅ Ürünler Firebase'de saklanıyor
- ✅ Admin paneli Firebase ile çalışıyor
- ✅ Ana sayfa Firebase'den ürün çekiyor
- ✅ Fotoğraflar Firebase Storage'da
- ✅ Tüm domainlerde aynı veri görünüyor

**Sonraki adım:** Siteyi yayınla ve test et!
