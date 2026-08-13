// ================================================================
// Auth Bridge - localStorage → Firebase geçiş katmanı
// Firebase config doldurunca USE_FIREBASE = true yapın
// ================================================================

const USE_FIREBASE = false; // ← Firebase config doldurunca true yapın

// ─── FIREBASE MODUNU AKTİF ETMEK İÇİN ────────────────────────
// 1. js/firebase.js içindeki firebaseConfig'i doldurun
// 2. Bu dosyada USE_FIREBASE = true yapın
// 3. giris.html ve kayit.html'de:
//    <script type="module" src="js/auth-firebase.js"></script>
//    satırını ekleyin (auth.js yerine)
// ─────────────────────────────────────────────────────────────

let fbFunctions = null;

async function loadFirebase() {
    if (!USE_FIREBASE) return null;
    try {
        fbFunctions = await import('./firebase.js');
        return fbFunctions;
    } catch (e) {
        console.warn('Firebase yüklenemedi, localStorage moduna geçildi:', e);
        return null;
    }
}

// ─── REGISTER ─────────────────────────────────────────────────
async function authRegister(userData) {
    if (USE_FIREBASE && fbFunctions) {
        try {
            const result = await fbFunctions.fbRegister(userData);
            return { success: true, message: 'Kayıt başarılı!' };
        } catch (err) {
            const msg = firebaseErrorMessage(err.code);
            return { success: false, message: msg };
        }
    }
    // localStorage fallback
    return authSystem.register(userData);
}

// ─── LOGIN ────────────────────────────────────────────────────
async function authLogin(email, password) {
    if (USE_FIREBASE && fbFunctions) {
        try {
            const result = await fbFunctions.fbLogin(email, password);
            // localStorage'a da yaz (UI uyumu için)
            localStorage.setItem('dogusCurrentUser', JSON.stringify(result.user));
            return { success: true, message: 'Giriş başarılı!', user: result.user };
        } catch (err) {
            return { success: false, message: firebaseErrorMessage(err.code) };
        }
    }
    return authSystem.login(email, password);
}

// ─── GOOGLE ───────────────────────────────────────────────────
async function authGoogleSignIn() {
    if (USE_FIREBASE && fbFunctions) {
        try {
            const result = await fbFunctions.fbGoogleSignIn();
            localStorage.setItem('dogusCurrentUser', JSON.stringify(result.user));
            return { success: true, message: 'Google ile giriş başarılı!', user: result.user };
        } catch (err) {
            return { success: false, message: firebaseErrorMessage(err.code) };
        }
    }
    // localStorage demo
    const googleData = { name: 'Demo User', email: 'demo@gmail.com', phone: '' };
    return authSystem.googleSignIn(googleData);
}

// ─── LOGOUT ───────────────────────────────────────────────────
async function authLogout() {
    if (USE_FIREBASE && fbFunctions) {
        await fbFunctions.fbLogout();
    }
    authSystem.logout();
}

// ─── UPDATE PROFILE ───────────────────────────────────────────
async function authUpdateProfile(uid, data) {
    if (USE_FIREBASE && fbFunctions) {
        try {
            await fbFunctions.fbUpdateProfile(uid, data);
            return { success: true, message: 'Profil güncellendi!' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
    return authSystem.updateProfile(data);
}

// ─── ERROR MESSAGES ───────────────────────────────────────────
function firebaseErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use':    'Bu e-posta zaten kayıtlı!',
        'auth/invalid-email':           'Geçersiz e-posta adresi!',
        'auth/weak-password':           'Şifre çok zayıf! En az 6 karakter girin.',
        'auth/user-not-found':          'Bu e-posta ile kayıtlı hesap bulunamadı!',
        'auth/wrong-password':          'Şifre hatalı!',
        'auth/invalid-credential':      'E-posta veya şifre hatalı!',
        'auth/too-many-requests':       'Çok fazla deneme. Lütfen bekleyin.',
        'auth/network-request-failed':  'İnternet bağlantısı yok!',
        'auth/popup-closed-by-user':    'Google girişi iptal edildi.',
        'auth/cancelled-popup-request': 'Google girişi iptal edildi.',
    };
    return messages[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

// ─── INIT ─────────────────────────────────────────────────────
loadFirebase().then(fb => {
    if (fb) {
        console.log('✅ Firebase Auth aktif');
        // Oturum durumunu dinle
        fb.fbOnAuthChange(user => {
            if (user) {
                localStorage.setItem('dogusCurrentUser', JSON.stringify(user));
            }
        });
    } else {
        console.log('💾 localStorage Auth aktif');
    }
});
