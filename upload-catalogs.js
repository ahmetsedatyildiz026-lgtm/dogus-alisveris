// Firebase Storage'a katalog yükleme scripti
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin SDK'yı başlat
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'dogusalisverismerkezi-da2c1.appspot.com'
});

const bucket = admin.storage().bucket();

async function uploadCatalog(filename) {
  const filePath = path.join(__dirname, 'kataloglar', filename);
  const destination = `kataloglar/${filename}`;
  
  console.log(`📤 Yükleniyor: ${filename}...`);
  
  await bucket.upload(filePath, {
    destination: destination,
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'public, max-age=31536000'
    }
  });
  
  // Public URL al
  const file = bucket.file(destination);
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  
  console.log(`✅ ${filename} yüklendi: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  const catalogs = [
    'akyol-katalog.pdf',
    'bode-katalog.pdf', 
    'evona-katalog.pdf'
  ];
  
  const urls = {};
  for (const catalog of catalogs) {
    urls[catalog] = await uploadCatalog(catalog);
  }
  
  console.log('\n📋 TÜM URL\'LER:');
  console.log(JSON.stringify(urls, null, 2));
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Hata:', error);
  process.exit(1);
});
