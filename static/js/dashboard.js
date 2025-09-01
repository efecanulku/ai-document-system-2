// Dashboard specific functionality

let dashboardData = {
    stats: {},
    recentDocuments: []
};

// Initialize dashboard and other protected pages
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Dashboard.js DOMContentLoaded fired');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('📍 Current URL:', window.location.href);
    console.log('🔑 Token in localStorage:', !!localStorage.getItem('token'));
    
    const currentPath = window.location.pathname;
    
    if (currentPath === '/dashboard') {
        console.log('📱 Dashboard page detected');
        
        // Check authentication manually
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No token found, staying on current page...');
            return;
        }
        console.log('✅ Token found, authentication passed');
        
        // Force dashboard section to be visible
        setTimeout(() => {
            console.log('🔧 Ensuring dashboard section is visible...');
            showDashboardSection();
            
            // Initialize dashboard with delay to ensure DOM is ready
            setTimeout(() => {
                console.log('🚀 Starting dashboard initialization...');
                initializeDashboard();
            }, 100);
        }, 50);
    } else if (currentPath === '/documents' || currentPath === '/chat' || currentPath === '/search') {
        console.log('📱 Protected page detected:', currentPath);
        
        // Check authentication manually
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No token found on protected page, staying on current page...');
            return;
        }
        console.log('✅ Token found, authentication passed on protected page');
        
        // Initialize page-specific functionality
        if (currentPath === '/documents') {
            console.log('📄 Initializing documents page...');
            showDocumentsSection();
            loadDocuments();
            setupEventListeners(); // Direct call, no setTimeout
        } else if (currentPath === '/chat') {
            console.log('💬 Initializing chat page...');
            showChatSection();
            loadChatSessions();
        } else if (currentPath === '/search') {
            console.log('🔍 Initializing search page...');
            showSearchSection();
            loadSearchFilters();
        }
    } else {
        console.log('📱 Public page or unknown page:', currentPath);
    }
});

function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('🔐 Auth check passed');
    
    console.log('⚙️ Setting up event listeners...');
    setupEventListeners();
    console.log('✅ Event listeners setup complete');
    
    console.log('📊 Loading dashboard data...');
    loadDashboardData();
    
    // Check if we should show a specific section
    const sectionToShow = localStorage.getItem('showSection');
    console.log('🔍 Checking localStorage for showSection:', sectionToShow);
    
    if (sectionToShow) {
        localStorage.removeItem('showSection'); // Clear it
        console.log('📂 Found section to show:', sectionToShow);
        
        setTimeout(() => {
            console.log('⏰ Executing section switch after timeout...');
            switch(sectionToShow) {
                case 'documents':
                    console.log('📄 Switching to documents section...');
                    showDocumentsSection();
                    break;
                case 'chat':
                    console.log('💬 Switching to chat section...');
                    showChatSection();
                    break;
                case 'search':
                    showSearchSection();
                    break;
                default:
                    showDashboardSection();
            }
        }, 500); // Wait for dashboard to load
    }
}

function showDashboardSection() {
    // Auth guard - check if user is authenticated
    if (!requireAuthNoRedirect()) {
        console.log('❌ Not authenticated, cannot show dashboard');
        return;
    }
    
    console.log('✅ Showing dashboard section');
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'none';
}

function showDocumentsSection() {
    if (!requireAuthNoRedirect()) return;
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'block';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';
    
    loadDocuments();
}

function showChatSection() {
    if (!requireAuthNoRedirect()) return;
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'block';
    document.getElementById('searchSection').style.display = 'none';
    
    loadChatSessions();
    
    // Setup chat form event listeners
    console.log('💬 Setting up chat form event listeners...');
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        // Remove existing event listeners by cloning
        const newChatForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(newChatForm, chatForm);
        
        newChatForm.addEventListener('submit', handleChatMessage);
        console.log('✅ Chat form submit event listener added');
    } else {
        console.error('❌ Chat form not found!');
    }
}

function showSearchSection() {
    if (!requireAuthNoRedirect()) return;
    
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'block';
    
    loadSearchFilters();
    
    // Setup search form event listeners
    console.log('🔍 Setting up search form event listeners...');
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        // Remove existing event listeners by cloning
        const newSearchForm = searchForm.cloneNode(true);
        searchForm.parentNode.replaceChild(newSearchForm, searchForm);
        
        newSearchForm.addEventListener('submit', handleSearch);
        console.log('✅ Search form submit event listener added');
    } else {
        console.error('❌ Search form not found!');
    }
}

