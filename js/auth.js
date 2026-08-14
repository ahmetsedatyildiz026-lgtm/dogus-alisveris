// Authentication System for Doğuş Alışveriş Merkezi
// LocalStorage based - will be converted to database later

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.storageKey = 'dogusUsers';
        this.sessionKey = 'dogusCurrentUser';
        this.init();
    }

    init() {
        // Defer UI update until DOM and other scripts are ready
        const savedUser = localStorage.getItem(this.sessionKey);
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            // Update UI after DOM is fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.updateUIForLoggedInUser());
            } else {
                this.updateUIForLoggedInUser();
            }
        } else {
            // Update links even when logged out
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._fixGuestLinks());
            } else {
                this._fixGuestLinks();
            }
        }
    }

    // Fix guest links to point to correct pages
    _fixGuestLinks() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;
        // Links are already set statically, just ensure cart count is updated
        if (typeof cartManager !== 'undefined') {
            cartManager.updateCartCount();
        }
    }

    // Get all users from localStorage
    getAllUsers() {
        const users = localStorage.getItem(this.storageKey);
        return users ? JSON.parse(users) : [];
    }

    // Save users to localStorage
    saveUsers(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    // Register new user
    async register(userData) {
        // Firebase'e kaydet
        try {
            if (typeof db !== 'undefined' && db) {
                // Email kontrolü
                const emailCheck = await db.collection('customers')
                    .where('email', '==', userData.email)
                    .get();
                
                if (!emailCheck.empty) {
                    return { success: false, message: 'Bu e-posta adresi zaten kayıtlı!' };
                }

                // Telefon kontrolü
                if (userData.phone) {
                    const phoneCheck = await db.collection('customers')
                        .where('phone', '==', userData.phone)
                        .get();
                    
                    if (!phoneCheck.empty) {
                        return { success: false, message: 'Bu telefon numarası zaten kayıtlı!' };
                    }
                }

                // Yeni kullanıcı oluştur
                const newUser = {
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    address: userData.address || '',
                    password: this.hashPassword(userData.password),
                    provider: 'email',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const docRef = await db.collection('customers').add(newUser);
                
                console.log('✅ Müşteri Firebase\'e kaydedildi:', docRef.id);
                
                // LocalStorage'a da kaydet (eski sistemle uyum için)
                const users = this.getAllUsers();
                users.push({
                    id: docRef.id,
                    ...newUser,
                    createdAt: new Date().toISOString()
                });
                this.saveUsers(users);

                return { success: true, message: 'Kayıt başarılı! Giriş yapabilirsiniz.' };
            }
        } catch (error) {
            console.error('❌ Firebase kayıt hatası:', error);
        }

        // Fallback: LocalStorage
        const users = this.getAllUsers();
        
        // Check if email already exists
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Bu e-posta adresi zaten kayıtlı!' };
        }

        // Check if phone already exists
        if (users.find(u => u.phone === userData.phone)) {
            return { success: false, message: 'Bu telefon numarası zaten kayıtlı!' };
        }

        // Create new user
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address || '',
            password: this.hashPassword(userData.password),
            createdAt: new Date().toISOString(),
            provider: 'email' // email, google
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'Kayıt başarılı! Giriş yapabilirsiniz.' };
    }

    // Login user
    login(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, message: 'E-posta adresi bulunamadı!' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Şifre hatalı!' };
        }

        // Set current user (without password)
        const { password: _, ...userWithoutPassword } = user;
        this.currentUser = userWithoutPassword;
        localStorage.setItem(this.sessionKey, JSON.stringify(userWithoutPassword));

        return { success: true, message: 'Giriş başarılı!', user: userWithoutPassword };
    }

    // Google Sign In (Firebase Authentication)
    async googleSignIn(googleData) {
        try {
            // Firebase Auth kullan
            if (typeof auth !== 'undefined' && auth) {
                console.log('🔐 Google ile Firebase Authentication başlatılıyor...');
                
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                
                const user = result.user;
                console.log('✅ Google ile giriş başarılı:', user.email);
                
                // Kullanıcıyı Firestore'a kaydet
                const userDoc = await db.collection('customers').doc(user.uid).get();
                
                let userData;
                if (!userDoc.exists) {
                    // Yeni kullanıcı
                    userData = {
                        id: user.uid,
                        name: user.displayName,
                        email: user.email,
                        phone: user.phoneNumber || '',
                        address: '',
                        provider: 'google',
                        photoURL: user.photoURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    await db.collection('customers').doc(user.uid).set(userData);
                    console.log('✅ Yeni Google kullanıcı Firestore\'a kaydedildi');
                } else {
                    // Mevcut kullanıcı
                    userData = { id: user.uid, ...userDoc.data() };
                    console.log('✅ Mevcut Google kullanıcı bulundu');
                }
                
                this.currentUser = userData;
                localStorage.setItem(this.sessionKey, JSON.stringify(userData));
                
                return { success: true, message: 'Google ile giriş başarılı!', user: userData };
            }
        } catch (error) {
            console.error('❌ Google giriş hatası:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                return { success: false, message: 'Google girişi iptal edildi.' };
            }
            return { success: false, message: 'Google ile giriş yapılamadı: ' + error.message };
        }
        
        // Fallback: LocalStorage demo
        const users = this.getAllUsers();
        let user = users.find(u => u.email === googleData.email);

        if (!user) {
            // Create new user from Google data
            user = {
                id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: googleData.name,
                email: googleData.email,
                phone: googleData.phone || '',
                address: '',
                provider: 'google',
                createdAt: new Date().toISOString()
            };
            users.push(user);
            this.saveUsers(users);
        }

        this.currentUser = user;
        localStorage.setItem(this.sessionKey, JSON.stringify(user));

        return { success: true, message: 'Google ile giriş başarılı!', user: user };
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
        this.updateUIForLoggedOutUser();
        return { success: true, message: 'Çıkış yapıldı!' };
    }

    // Update user profile
    updateProfile(userData) {
        if (!this.currentUser) {
            return { success: false, message: 'Önce giriş yapmalısınız!' };
        }

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex === -1) {
            return { success: false, message: 'Kullanıcı bulunamadı!' };
        }

        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            name: userData.name,
            phone: userData.phone,
            address: userData.address
        };

        this.saveUsers(users);

        // Update current user
        const { password: _, ...userWithoutPassword } = users[userIndex];
        this.currentUser = userWithoutPassword;
        localStorage.setItem(this.sessionKey, JSON.stringify(userWithoutPassword));

        return { success: true, message: 'Profil güncellendi!', user: userWithoutPassword };
    }

    // Change password
    changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'Önce giriş yapmalısınız!' };
        }

        if (this.currentUser.provider === 'google') {
            return { success: false, message: 'Google ile giriş yaptınız, şifre değiştiremezsiniz!' };
        }

        const users = this.getAllUsers();
        const user = users.find(u => u.id === this.currentUser.id);

        if (!user) {
            return { success: false, message: 'Kullanıcı bulunamadı!' };
        }

        if (user.password !== this.hashPassword(oldPassword)) {
            return { success: false, message: 'Eski şifre hatalı!' };
        }

        user.password = this.hashPassword(newPassword);
        this.saveUsers(users);

        return { success: true, message: 'Şifre değiştirildi!' };
    }

    // Simple password hashing (will be replaced with proper hashing)
    hashPassword(password) {
        // Simple hash - will be replaced with bcrypt or similar
        return btoa(password + 'dogus_salt_2024');
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Update UI for logged in user
    updateUIForLoggedInUser() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;

        // Keep the cart button if it exists, replace login/register buttons
        const cartBtn = userActions.querySelector('.cart-btn');
        const cartBtnHTML = cartBtn ? cartBtn.outerHTML : `
            <button class="cart-btn" onclick="toggleCart()">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count" id="cartCount">0</span>
            </button>`;

        userActions.innerHTML = `
            ${cartBtnHTML}
            <div class="user-menu">
                <button class="btn btn-secondary user-menu-btn" onclick="toggleUserMenu()">
                    <i class="fas fa-user"></i>
                    <span>${this.currentUser.name.split(' ')[0]}</span>
                    <i class="fas fa-chevron-down" style="font-size:0.75rem"></i>
                </button>
                <div class="user-menu-dropdown" id="userMenuDropdown">
                    <a href="profil.html"><i class="fas fa-user"></i> Profilim</a>
                    <a href="profil.html#orders"><i class="fas fa-shopping-bag"></i> Siparişlerim</a>
                    <hr style="margin:0.25rem 0; border-color:var(--border)">
                    <a href="#" onclick="event.preventDefault(); authSystem.logout(); window.location.reload();">
                        <i class="fas fa-sign-out-alt"></i> Çıkış Yap
                    </a>
                </div>
            </div>
        `;

        // Update cart count
        if (typeof cartManager !== 'undefined') {
            cartManager.updateCartCount();
        }
    }

    // Update UI for logged out user
    updateUIForLoggedOutUser() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;

        const cartBtn = userActions.querySelector('.cart-btn');
        const cartBtnHTML = cartBtn ? cartBtn.outerHTML : `
            <button class="cart-btn" onclick="toggleCart()">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count" id="cartCount">0</span>
            </button>`;

        userActions.innerHTML = `
            ${cartBtnHTML}
            <a href="giris.html" class="btn btn-secondary">Giriş Yap</a>
            <a href="kayit.html" class="btn btn-primary">Üye Ol</a>
        `;

        // Update cart count
        if (typeof cartManager !== 'undefined') {
            cartManager.updateCartCount();
        }
    }
}

// Initialize auth system
const authSystem = new AuthSystem();

// Toggle user menu dropdown
function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userMenuDropdown');
    
    if (dropdown && !userMenu?.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});
