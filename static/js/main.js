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
    const toast = document.getElementById('successToast');
    toast.querySelector('.toast-body').textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function showError(message) {
    const toast = document.getElementById('errorToast');
    toast.querySelector('.toast-body').textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
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
    try {
        console.log('Loading documents...');
        const response = await axios.get('/api/documents/');
        documents = response.data;
        console.log('Documents loaded:', documents.length, 'items');
        renderDocuments();
    } catch (error) {
        showError('Dökümanlar yüklenirken hata oluştu');
        console.error('Error loading documents:', error);
    }
}

function renderDocuments() {
    const container = document.getElementById('documentsList');
    if (!container) return;

    if (documents.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">Henüz döküman yüklememişsiniz.</p>
                <button class="btn btn-primary" onclick="showDocumentUpload()">
                    <i class="fas fa-plus me-2"></i>İlk Dökümanınızı Yükleyin
                </button>
            </div>
        `;
        return;
    }

    const documentsHtml = documents.map(doc => `
        <div class="document-item position-relative fade-in">
            <div class="d-flex align-items-start">
                <div class="file-icon ${getFileTypeColor(doc.file_type)} me-3">
                    <i class="${getFileIconClass(doc.file_type)}"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${doc.original_filename}</h6>
                    <p class="text-muted mb-1">${formatFileSize(doc.file_size)} • ${formatDate(doc.upload_date)}</p>
                    ${doc.summary ? `<p class="text-truncate-2 mb-2">${doc.summary}</p>` : ''}
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewDocument(${doc.id})">
                            <i class="fas fa-eye me-1"></i>Görüntüle
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="viewDocumentContent(${doc.id})">
                            <i class="fas fa-file-alt me-1"></i>İçerik
                        </button>
                        ${!doc.processed ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="reprocessDocument(${doc.id})">
                            <i class="fas fa-redo me-1"></i>Yeniden İşle
                        </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteDocument(${doc.id})">
                            <i class="fas fa-trash me-1"></i>Sil
                        </button>
                    </div>
                </div>
                <div class="document-status ${doc.processed ? 'processed' : 'processing'}">
                    <i class="fas ${doc.processed ? 'fa-check-circle' : 'fa-spinner fa-spin'}"></i>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = documentsHtml;
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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard initialization is handled by dashboard.js
    console.log('Main.js loaded on page:', window.location.pathname);
});