// Function to show document upload - shows upload form
function showDocumentUpload() {
    console.log('📤 showDocumentUpload called - showing upload form');
    
    // First ensure we're in documents section
    showDocumentsSection();
    
    // Then show the upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        console.log('📋 Upload form found, showing it');
        uploadForm.style.display = 'block';
        uploadForm.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error('❌ Upload form not found!');
    }
}

function setupEventListeners() {
    console.log('🎛️ Setting up event listeners...');
    
    // Document upload form
    const uploadForm = document.getElementById('documentUploadForm');
    console.log('📋 Upload form found:', !!uploadForm);
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleDocumentUpload);
        console.log('✅ Submit event listener added to upload form');
    }
    
    // File input handler
    const fileInput = document.getElementById('documentFile');
    console.log('📁 File input found:', !!fileInput);
    if (fileInput) {
        // Add multiple test listeners
        fileInput.addEventListener('change', function(e) {
            console.log('🔥 DIRECT CHANGE EVENT TRIGGERED!');
            console.log('Files count:', e.target.files.length);
            if (e.target.files.length > 0) {
                console.log('📄 Selected file:', e.target.files[0].name);
            }
        });
        
        fileInput.addEventListener('change', handleFileSelection);
        console.log('✅ Change event listener added to file input');
        
        // Test click detection
        fileInput.addEventListener('click', function(e) {
            console.log('👆 FILE INPUT DIRECTLY CLICKED!');
        });
        
        // Debug element state
        console.log('🔍 File input debug info:', {
            id: fileInput.id,
            type: fileInput.type,
            disabled: fileInput.disabled,
            offsetWidth: fileInput.offsetWidth,
            offsetHeight: fileInput.offsetHeight,
            parentElement: fileInput.parentElement?.className
        });
    }
    
    // Drag and drop handlers
    const uploadZone = document.querySelector('.upload-zone-content');
    console.log('🎯 Upload zone found:', !!uploadZone);
    if (uploadZone) {
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleDrop);
        
        // Add click handler to upload zone to trigger file input
        uploadZone.addEventListener('click', function(e) {
            console.log('🖱️ UPLOAD ZONE CLICKED!');
            console.log('Target:', e.target.tagName, e.target.className);
            
            // Prevent default if clicking on input itself
            if (e.target.tagName === 'INPUT') {
                console.log('📎 Direct input click, allowing default');
                return;
            }
            
            // Find and trigger file input
            const fileInput = document.getElementById('documentFile');
            if (fileInput) {
                console.log('🔧 Triggering file input click programmatically...');
                fileInput.click();
            } else {
                console.error('❌ File input not found for zone click!');
            }
        });
        
        console.log('✅ Drag & drop + click event listeners added');
    }

    // Chat form
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatMessage);
    }

    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
}

async function loadDashboardData() {
    console.log('Starting dashboard data load...');
    
    try {
        showLoading();
        
        // Load stats and recent documents with error handling
        let statsData = { 
            total_documents: 0, 
            processed_documents: 0, 
            processing_rate: 0, 
            file_type_distribution: {} 
        };
        let documentsData = [];
        
        try {
            console.log('🔍 Loading stats from /api/search/stats...');
            const statsResponse = await axios.get('/api/search/stats');
            statsData = statsResponse.data;
            console.log('✅ Stats loaded successfully:', statsData);
            console.log('📊 Total documents:', statsData.total_documents);
            console.log('✅ Processed documents:', statsData.processed_documents);
            console.log('📈 Processing rate:', statsData.processing_rate);
            console.log('📁 File types:', statsData.file_type_distribution);
        } catch (error) {
            console.error('❌ Stats loading failed:', error);
            console.error('❌ Error details:', error.response?.data);
            console.error('❌ Status code:', error.response?.status);
        }
        
        try {
            console.log('📄 Loading documents from /api/documents/?limit=5...');
            const documentsResponse = await axios.get('/api/documents/?limit=5');
            documentsData = documentsResponse.data;
            console.log('✅ Documents loaded successfully:', documentsData);
            console.log('📝 Documents count:', documentsData.length);
        } catch (error) {
            console.error('❌ Documents loading failed:', error);
            console.error('❌ Error details:', error.response?.data);
            console.error('❌ Status code:', error.response?.status);
        }
        
        dashboardData.stats = statsData;
        dashboardData.recentDocuments = documentsData;
        
        console.log('Updating dashboard UI...');
        updateDashboardStats();
        updateRecentDocuments();
        console.log('Dashboard data load completed successfully');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Dashboard verileri yüklenirken hata oluştu');
        
        // Set default values
        dashboardData.stats = { 
            total_documents: 0, 
            processed_documents: 0, 
            processing_rate: 0, 
            file_type_distribution: {} 
        };
        dashboardData.recentDocuments = [];
        updateDashboardStats();
        updateRecentDocuments();
    } finally {
        console.log('Hiding loading modal...');
        // Add a small delay to ensure all DOM operations are complete
        setTimeout(() => {
            hideLoading();
            console.log('Loading modal hidden');
        }, 500);
    }
}

