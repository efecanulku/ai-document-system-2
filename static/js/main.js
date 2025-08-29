// Main application utilities

// Global variables
let currentChatSession = null;
let documents = [];
let chatSessions = [];

// Global initialization for all pages
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 Main.js loaded on page:', window.location.pathname);
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('🔑 Token in localStorage:', !!localStorage.getItem('token'));
    
    // Debug: Check if there's a redirect happening
    console.log('🔍 Checking for redirects...');
    console.log('🔍 localStorage keys:', Object.keys(localStorage));
    console.log('🔍 localStorage showSection:', localStorage.getItem('showSection'));
    console.log('🔍 localStorage lastPage:', localStorage.getItem('lastPage'));
    
    // Check if we're on a protected page
    const protectedPages = ['/dashboard', '/documents', '/chat', '/search'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.includes(currentPath)) {
        console.log('🛡️ Protected page detected:', currentPath);
        
        // Check authentication manually (since requireAuthNoRedirect might not be loaded yet)
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No token found, staying on current page');
            return;
        }
        
        console.log('✅ Token found, authentication passed');
        
        // Initialize page-specific functionality
        if (currentPath === '/dashboard') {
            console.log('📱 Dashboard page - main.js initialization complete');
        } else if (currentPath === '/documents') {
            console.log('📄 Documents page - loading documents...');
            loadDocuments();
        } else if (currentPath === '/chat') {
            console.log('💬 Chat page - loading chat sessions...');
            // loadChatSessions is in dashboard.js, will be handled there
        } else if (currentPath === '/search') {
            console.log('🔍 Search page - loading search filters...');
            // loadSearchFilters is in dashboard.js, will be handled there
        }
    } else {
        console.log('🌐 Public page detected:', currentPath);
    }
});

