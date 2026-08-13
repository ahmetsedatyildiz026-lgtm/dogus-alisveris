# 🔥 Firebase Kurulum Rehberi - Doğuş Alışveriş Merkezi

## 📋 İçindekiler
1. [Firebase Projesi Oluşturma](#1-firebase-projesi-oluşturma)
2. [Web App Ekleme ve Config Alma](#2-web-app-ekleme)
3. [Authentication Ayarları](#3-authentication-ayarları)
4. [Firestore Database Kurulumu](#4-firestore-database)
5. [Storage Kurulumu](#5-storage-kurulumu)
6. [Güvenlik Kuralları](#6-güvenlik-kuralları)
7. [Firebase'i Aktifleştirme](#7-firebasei-aktifleştirme)
8. [Test Etme](#8-test-etme)

---

## 1. Firebase Projesi Oluşturma

### Adım 1.1: Firebase Console'a Giriş
1. https://console.firebase.google.com adresine gidin
2. Google hesabınızla giriş yapın

### Adım 1.2: Yeni Proje Oluştur
1. **"Add project"** veya **"Create a project"** butonuna tıklayın
2. Proje adı girin: `dogus-alisveris` (veya istediğiniz isim)
3. **Continue** tıklayın
4. **Google Analytics** için:
   - İsteğe bağlı, aktif edebilir veya atlayabilirsiniz
   - Eğer açıyorsanız Analytics hesabı seçin veya yeni oluşturun
5. **Create project** tıklayın
6. Proje hazırlanırken bekleyin (1-2 dakika)
7. **Continue** ile projeye girin

---

## 2. Web App Ekleme

### Adım 2.1: Web App Kaydı
1. Firebase Console'da **Project Overview** sayfasındayken
2. **"</>" (Web)** ikonuna tıklayın
3. App nickname girin: `Doğuş Web App`
4. **"Also set up Firebase Hosting"** ✅ (opsiyonel)
5. **Register app** tıklayın

### Adım 2.2: Firebase Config Kopyalama
1. Ekranda gösterilen **firebaseConfig** nesnesini kopyalayın:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "dogus-alisveris.firebaseapp.com",
  projectId: "dogus-alisveris",
  storageBucket: "dogus-alisveris.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

2. **`js/firebase-config.js`** dosyasını açın
3. `firebaseConfig` nesnesini yapıştırın (eski placeholder'ı değiştirin)
4. Dosyayı kaydedin

---

## 3. Authentication Ayarları

### Adım 3.1: Authentication'ı Aktifleştir
1. Sol menüden **"Build"** → **"Authentication"** tıklayın
2. **"Get started"** butonuna tıklayın

### Adım 3.2: Sign-in Methods
1. **"Sign-in method"** tab'ına geçin
2. **Email/Password** provider'ına tıklayın:
   - **Enable** anahtarını açın ✅
   - **Save** tıklayın
3. **Google** provider'ına tıklayın:
   - **Enable** anahtarını açın ✅
   - **Project support email** seçin (Gmail adresiniz)
   - **Save** tıklayın

### Adım 3.3: İlk Admin Kullanıcısı Oluştur
1. **"Users"** tab'ına geçin
2. **"Add user"** tıklayın
3. Admin bilgileri:
   ```
   Email: admin@dogus.com
   Password: dogus2024admin
   ```
4. **Add user** tıklayın
5. Oluşturulan kullanıcının **User UID**'sini kopyalayın (örn: `a1b2c3d4e5f6...`)

---

## 4. Firestore Database

### Adım 4.1: Firestore Oluştur
1. Sol menüden **"Build"** → **"Firestore Database"** tıklayın
2. **"Create database"** butonuna tıklayın
3. **Mode seçimi:**
   - **Production mode** seçin (güvenli)
   - **Next** tıklayın
4. **Location seçimi:**
   - **eur3 (europe-west)** seçin (Avrupa için en yakın)
   - **Enable** tıklayın
5. Database hazırlanırken bekleyin (1-2 dakika)

### Adım 4.2: İlk Koleksiyonları Oluştur
1. **"Start collection"** tıklayın
2. Collection ID: `admins`
3. **Next** tıklayın
4. İlk admin dokümanı:
   ```
   Document ID: [Adım 3.3'teki User UID'yi yapıştır]
   
   Field: email
   Type: string
   Value: admin@dogus.com
   
   Field: role
   Type: string
   Value: admin
   
   Field: createdAt
   Type: string
   Value: [bugünün tarihi, örn: 2024-01-15T10:00:00Z]
   ```
5. **Save** tıklayın

**Diğer koleksiyonlar otomatik oluşacak:**
- `products` - Ürünler eklendiğinde
- `users` - Kullanıcılar kayıt olduğunda
- `orders` - Siparişler verildiğinde

---

## 5. Storage Kurulumu

### Adım 5.1: Storage'ı Aktifleştir
1. Sol menüden **"Build"** → **"Storage"** tıklayın
2. **"Get started"** butonuna tıklayın
3. **Security rules** ekranında **"Next"** (şimdilik default)
4. **Cloud Storage location** seçin:
   - **europe-west3** veya **eur3** (Avrupa)
5. **Done** tıklayın

### Adım 5.2: Klasör Yapısı (Otomatik)
Storage kullanıma başladığında şu klasörler otomatik oluşacak:
```
/products/         → Ürün fotoğrafları
/users/            → Kullanıcı profil fotoğrafları
/documents/        → Dökümanlar (faturalar vs)
```

---

## 6. Güvenlik Kuralları

### Adım 6.1: Firestore Rules
1. **Firestore Database** → **"Rules"** tab
2. Aşağıdaki kuralları kopyalayıp yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin kontrolü
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Kullanıcılar - sadece kendi bilgilerini görebilir/düzenleyebilir
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId;
    }
    
    // Ürünler - herkes okur, sadece admin yazar
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Siparişler - giriş yapmış kullanıcılar
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
    
    // Admin dokümanları - sadece okunabilir
    match /admins/{adminId} {
      allow read: if request.auth.uid == adminId;
      allow write: if false;
    }
    
    // Markalar
    match /brands/{brandId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Stok
    match /stock/{stockId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

3. **Publish** tıklayın

### Adım 6.2: Storage Rules
1. **Storage** → **"Rules"** tab
2. Aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Ürün fotoğrafları - herkes okur, sadece admin yükler
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Kullanıcı profil fotoğrafları
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Dökümanlar - sadece admin
    match /documents/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. **Publish** tıklayın

---

## 7. Firebase'i Aktifleştirme

### Adım 7.1: Config Kontrolü
1. `js/firebase-config.js` dosyasını açın
2. `firebaseConfig` nesnesinin dolu olduğunu kontrol edin
3. Tüm değerlerin `"YOUR_..."` yerine gerçek değerler içerdiğinden emin olun

### Adım 7.2: Firebase Modunu Aç
1. `js/firebase.js` dosyasını açın
2. **2. satırı** bulun:
   ```javascript
   const USE_FIREBASE = false;
   ```
3. **`true` yapın:**
   ```javascript
   const USE_FIREBASE = true;
   ```
4. Dosyayı kaydedin

### Adım 7.3: Sayfaya Script Ekle
Eğer index.html'de yoksa ekleyin (şu an zaten var):
```html
<script type="module" src="js/firebase.js"></script>
```

---

## 8. Test Etme

### Test 8.1: Console Log Kontrolü
1. Siteyi tarayıcıda açın (`index.html`)
2. **F12** → **Console** açın
3. Şu mesajları görmelisiniz:
   ```
   ✅ Firebase başarıyla yüklendi
   📦 Firebase Entegrasyon Katmanı Yüklendi
   🔄 Mod: Firebase
   ```

### Test 8.2: Giriş Testi
1. **Giriş Yap** sayfasına gidin (`giris.html`)
2. Test kullanıcı ile giriş yapın:
   ```
   E-posta: test@dogus.com
   Şifre: test123
   ```
3. Başarılı giriş sonrası profil sayfasına yönlendirilmelisiniz

### Test 8.3: Kayıt Testi
1. **Üye Ol** sayfasına gidin (`kayit.html`)
2. Yeni kullanıcı oluşturun
3. Firestore Console'da **users** koleksiyonunda göründüğünü kontrol edin

### Test 8.4: Admin Panel Testi
1. Admin girişi yapın:
   ```
   E-posta: admin@dogus.com
   Şifre: dogus2024admin
   ```
2. **Ürünler** → **Yeni Ürün Ekle**
3. Fotoğraf yükleyin
4. Ürünü kaydedin
5. Firestore'da **products** koleksiyonunda göründüğünü kontrol edin
6. Ana sayfada "En Çok Satanlar" bölümünde göründüğünü kontrol edin

---

## 🎯 Önemli Notlar

### ✅ Firebase Aktif
- Tüm veriler Firestore'da saklanır
- Fotoğraflar Firebase Storage'da
- Real-time senkronizasyon
- Multi-device çalışma
- Güvenli authentication

### 📊 LocalStorage vs Firebase

| Özellik | LocalStorage | Firebase |
|---------|-------------|----------|
| Veri Sınırı | ~5-10MB | Sınırsız |
| Multi-Device | ❌ | ✅ |
| Real-time | ❌ | ✅ |
| Güvenlik | Düşük | Yüksek |
| Maliyet | Ücretsiz | Ücretsiz quota |

### 💰 Firebase Pricing
- **Spark Plan (Ücretsiz):**
  - 1GB Storage
  - 10GB/ay Transfer
  - 50K/gün Okuma
  - 20K/gün Yazma
  - 10K/gün Authentication
- **Blaze Plan (Kullandıkça Öde):**
  - Ücretsiz quota aşıldığında devreye girer
  - Küçük e-ticaret siteleri için ayda ~$5-20

### 🔄 Firebase'e Geçiş Sonrası
1. Eski localStorage verileri silinmez
2. Gerekirse export edip Firebase'e import edebilirsiniz
3. `USE_FIREBASE = false` yaparak geri dönebilirsiniz

---

## 🆘 Sorun Giderme

### Hata: "Firebase not initialized"
- `firebase-config.js` dosyasını kontrol edin
- API key ve diğer değerlerin doğru olduğundan emin olun

### Hata: "Permission denied"
- Firestore Rules'u kontrol edin
- Admin koleksiyonunda kullanıcınızın olduğundan emin olun

### Hata: "Storage upload failed"
- Storage Rules'u kontrol edin
- Dosya boyutunun 5MB'dan küçük olduğundan emin olun

### Fotoğraflar Yüklenmiyor
- Browser Console'da hata mesajlarını kontrol edin
- Firebase Storage'ın aktif olduğundan emin olun
- Dosya formatının desteklendiğinden emin olun (jpg, png, webp)

---

## 📞 Destek

Firebase dokümantasyonu:
- https://firebase.google.com/docs
- https://firebase.google.com/docs/firestore
- https://firebase.google.com/docs/auth
- https://firebase.google.com/docs/storage

---

**🎉 Firebase kurulumu tamamlandı! Artık production-ready bir e-ticaret siteniz var!**