function updateDashboardStats() {
    console.log('🔄 Updating dashboard stats...');
    const stats = dashboardData.stats;
    console.log('📊 Stats data:', stats);
    
    // Update stat cards
    const totalDocs = stats.total_documents || 0;
    const processedDocs = stats.processed_documents || 0;
    const processingDocs = totalDocs - processedDocs;
    const processingRate = (stats.processing_rate || 0) + '%';
    
    console.log('📈 Setting values:', {
        totalDocs,
        processedDocs,
        processingDocs,
        processingRate
    });
    
    // Check if elements exist before updating
    const totalDocsEl = document.getElementById('totalDocs');
    const processedDocsEl = document.getElementById('processedDocs');
    const processingDocsEl = document.getElementById('processingDocs');
    const processingRateEl = document.getElementById('processingRate');
    
    if (totalDocsEl) {
        totalDocsEl.textContent = totalDocs;
        console.log('✅ Updated totalDocs:', totalDocs);
    } else {
        console.error('❌ Element totalDocs not found!');
    }
    
    if (processedDocsEl) {
        processedDocsEl.textContent = processedDocs;
        console.log('✅ Updated processedDocs:', processedDocs);
    } else {
        console.error('❌ Element processedDocs not found!');
    }
    
    if (processingDocsEl) {
        processingDocsEl.textContent = processingDocs;
        console.log('✅ Updated processingDocs:', processingDocs);
    } else {
        console.error('❌ Element processingDocs not found!');
    }
    
    if (processingRateEl) {
        processingRateEl.textContent = processingRate;
        console.log('✅ Updated processingRate:', processingRate);
    } else {
        console.error('❌ Element processingRate not found!');
    }
    
    // Update file type chart
    console.log('📊 Updating file type chart...');
    updateFileTypeChart(stats.file_type_distribution || {});
}

function updateRecentDocuments() {
    const container = document.getElementById('recentDocuments');
    if (!container) return;

    if (dashboardData.recentDocuments.length === 0) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-file-alt"></i>
                <p>Henüz döküman yüklenmemiş</p>
            </div>
        `;
        return;
    }

    const documentsHtml = dashboardData.recentDocuments.map(doc => `
        <div class="recent-doc-item">
            <div class="recent-doc-icon ${doc.file_type.toLowerCase()}">
                <i class="fas fa-file-${getFileTypeIcon(doc.file_type)}"></i>
            </div>
            <div class="recent-doc-info">
                <div class="recent-doc-name">${doc.original_filename}</div>
                <div class="recent-doc-meta">
                    <div class="recent-doc-date">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatDate(doc.upload_date)}</span>
                    </div>
                    <div class="recent-doc-status">
                        <i class="fas fa-${doc.processed ? 'check-circle' : 'clock'}"></i>
                        <span>${doc.processed ? 'İşlendi' : 'İşleniyor'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = documentsHtml;
}

