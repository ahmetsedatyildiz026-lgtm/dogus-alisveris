# 🔥 DOĞUŞ E-TİCARET - FİREBASE ENTEGRASYON PLANI

## Firestore Collections Yapısı

```
dogusalisverismerkezi-da2c1/
├── products/           ✅ AKTIF - Admin'den eklenen ürünler
│   └── {productId}
│       ├── title
│       ├── brand
│       ├── category
│       ├── price
│       ├── images[]
│       └── ...
│
├── brands/             📝 EKLENECEK - Anlaşmalı markalar
│   └── brandsList      (tek döküman, içinde brands objesi)
│       └── brands: {
│           "beyaz-esya": ["ALTUS", "HOOVER"],
│           "mobilya": ["SUNA", "MASSA"]
│         }
│
├── customers/          📝 EKLENECEK - Kayıtlı müşteriler
│   └── {customerId}
│       ├── name
│       ├── email
│       ├── phone
│       ├── createdAt
│       └── ...
│
└── orders/             📝 EKLENECEK - Siparişler
    └── {orderId}
        ├── customerName
        ├── items[]
        ├── total
        ├── status
        └── ...
```

## Yapılacaklar

### 1. ✅ Products - TAMAMLANDI
- Admin panel CRUD çalışıyor
- Gerçek zamanlı sync aktif

### 2. 🔧 Brands - ŞİMDİ EKLENİYOR
```javascript
// Firebase'e eklenecek:
await db.collection('brands').doc('brandsList').set({
  brands: {
    "beyaz-esya": ["ALTUS", "HOOVER", "..."],
    "mobilya": ["SUNA SANDALYE", "MASSA", "..."]
  }
});
```

### 3. 🔧 Customers - ŞİMDİ EKLENİYOR
```javascript
// Kayıt olan her müşteri Firebase'e:
await db.collection('customers').add({
  name: "...",
  email: "...",
  phone: "...",
  createdAt: serverTimestamp()
});
```

### 4. 🔧 Orders - ŞİMDİ EKLENİYOR
```javascript
// WhatsApp siparişi aynı zamanda Firebase'e:
await db.collection('orders').add({
  customerName: "...",
  items: [...],
  total: "...",
  status: "pending",
  createdAt: serverTimestamp()
});
```

## Sonuç
- ✅ Admin panel → Firebase → Tüm cihazlar sync
- ✅ Gerçek zamanlı güncellemeler
- ✅ Telefon, tablet, bilgisayar hepsi aynı veri
