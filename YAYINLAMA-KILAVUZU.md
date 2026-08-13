# 🚀 Doğuş Alışveriş Merkezi - Yayınlama Kılavuzu

## 📋 Ön Hazırlık

### ✅ Kontrol Listesi
- [ ] LocalStorage temizlendi mi? (`temizle-localstorage.html`)
- [ ] Admin giriş bilgileri doğru mu?
  - **Email:** admin@dogus.com
  - **Şifre:** dogus2024admin
- [ ] Markalar eklenmiş mi? (admin-markalar.html)
- [ ] Test ürünleri eklenmiş mi? (admin-urunler.html)
- [ ] Fotoğraflar optimize edilmiş mi? (Maksimum 5MB, otomatik sıkıştırma aktif)
- [ ] WhatsApp numarası doğru mu? (+90 537 942 9437)

---

## 🌐 Yayınlama Seçenekleri

### Seçenek 1: **Netlify (ÜCRETSİZ - ÖNERİLEN)**

#### Adım 1: Netlify Hesabı Oluştur
1. https://www.netlify.com adresine git
2. GitHub/Email ile ücretsiz hesap oluştur

#### Adım 2: Site Yükle
1. Netlify'da "Add new site" → "Deploy manually"
2. Tüm proje klasörünü sürükle-bırak (drag & drop)
3. Deploy başlayacak (1-2 dakika)

#### Adım 3: Domain Ayarla
1. Site yayınlandıktan sonra "Domain settings"
2. Özel domain ekle veya Netlify subdomain kullan
   - Örnek: `dogus-alisveris.netlify.app`

**Avantajlar:**
- ✅ Tamamen ücretsiz
- ✅ HTTPS otomatik
- ✅ Hızlı güncelleme (sürükle-bırak)
- ✅ Türkiye'de hızlı erişim

---

### Seçenek 2: **Vercel (ÜCRETSİZ)**

#### Adım 1: Vercel Hesabı
1. https://vercel.com adresine git
2. GitHub/Email ile kayıt ol

#### Adım 2: Deploy
1. "Add New Project"
2. Proje klasörünü yükle
3. Deploy tıkla

**Avantajlar:**
- ✅ Ücretsiz
- ✅ Hızlı CDN
- ✅ Otomatik HTTPS

---

### Seçenek 3: **GitHub Pages (ÜCRETSİZ)**

#### Adım 1: GitHub Repository Oluştur
```bash
# Terminal'de proje klasöründe
git init
git add .
git commit -m "İlk commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/dogus-alisveris.git
git push -u origin main
```

#### Adım 2: GitHub Pages Aktif Et
1. Repository → Settings → Pages
2. Source: "main" branch seç
3. Save tıkla
4. Site: `https://KULLANICI_ADINIZ.github.io/dogus-alisveris`

---

### Seçenek 4: **Klasik Hosting (Ücretli - Natro, Turhost, Hostinger)**

#### Gerekli Dosyalar:
```
📁 Tüm dosyalar (FTP ile yüklenecek)
   ├── index.html
   ├── admin.html
   ├── admin-*.html (tüm admin sayfaları)
   ├── kategori-*.html (tüm kategori sayfaları)
   ├── css/
   ├── js/
   ├── img/
   └── diğer dosyalar
```

#### Adımlar:
1. Hosting satın al (Natro, Turhost, vb.)
2. cPanel → File Manager
3. `public_html` klasörüne tüm dosyaları yükle
4. Site: `https://sizin-domain.com`

---

## 🔧 Yayından Sonra Yapılacaklar

### 1. Admin Panele İlk Giriş
```
URL: https://siteniz.com/admin.html
Email: admin@dogus.com
Şifre: dogus2024admin
```

### 2. Markaları Ekle
1. Admin → Markalar
2. Her kategoriye markaları ekle
3. "Değişiklikleri Kaydet" butonuna bas

### 3. Ürünleri Ekle
1. Admin → Ürünler → Yeni Ürün
2. Toplu fotoğraf yükleme kullan (6 fotoğraf tek seferde)
3. Fotoğraflar otomatik sıkıştırılacak

### 4. Ana Sayfada Kontrol Et
1. `index.html` aç
2. Markalar görünüyor mu?
3. "En Çok Satanlar" bölümünde ürünler var mı?

---

## 📱 Mobil Uyumluluk

Site tamamen responsive:
- ✅ Mobil telefonlar
- ✅ Tabletler
- ✅ Masaüstü

Test için: https://www.responsivedesignchecker.com/

---

## ⚠️ ÖNEMLİ NOTLAR

### LocalStorage Sınırlamaları
- **Maksimum:** ~5-10MB (tarayıcıya göre değişir)
- **Çözüm:** Ürün sayısını 50-100 arası tutun
- **Alternatif:** Firebase kullanın (FIREBASE-SETUP.md dosyasına bakın)

### Fotoğraf Optimizasyonu
- Otomatik sıkıştırma aktif (%70 JPEG kalite)
- Maksimum genişlik: 1200px
- Tek fotoğraf limiti: 5MB
- Toplam limit: 15MB (6 fotoğraf için)

### WhatsApp Entegrasyonu
- Şu anki numara: +90 537 942 9437
- Değiştirmek için: `index.html` ve tüm `kategori-*.html` dosyalarında "905379429437" ara

### Güvenlik
- Admin şifresi localStorage'da saklanıyor (basit koruma)
- **Önemli:** Gerçek e-ticaret için güvenli backend gerekli
- Firebase entegrasyonu için: `FIREBASE-SETUP.md`

---

## 🆘 Sorun Giderme

### "Quota Exceeded" Hatası
```
Çözüm: temizle-localstorage.html aç → "Ürünleri Optimize Et"
```

### Ürünler Görünmüyor
```
1. Admin panelde ürün ekle
2. Status: "active" olmalı
3. Stok: 0'dan büyük olmalı
4. Kategori doğru seçilmiş olmalı
```

### Markalar Görünmüyor
```
1. Admin → Markalar → Marka Ekle
2. "Değişiklikleri Kaydet" butonuna bas
3. Ana sayfa 2 saniye içinde güncellenecek
```

### Fotoğraflar Yüklenmiyor
```
1. Fotoğraf boyutu 5MB altında olmalı
2. Format: JPG, PNG, WEBP
3. Toplu yükleme: Maksimum 6 fotoğraf
```

---

## 📞 Destek

Site ile ilgili sorularınız için:
- **WhatsApp:** +90 537 942 9437
- **Teknik:** FIREBASE-SETUP.md dosyasına bakın

---

## 🎉 Site Yayında!

Başarıyla yayınladıktan sonra:
1. ✅ Google'da aratılabilir olması için Google Search Console ekle
2. ✅ Google Analytics ekle (istatistikler için)
3. ✅ Facebook/Instagram sayfası oluştur
4. ✅ WhatsApp Business kullan

**Başarılar! 🚀**