function updateFileTypeChart(fileTypes) {
    const container = document.getElementById('fileTypeChart');
    if (!container) return;

    if (Object.keys(fileTypes).length === 0) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-pie"></i>
                <p>Veri bulunamıyor</p>
            </div>
        `;
        return;
    }

    const total = Object.values(fileTypes).reduce((sum, count) => sum + count, 0);
    const chartHtml = Object.entries(fileTypes).map(([type, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="file-type-item">
                <div class="file-type-info">
                    <div class="file-type-icon ${type.toLowerCase()}">
                        <i class="fas fa-file-${getFileTypeIcon(type)}"></i>
                    </div>
                    <div class="file-type-details">
                        <div class="file-type-name">${type.toUpperCase()}</div>
                        <div class="file-type-count">${count} dosya</div>
                    </div>
                </div>
                <div class="file-type-percentage">
                    <span>${percentage}%</span>
                    <div class="file-type-bar">
                        <div class="file-type-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = chartHtml;
}

// Helper function to get file type icon
function getFileTypeIcon(fileType) {
    const iconMap = {
        'pdf': 'pdf',
        'docx': 'word',
        'doc': 'word',
        'xlsx': 'excel',
        'xls': 'excel',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'txt': 'alt'
    };
    return iconMap[fileType.toLowerCase()] || 'alt';
}

// Refresh functions for dashboard sections
function refreshRecentDocuments() {
    console.log('🔄 Refreshing recent documents...');
    loadDashboardData();
}

function refreshFileTypeChart() {
    console.log('🔄 Refreshing file type chart...');
    loadDashboardData();
}

// Document upload handler
async function handleDocumentUpload(e) {
    console.log('🚀 handleDocumentUpload called');
    e.preventDefault();
    
    console.log('📋 Form data processing...');
    const formData = new FormData(e.target);
    const file = formData.get('file');
    
    console.log('📄 File from form:', file);
    console.log('File details:', {
        name: file?.name,
        size: file?.size,
        type: file?.type
    });
    
    if (!file) {
        console.error('❌ No file found in form data');
        showError('Lütfen bir dosya seçin');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    console.log('🔘 Submit button found:', !!submitBtn);
    console.log('Original button text:', originalText);
    
    try {
        console.log('⏳ Starting upload process...');
        
        // Update button state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="btn-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span class="btn-text">Yükleniyor...</span>
        `;
        
        console.log('✅ Button state updated');
        showLoading();
        console.log('✅ Loading overlay shown');
        
        console.log('🌐 Making POST request to /api/documents/upload');
        const response = await axios.post('/api/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log('✅ Upload response received:', response.data);
        showSuccess('Döküman başarıyla yüklendi! AI analizi başlatıldı.');
        console.log('✅ Success message shown');
        
        // Reset form and hide upload
        console.log('🔄 Resetting form and clearing selection...');
        
        try {
            e.target.reset();
            console.log('✅ Form reset completed');
        } catch (resetError) {
            console.log('⚠️ Form reset error:', resetError);
        }
        
        try {
            clearFileSelection();
            console.log('✅ File selection cleared');
        } catch (clearError) {
            console.log('⚠️ Clear selection error:', clearError);
        }
        
        try {
            hideDocumentUpload();
            console.log('✅ Upload form hidden');
        } catch (hideError) {
            console.log('⚠️ Hide upload error:', hideError);
        }
        
        // Check current section
        const documentsSection = document.getElementById('documentsSection');
        const isDocumentsVisible = documentsSection && documentsSection.style.display !== 'none';
        console.log('📂 Documents section visible:', isDocumentsVisible);
        
        // Always reload documents regardless of current view
        console.log('⏰ Scheduling document reload in 500ms...');
        setTimeout(() => {
            console.log('🔄 Executing document reload...');
            if (typeof loadDocuments === 'function') {
                console.log('✅ loadDocuments function exists, calling...');
                loadDocuments();
            } else {
                console.error('❌ loadDocuments function not found!');
            }
        }, 500);
        
        // Refresh dashboard data
        console.log('⏰ Scheduling dashboard reload in 1000ms...');
        setTimeout(() => {
            console.log('🔄 Executing dashboard reload...');
            if (typeof loadDashboardData === 'function') {
                console.log('✅ loadDashboardData function exists, calling...');
                loadDashboardData();
            } else {
                console.error('❌ loadDashboardData function not found!');
            }
        }, 1000);
        
    } catch (error) {
        console.error('💥 Upload error:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        const errorMsg = error.response?.data?.detail || 'Döküman yüklenirken hata oluştu';
        
        try {
            showError(errorMsg);
            console.log('✅ Error message displayed');
        } catch (toastError) {
            console.log('⚠️ Toast error:', toastError);
            // Fallback to alert if toast fails
            alert('Hata: ' + errorMsg);
        }
    } finally {
        console.log('🔚 Upload process finished, resetting button...');
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        hideLoading();
        console.log('✅ Button and loading reset complete');
    }
}

// File selection handler
function handleFileSelection(e) {
    console.log('🔍 handleFileSelection called');
    console.log('Event:', e);
    console.log('Files:', e.target.files);
    
    const file = e.target.files[0];
    const uploadZone = document.querySelector('.upload-zone-content');
    
    console.log('File object:', file);
    console.log('Upload zone found:', !!uploadZone);
    
    if (!uploadZone) {
        console.error('❌ Upload zone not found!');
        return;
    }
    
    const uploadIcon = uploadZone.querySelector('.upload-icon');
    const uploadTitle = uploadZone.querySelector('h3');
    const uploadText = uploadZone.querySelector('p');
    
    console.log('Upload elements found:', {
        icon: !!uploadIcon,
        title: !!uploadTitle,
        text: !!uploadText
    });
    
    if (file) {
        console.log('📄 File selected:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        });
        
        // Show selected file feedback
        uploadZone.style.borderColor = 'var(--neon-green)';
        uploadZone.style.background = 'rgba(0, 255, 136, 0.05)';
        
        if (uploadIcon) {
            uploadIcon.innerHTML = '<i class="fas fa-file-check"></i>';
            console.log('✅ Icon updated to file-check');
        }
        
        if (uploadTitle) {
            uploadTitle.textContent = `Seçilen: ${file.name}`;
            console.log('✅ Title updated:', uploadTitle.textContent);
        }
        
        if (uploadText) {
            uploadText.textContent = `${formatFileSize(file.size)} • Yüklemek için butona basın`;
            console.log('✅ Text updated:', uploadText.textContent);
        }
        
        // Add selected class for styling
        uploadZone.classList.add('file-selected');
        console.log('✅ file-selected class added');
        
    } else {
        console.log('❌ No file selected');
    }
}

function clearFileSelection() {
    console.log('🧹 clearFileSelection called');
    
    const uploadZone = document.querySelector('.upload-zone-content');
    console.log('Upload zone found for clear:', !!uploadZone);
    
    if (!uploadZone) {
        console.log('❌ Upload zone not found, skipping clear');
        return;
    }
    
    const uploadIcon = uploadZone.querySelector('.upload-icon');
    const uploadTitle = uploadZone.querySelector('h3');
    const uploadText = uploadZone.querySelector('p');
    
    console.log('Clear elements found:', {
        icon: !!uploadIcon,
        title: !!uploadTitle,
        text: !!uploadText
    });
    
    // Reset to original state
    uploadZone.style.borderColor = 'rgba(0, 255, 136, 0.3)';
    uploadZone.style.background = 'rgba(0, 255, 136, 0.02)';
    
    if (uploadIcon) {
        uploadIcon.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
        console.log('✅ Icon reset');
    }
    
    if (uploadTitle) {
        uploadTitle.textContent = 'Dosyalarınızı buraya sürükleyin';
        console.log('✅ Title reset');
    }
    
    if (uploadText) {
        uploadText.textContent = 'veya dosya seçmek için tıklayın';
        console.log('✅ Text reset');
    }
    
    // Remove selected class
    uploadZone.classList.remove('file-selected');
    console.log('✅ File selection cleared completely');
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadZone = e.currentTarget;
    uploadZone.classList.add('drag-over');
    uploadZone.style.borderColor = 'var(--neon-green)';
    uploadZone.style.background = 'rgba(0, 255, 136, 0.1)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadZone = e.currentTarget;
    uploadZone.classList.remove('drag-over');
    if (!uploadZone.classList.contains('file-selected')) {
        uploadZone.style.borderColor = 'rgba(0, 255, 136, 0.3)';
        uploadZone.style.background = 'rgba(0, 255, 136, 0.02)';
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const uploadZone = e.currentTarget;
    uploadZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('documentFile');
        fileInput.files = files;
        
        // Trigger file selection handler
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }
}

// Chat functionality
async function loadChatSessions() {
    try {
        const response = await axios.get('/api/chat/sessions');
        chatSessions = response.data;
        renderChatSessions();
    } catch (error) {
        showError('Chat oturumları yüklenirken hata oluştu');
        console.error('Error loading chat sessions:', error);
    }
}

function renderChatSessions() {
    const container = document.getElementById('chatSessions');
    if (!container) return;

    if (chatSessions.length === 0) {
        container.innerHTML = `
            <div style="padding: 24px; text-align: center;">
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 14px;">
                    <i class="fas fa-comment-dots" style="font-size: 32px; margin-bottom: 12px; color: #00ff88; opacity: 0.5;"></i>
                    <p style="margin: 0;">Henüz sohbet oturumu yok</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px;">Yeni bir sohbet başlatın</p>
                </div>
            </div>
        `;
        return;
    }

    const sessionsHtml = chatSessions.map(session => `
        <div class="chat-session-card ${currentChatSession?.id === session.id ? 'active' : ''}"
             onclick="selectChatSession(${session.id})">
            <div class="chat-session-header">
                <div class="chat-session-avatar">
                    <i class="fas fa-comment-dots"></i>
                </div>
                <div class="chat-session-info">
                    <div class="chat-session-title">${session.session_name}</div>
                    <div class="chat-session-time">${formatDate(session.updated_at || session.created_at)}</div>
                </div>
                <button class="chat-session-delete"
                        onclick="deleteChatSession(${session.id}, event)"
                        title="Sohbeti Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="chat-session-preview">
                Son mesaj özeti...
            </div>
        </div>
    `).join('');

    container.innerHTML = sessionsHtml;
}

async function createNewChatSession() {
    const sessionName = prompt('Sohbet oturumu adı:', 'Yeni Sohbet');
    if (!sessionName) return;

    try {
        const response = await axios.post(`/api/chat/sessions?session_name=${encodeURIComponent(sessionName)}`);
        const newSession = response.data;
        
        chatSessions.unshift(newSession);
        renderChatSessions();
        selectChatSession(newSession.id);
        
        showSuccess('Yeni sohbet oturumu oluşturuldu');
    } catch (error) {
        showError('Sohbet oturumu oluşturulurken hata oluştu');
        console.error('Error creating chat session:', error);
    }
}

async function selectChatSession(sessionId) {
    currentChatSession = chatSessions.find(s => s.id === sessionId);
    if (!currentChatSession) return;

    document.getElementById('chatSessionName').textContent = currentChatSession.session_name;
    renderChatSessions(); // Re-render to update active state
    
    // Load messages
    try {
        const response = await axios.get(`/api/chat/sessions/${sessionId}/messages`);
        const messages = response.data;
        renderChatMessages(messages);
    } catch (error) {
        showError('Mesajlar yüklenirken hata oluştu');
        console.error('Error loading messages:', error);
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-content">
                    <i class="fas fa-robot"></i>
                    <h4>Merhaba! Size nasıl yardımcı olabilirim?</h4>
                    <p>Dökümanlarınız hakkında soru sorabilir, analiz isteyebilir veya bilgi arayabilirsiniz.</p>
                </div>
            </div>
        `;
        return;
    }

    const messagesHtml = messages.map(message => `
        <div class="message-bubble ${message.message_type}">
            <div class="message-content">${message.content}</div>
            <div class="message-time">${formatDate(message.timestamp)}</div>
        </div>
    `).join('');

    container.innerHTML = messagesHtml;
    container.scrollTop = container.scrollHeight;
}

async function handleChatMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    try {
        // Clear welcome message if present
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Add user message to UI immediately
        const userMessageHtml = `
            <div class="message-bubble user">
                <div class="message-content">${message}</div>
                <div class="message-time">${formatDate(new Date().toISOString())}</div>
            </div>
        `;
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', userMessageHtml);
        
        input.value = '';
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        
        // Show typing indicator
        const typingHtml = `
            <div class="message-bubble assistant typing-indicator" id="typingIndicator">
                <div class="message-content">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="display: flex; gap: 4px;">
                            <div style="width: 6px; height: 6px; background: #00ff88; border-radius: 50%; animation: typing 1.4s ease-in-out infinite;"></div>
                            <div style="width: 6px; height: 6px; background: #00ff88; border-radius: 50%; animation: typing 1.4s ease-in-out infinite 0.2s;"></div>
                            <div style="width: 6px; height: 6px; background: #00ff88; border-radius: 50%; animation: typing 1.4s ease-in-out infinite 0.4s;"></div>
                        </div>
                        <span style="color: rgba(255, 255, 255, 0.7); font-size: 13px;">AI yazıyor...</span>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', typingHtml);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        
        // Send message to API
        const response = await axios.post('/api/chat/', {
            message: message,
            session_id: currentChatSession?.id
        });
        
        const chatResponse = response.data;
        
        // Remove typing indicator
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Update current session if new one was created
        if (!currentChatSession || currentChatSession.id !== chatResponse.session_id) {
            currentChatSession = { id: chatResponse.session_id, session_name: 'Yeni Sohbet' };
            loadChatSessions(); // Reload sessions
        }
        
        // Add AI response to UI
        const aiMessageHtml = `
            <div class="message-bubble assistant">
                <div class="message-content">${chatResponse.response}</div>
                <div class="message-time">${formatDate(new Date().toISOString())}</div>
            </div>
        `;
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', aiMessageHtml);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        
    } catch (error) {
        showError('Mesaj gönderilirken hata oluştu');
        console.error('Error sending message:', error);
    }
}

async function deleteChatSession(sessionId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!confirm('Bu sohbet oturumunu silmek istediğinizden emin misiniz?')) return;

    try {
        await axios.delete(`/api/chat/sessions/${sessionId}`);
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        
        if (currentChatSession?.id === sessionId) {
            currentChatSession = null;
            document.getElementById('chatMessages').innerHTML = `
                <div class="text-muted text-center p-4">
                    Bir sohbet oturumu seçin veya yeni bir tane oluşturun.
                </div>
            `;
        }
        
        renderChatSessions();
        showSuccess('Sohbet oturumu silindi');
    } catch (error) {
        showError('Sohbet oturumu silinirken hata oluştu');
        console.error('Error deleting chat session:', error);
    }
}

// Search functionality
async function loadSearchFilters() {
    try {
        const response = await axios.get('/api/search/filters');
        const filters = response.data;
        
        const fileTypeSelect = document.getElementById('searchFileType');
        if (fileTypeSelect) {
            fileTypeSelect.innerHTML = '<option value="">Tüm Dosya Tipleri</option>';
            filters.file_types.forEach(type => {
                fileTypeSelect.innerHTML += `<option value="${type}">${type.toUpperCase()}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading search filters:', error);
    }
}

async function handleSearch(e) {
    e.preventDefault();
    
    const query = document.getElementById('searchQuery').value.trim();
    const fileType = document.getElementById('searchFileType').value;
    
    if (!query) {
        showError('Lütfen arama terimi girin');
        return;
    }

    try {
        showLoading();
        
        const searchRequest = {
            query: query,
            limit: 20
        };
        
        if (fileType) {
            searchRequest.document_types = [fileType];
        }
        
        const response = await axios.post('/api/search/', searchRequest);
        const results = response.data;
        
        renderSearchResults(results);
        
    } catch (error) {
        showError('Arama yapılırken hata oluştu');
        console.error('Error performing search:', error);
    } finally {
        hideLoading();
    }
}

function renderSearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.documents.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center p-4">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>Sonuç bulunamadı</h5>
                    <p class="text-muted">Arama kriterlerinizle eşleşen döküman bulunamadı.</p>
                </div>
            </div>
        `;
        return;
    }

    const resultsHtml = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-search me-2"></i>
                    Arama Sonuçları (${results.total_results} sonuç)
                </h5>
            </div>
            <div class="card-body">
                ${results.documents.map(doc => `
                    <div class="search-result-item">
                        <div class="d-flex align-items-start">
                            <div class="file-icon ${getFileTypeColor(doc.file_type)} me-3">
                                <i class="${getFileIconClass(doc.file_type)}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${doc.original_filename}</h6>
                                <p class="text-muted mb-2">
                                    ${formatFileSize(doc.file_size)} • ${formatDate(doc.upload_date)}
                                </p>

                                <div class="search-result-actions">
                                    <button class="btn-futuristic btn-futuristic-primary btn-sm" onclick="viewDocument(${doc.id})">
                                        <span class="btn-icon">
                                            <i class="fas fa-eye"></i>
                                        </span>
                                        <span class="btn-text">Görüntüle</span>
                                    </button>
                                    <button class="btn-futuristic btn-futuristic-secondary btn-sm" onclick="viewDocumentContent(${doc.id})">
                                        <span class="btn-icon">
                                            <i class="fas fa-file-alt"></i>
                                        </span>
                                        <span class="btn-text">İçerik</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = resultsHtml;
}

// Global event listener setup - simplified
console.log('🌐 Dashboard.js loaded');

// Single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOMContentLoaded in dashboard.js');
    
    // Check if we're on documents page and setup event listeners
    if (window.location.pathname === '/documents') {
        console.log('📄 Documents page detected, setting up event listeners...');
        setupEventListeners();
    }
});