// Simple loading overlay management
function showLoading() {
    const loadingElement = document.getElementById('loadingModal');
    if (loadingElement) {
        loadingElement.style.display = 'block';
        console.log('Loading overlay shown');
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loadingModal');
    if (loadingElement) {
        loadingElement.style.display = 'none';
        console.log('Loading overlay hidden');
    }
}

function showSuccess(message) {
    console.log('✅ showSuccess called:', message);
    
    // Temporary simple solution - just use alert for now
    console.log('🎉 SUCCESS:', message);
    
    // Show a simple notification for now
    if (window.Notification && Notification.permission === 'granted') {
        new Notification('Başarılı', { body: message });
    } else {
        // Create a simple div overlay
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.textContent = '✅ ' + message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

function showError(message) {
    console.log('❌ showError called:', message);
    
    // Temporary simple solution
    console.log('💥 ERROR:', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
    `;
    notification.textContent = '❌ ' + message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

function showToast(message, type = 'info') {
    console.log('🍞 showToast called:', { message, type });
    
    try {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-modern toast-${type}`;
        
        const toastIcon = type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 
                         'fa-info-circle';
        
        const toastTitle = type === 'success' ? 'Başarılı' : 
                          type === 'error' ? 'Hata' : 'Bilgi';
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                         type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                         'rgba(0, 255, 136, 0.1)'};
            font-weight: 600;
            font-size: 14px;
        `;
        
        const icon = document.createElement('i');
        icon.className = `fas ${toastIcon}`;
        icon.style.cssText = `
            color: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     '#00ff88'};
            font-size: 16px;
        `;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = toastTitle;
        titleSpan.style.color = '#ffffff';
        
        header.appendChild(icon);
        header.appendChild(titleSpan);
        
        // Create body
        const body = document.createElement('div');
        body.style.cssText = `
            padding: 16px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.5;
        `;
        body.textContent = message;
        
        // Append to toast
        toast.appendChild(header);
        toast.appendChild(body);
        
        console.log('✅ Toast elements created successfully');
        
        // Find or create toast container
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
            console.log('📦 Toast container created');
        }
        
        // Set initial styles with complete CSS
        toast.style.cssText = `
            opacity: 0;
            transform: translateX(100%);
            margin-bottom: 10px;
            pointer-events: auto;
            background: rgba(20, 20, 35, 0.95);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0, 255, 136, 0.2);
            transition: all 0.3s ease-out;
            max-width: 400px;
            min-width: 300px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #ffffff;
        `;
        
        // Apply type-specific styles
        if (type === 'success') {
            toast.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            toast.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.2)';
        } else if (type === 'error') {
            toast.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            toast.style.boxShadow = '0 10px 40px rgba(239, 68, 68, 0.2)';
        }
        
        // Add toast to container
        container.appendChild(toast);
        console.log('🍞 Toast added to container');
        
        // Show with animation
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                        console.log('🗑️ Toast removed from DOM');
                    }
                }, 300);
            }
        }, 5000);
        
        console.log('✅ Toast displayed successfully');
        
    } catch (error) {
        console.error('💥 Toast creation error:', error);
        // Fallback to simple alert
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

function showInfo(message) {
    // Use success toast for info messages
    showSuccess(message);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get file icon class
function getFileIconClass(fileType) {
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'bmp': 'fas fa-file-image',
        'tiff': 'fas fa-file-image',
        'txt': 'fas fa-file-alt'
    };
    return iconMap[fileType.toLowerCase()] || 'fas fa-file';
}

// Get file type color class
function getFileTypeColor(fileType) {
    const colorMap = {
        'pdf': 'pdf',
        'doc': 'docx',
        'docx': 'docx',
        'xls': 'xlsx',
        'xlsx': 'xlsx',
        'jpg': 'jpg',
        'jpeg': 'jpg',
        'png': 'jpg',
        'gif': 'jpg',
        'bmp': 'jpg',
        'tiff': 'jpg',
        'txt': 'txt'
    };
    return colorMap[fileType.toLowerCase()] || 'default';
}

// Navigation functions
function showDashboard() {
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'none';
}

function showDocuments() {
    console.log('📄 showDocuments() called');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('📍 Current URL:', window.location.href);
    console.log('🔍 localStorage showSection:', localStorage.getItem('showSection'));
    
    // Check authentication manually
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found in showDocuments, returning');
        return;
    }
    
    console.log('✅ Token found, switching to documents section');
    
    // Store current page in localStorage
    localStorage.setItem('lastPage', '/documents');
    console.log('💾 Stored lastPage in localStorage:', '/documents');
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'block';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';
    
    loadDocuments();
}

function showChat() {
    console.log('💬 showChat() called');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('📍 Current URL:', window.location.href);
    
    // Check authentication manually
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found in showChat, returning');
        return;
    }
    
    console.log('✅ Token found, switching to chat section');
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'block';
    document.getElementById('searchSection').style.display = 'none';
    
    loadChatSessions();
}

function showSearch() {
    console.log('🔍 showSearch() called');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('📍 Current URL:', window.location.href);
    
    // Check authentication manually
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found in showSearch, returning');
        return;
    }
    
    console.log('✅ Token found, switching to search section');
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'block';
    
    loadSearchFilters();
}

function showDocumentUpload() {
    console.log('📤 showDocumentUpload called from main.js - redirecting to documents section');
    // Redirect to documents section instead of showing upload form
    if (window.location.pathname === '/dashboard') {
        showDocumentsSection();
    } else {
        // If already on documents page, just show the upload form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.style.display = 'block';
            uploadForm.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Function to show documents section
function showDocumentsSection() {
    console.log('📄 showDocumentsSection called from main.js');
    // Store the target section in localStorage for dashboard.js to pick up
    localStorage.setItem('showSection', 'documents');
    // Redirect to dashboard page
    window.location.href = '/dashboard';
}

// Handle protected navigation with authentication check
function handleProtectedNavigation(path) {
    console.log('🧭 Protected navigation requested to:', path);
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found, redirecting to login');
        // Redirect to login with next parameter
        window.location.href = `/login?next=${encodeURIComponent(path)}`;
        return;
    }
    
    console.log('✅ Token found, proceeding with navigation');
    
    // If authenticated, proceed with navigation
    if (path === '/dashboard') {
        window.location.href = path;
    } else {
        // For other protected routes, store the target section and redirect to dashboard
        const section = path.substring(1); // Remove leading slash
        localStorage.setItem('showSection', section);
        window.location.href = '/dashboard';
    }
}

function hideDocumentUpload() {
    document.getElementById('uploadForm').style.display = 'none';
}

// Document management functions
async function loadDocuments() {
    console.log('📚 loadDocuments function called');
    
    try {
        console.log('🌐 Making GET request to /api/documents/');
        const response = await axios.get('/api/documents/');
        
        console.log('✅ Documents API response received');
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        documents = response.data;
        console.log('📄 Documents array updated:', {
            length: documents.length,
            documents: documents.map(d => ({
                id: d.id,
                filename: d.filename || d.original_filename,
                processed: d.processed
            }))
        });
        
        console.log('🎨 Calling renderDocuments...');
        renderDocuments();
        console.log('✅ renderDocuments completed');
        
    } catch (error) {
        console.error('💥 Error loading documents:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        showError('Dökümanlar yüklenirken hata oluştu');
    }
}

function renderDocuments() {
    console.log('🎨 renderDocuments function called');
    
    const container = document.getElementById('documentsList');
    console.log('📦 Container element found:', !!container);
    
    if (!container) {
        console.error('❌ documentsList container not found!');
        return;
    }

    console.log('📊 Documents count:', documents.length);
    
    if (documents.length === 0) {
        console.log('📭 No documents found, showing empty state');
        container.innerHTML = `
            <div class="docs-empty">
                <i class="fas fa-folder-open"></i>
                <h3>Henüz dökümanınız yok</h3>
                <p>AI destekli döküman yönetimi için ilk dosyanızı yükleyin ve analiz etmeye başlayın.</p>
                <button class="btn-futuristic btn-primary" onclick="showDocumentUpload()">
                    <span class="btn-icon">
                        <i class="fas fa-plus"></i>
                    </span>
                    <span class="btn-text">İlk Dökümanınızı Yükleyin</span>
                </button>
            </div>
        `;
        console.log('✅ Empty state HTML set');
        return;
    }

    const documentsHtml = documents.map(doc => {
        const fileIcon = getFileIconClass(doc.file_type);
        const fileSize = formatFileSize(doc.file_size);
        const uploadDate = formatDate(doc.upload_date);
        
        return `
            <div class="doc-card" data-doc-id="${doc.id}">
                <div class="doc-card-header">
                    <div class="doc-file-icon">
                        <i class="${fileIcon}"></i>
                    </div>
                    <div class="doc-info">
                        <h3 class="doc-title" title="${doc.original_filename}">${doc.original_filename}</h3>
                        <p class="doc-meta">${doc.file_type.toUpperCase()} • ${fileSize} • ${uploadDate}</p>
                    </div>
                    <div class="doc-actions">
                        <button class="doc-action-btn" onclick="viewDocument(${doc.id})" title="Dosyayı Aç">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="doc-action-btn" onclick="viewDocumentContent(${doc.id})" title="İçeriği Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${!doc.processed ? `
                        <button class="doc-action-btn" onclick="reprocessDocument(${doc.id})" title="Yeniden İşle">
                            <i class="fas fa-redo"></i>
                        </button>
                        ` : ''}
                        <button class="doc-action-btn" onclick="deleteDocument(${doc.id})" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="doc-card-body">
                    <div class="doc-status">
                        <span class="doc-status-badge ${doc.processed ? 'processed' : 'processing'}">
                            ${doc.processed ? 'İşlendi' : 'İşleniyor'}
                        </span>
                    </div>
                                                ${!doc.processed ? `
                                <div class="doc-progress">
                                    <div class="doc-progress-bar" style="width: 65%;"></div>
                                </div>
                            ` : ''}
                            <div class="doc-stats">
                                <span>AI Analizi: ${doc.processed ? 'Tamamlandı' : 'Devam ediyor'}</span>
                                <span>${doc.processed ? '✓' : '⏳'}</span>
                            </div>
                </div>
            </div>
        `;
    }).join('');

    console.log('🏗️ Generated HTML length:', documentsHtml.length);
    console.log('🏗️ First 200 chars of HTML:', documentsHtml.substring(0, 200));
    
    container.innerHTML = documentsHtml;
    console.log('✅ Documents HTML set to container');
    console.log('📦 Container current child count:', container.children.length);
}

