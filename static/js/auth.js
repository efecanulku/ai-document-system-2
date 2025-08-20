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
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-1"></i>
                        ${this.user ? this.user.username : 'Kullanıcı'}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="authManager.showProfile()">
                            <i class="fas fa-user-edit me-2"></i>Profil
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="authManager.logout()">
                            <i class="fas fa-sign-out-alt me-2"></i>Çıkış Yap
                        </a></li>
                    </ul>
                </li>
            `;
        } else {
            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="/login">
                        <i class="fas fa-sign-in-alt me-1"></i>Giriş
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/register">
                        <i class="fas fa-user-plus me-1"></i>Kayıt
                    </a>
                </li>
            `;
        }
    }

    showProfile() {
        // TODO: Implement profile modal
        showInfo('Profil özelliği yakında eklenecek');
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Check authentication on protected pages
function requireAuth() {
    if (!authManager.isAuthenticated()) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = '/login';
        return false;
    }
    console.log('User authenticated, token exists');
    return true;
}
