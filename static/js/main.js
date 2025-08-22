// Main application utilities

// Global variables
let currentChatSession = null;
let documents = [];
let chatSessions = [];

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
    if (!requireAuth()) return;
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'block';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';
    
    loadDocuments();
}

function showChat() {
    if (!requireAuth()) return;
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'block';
    document.getElementById('searchSection').style.display = 'none';
    
    loadChatSessions();
}

function showSearch() {
    if (!requireAuth()) return;
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'block';
    
    loadSearchFilters();
}

function showDocumentUpload() {
    document.getElementById('uploadForm').style.display = 'block';
    document.getElementById('uploadForm').scrollIntoView({ behavior: 'smooth' });
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
                    ${doc.summary ? `
                        <div class="doc-summary">
                            <p>${doc.summary.substring(0, 100)}${doc.summary.length > 100 ? '...' : ''}</p>
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
        
        // Show modal with content
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Döküman İçeriği</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content.summary ? `
                        <div class="mb-3">
                            <h6>Özet:</h6>
                            <p class="text-muted">${content.summary}</p>
                        </div>
                        ` : ''}
                        ${content.content_text ? `
                        <div class="mb-3">
                            <h6>İçerik:</h6>
                            <div style="max-height: 300px; overflow-y: auto; background: #f8f9fa; padding: 1rem; border-radius: 6px;">
                                <pre style="white-space: pre-wrap; margin: 0;">${content.content_text}</pre>
                            </div>
                        </div>
                        ` : ''}
                        <div class="text-muted">
                            <small>İşlenme Durumu: ${content.processed ? 'İşlendi' : 'İşleniyor'}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
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