async function deleteDocument(documentId) {
    if (!confirm('Bu dökümanı silmek istediğinizden emin misiniz?')) return;

    try {
        await axios.delete(`/api/documents/${documentId}`);
        showSuccess('Döküman başarıyla silindi');
        loadDocuments();
    } catch (error) {
        showError('Döküman silinirken hata oluştu');
        console.error('Error deleting document:', error);
    }
}

async function reprocessDocument(documentId) {
    try {
        await axios.post(`/api/documents/${documentId}/reprocess`);
        showSuccess('Döküman yeniden işleme alındı');
        setTimeout(() => loadDocuments(), 2000);
    } catch (error) {
        showError('Döküman yeniden işlenirken hata oluştu');
        console.error('Error reprocessing document:', error);
    }
}

function viewDocument(documentId) {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
        window.open(`/uploads/${doc.file_path.split('/').pop()}`, '_blank');
    }
}

async function viewDocumentContent(documentId) {
    try {
        const response = await axios.get(`/api/documents/${documentId}/content`);
        const content = response.data;
        
        // Show custom modal with content
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        modal.innerHTML = `
            <div class="custom-modal-content" style="
                background: #1a1a2e;
                border: 1px solid rgba(0, 255, 136, 0.3);
                border-radius: 16px;
                padding: 0;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 255, 136, 0.2);
            ">
                <div class="custom-modal-header" style="
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(0, 255, 136, 0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(0, 255, 136, 0.05);
                ">
                    <h5 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                        <i class="fas fa-file-alt" style="margin-right: 8px; color: #00ff88;"></i>
                        Döküman İçeriği
                    </h5>
                    <button type="button" class="custom-modal-close" style="
                        background: none;
                        border: none;
                        color: #00ff88;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: all 0.2s;
                    " onclick="this.closest('.custom-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="custom-modal-body" style="
                    padding: 24px;
                    max-height: 60vh;
                    overflow-y: auto;
                    color: #ffffff;
                ">
                    ${content.content_text ? `
                    <div style="margin-bottom: 20px;">
                        <h6 style="color: #00ff88; margin-bottom: 12px; font-size: 16px;">
                            <i class="fas fa-file-text" style="margin-right: 8px;"></i>
                            Döküman İçeriği
                        </h6>
                        <div style="
                            max-height: 400px;
                            overflow-y: auto;
                            background: rgba(20, 20, 35, 0.8);
                            padding: 16px;
                            border-radius: 8px;
                            border: 1px solid rgba(0, 255, 136, 0.2);
                        ">
                            <pre style="
                                white-space: pre-wrap;
                                margin: 0;
                                color: rgba(255, 255, 255, 0.9);
                                font-family: 'Courier New', monospace;
                                font-size: 13px;
                                line-height: 1.5;
                            ">${content.content_text}</pre>
                        </div>
                    </div>
                    ` : ''}
                    <div style="
                        padding: 16px;
                        background: rgba(0, 255, 136, 0.1);
                        border-radius: 8px;
                        border: 1px solid rgba(0, 255, 136, 0.2);
                        text-align: center;
                    ">
                        <small style="color: rgba(255, 255, 255, 0.7);">
                            <i class="fas fa-info-circle" style="margin-right: 6px; color: #00ff88;"></i>
                            İşlenme Durumu: <span style="color: ${content.processed ? '#00ff88' : '#ffaa00'};">${content.processed ? 'İşlendi ✓' : 'İşleniyor ⏳'}</span>
                        </small>
                    </div>
                </div>
            </div>
        `;
        
        // Add click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add escape key to close
        const handleEscape = function(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
        
        // Auto-remove event listeners when modal is removed
        modal.addEventListener('remove', function() {
            document.removeEventListener('keydown', handleEscape);
        });
        
    } catch (error) {
        showError('Döküman içeriği yüklenirken hata oluştu');
        console.error('Error loading document content:', error);
    }
}

// Navigation functions - available on all pages
function showDashboard() {
    window.location.href = '/dashboard';
}

function showDocuments() {
    // Store the section to show in localStorage
    localStorage.setItem('showSection', 'documents');
    window.location.href = '/dashboard';
}

function showChat() {
    // Store the section to show in localStorage
    localStorage.setItem('showSection', 'chat');
    window.location.href = '/dashboard';
}

function showSearch() {
    // Store the section to show in localStorage
    localStorage.setItem('showSection', 'search');
    window.location.href = '/dashboard';
}

// View toggle functionality
function toggleView() {
    const container = document.getElementById('documentsList');
    const toggleBtn = document.getElementById('viewToggle');
    
    if (container.classList.contains('docs-list')) {
        // Switch to grid view
        container.classList.remove('docs-list');
        container.classList.add('docs-grid');
        toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
        toggleBtn.title = 'Liste Görünümü';
    } else {
        // Switch to list view
        container.classList.remove('docs-grid');
        container.classList.add('docs-list');
        toggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
        toggleBtn.title = 'Kart Görünümü';
    }
}

// Refresh documents
function refreshDocuments() {
    const refreshBtn = document.querySelector('[onclick="refreshDocuments()"]');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        
        loadDocuments().finally(() => {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 500);
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard initialization is handled by dashboard.js
    console.log('Main.js loaded on page:', window.location.pathname);
});
