// Authentication utilities

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.init();
    }

    init() {
        // Set up axios interceptors
        axios.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                }
                return Promise.reject(error);
            }
        );

        // Update navigation
        this.updateNavigation();
        
        // Load user info if logged in
        if (this.token) {
            this.loadUserInfo();
        }
    }

    async loadUserInfo() {
        try {
            const response = await axios.get('/api/auth/me');
            this.user = response.data;
            this.updateNavigation();
        } catch (error) {
            console.error('Failed to load user info:', error);
            // Don't auto logout, just log the error
            // this.logout();
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.user = null;
        window.location.href = '/login';
    }

    isAuthenticated() {
        return !!this.token;
    }

    updateNavigation() {
        const authNav = document.getElementById('authNav');
        if (!authNav) return;

        if (this.isAuthenticated()) {
            authNav.innerHTML = `
                <li class="nav-item user-menu">
                    <div class="user-menu-container">
                        <button class="user-menu-toggle" onclick="toggleUserMenu()">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <span class="user-name">${this.user ? this.user.username : 'Kullanıcı'}</span>
                            <i class="fas fa-chevron-down user-chevron"></i>
                        </button>
                        <div class="user-dropdown" id="userDropdown">
                            <div class="dropdown-item" onclick="authManager.showProfile()">
                                <i class="fas fa-user-edit"></i>
                                <span>Profil</span>
                            </div>
                            <div class="dropdown-divider"></div>
                            <div class="dropdown-item" onclick="authManager.logout()">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Çıkış Yap</span>
                            </div>
                        </div>
                    </div>
                </li>
            `;
        } else {
            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="/login">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Giriş</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/register">
                        <i class="fas fa-user-plus"></i>
                        <span>Kayıt</span>
                    </a>
                </li>
            `;
        }
    }

    showProfile() {
        // TODO: Implement profile modal
        alert('Profil özelliği yakında eklenecek');
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Check authentication on protected pages
function requireAuth() {
    console.log('🔐 requireAuth() called');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('🔑 Token exists:', !!authManager.token);
    console.log('👤 User authenticated:', authManager.isAuthenticated());
    
    if (!authManager.isAuthenticated()) {
        console.log('❌ Not authenticated, redirecting to login');
        console.log('🔄 Redirecting from:', window.location.href, 'to /login');
        window.location.href = '/login';
        return false;
    }
    console.log('✅ User authenticated, token exists');
    return true;
}

// Check authentication without redirect (for dashboard.js)
function requireAuthNoRedirect() {
    console.log('🔐 requireAuthNoRedirect() called');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('🔑 Token exists:', !!authManager.token);
    console.log('👤 User authenticated:', authManager.isAuthenticated());
    
    if (!authManager.isAuthenticated()) {
        console.log('❌ Not authenticated, but NOT redirecting (staying on current page)');
        return false;
    }
    console.log('✅ User authenticated, token exists');
    return true;
}

// Toggle user menu dropdown
function toggleUserMenu(e) {
    // Stop event propagation to prevent conflicts
    if (e) {
        e.stopPropagation();
    }
    
    const dropdown = document.getElementById('userDropdown');
    const chevron = document.querySelector('.user-chevron');
    
    // Null guard checks
    if (!dropdown || !chevron) {
        console.warn('User menu elements not found');
        return;
    }
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        chevron.style.transform = 'rotate(0deg)';
    } else {
        dropdown.classList.add('show');
        chevron.style.transform = 'rotate(180deg)';
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu-container');
    const dropdown = document.getElementById('userDropdown');
    
    // Null guard checks
    if (!userMenu || !dropdown) {
        return;
    }
    
    if (!userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
        const chevron = document.querySelector('.user-chevron');
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
});
