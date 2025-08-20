// Dashboard specific functionality

let dashboardData = {
    stats: {},
    recentDocuments: []
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/dashboard') {
        console.log('Dashboard page loaded');
        if (!requireAuth()) return;
        
        // Ensure all elements are loaded before proceeding
        if (document.readyState === 'complete') {
            initializeDashboard();
        } else {
            window.addEventListener('load', initializeDashboard);
        }
    }
});

function initializeDashboard() {
    console.log('Initializing dashboard...');
    setupEventListeners();
    loadDashboardData();
}

function setupEventListeners() {
    // Document upload form
    const uploadForm = document.getElementById('documentUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleDocumentUpload);
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
            console.log('Loading stats...');
            const statsResponse = await axios.get('/api/search/stats');
            statsData = statsResponse.data;
            console.log('Stats loaded:', statsData);
        } catch (error) {
            console.warn('Stats loading failed:', error);
        }
        
        try {
            console.log('Loading documents...');
            const documentsResponse = await axios.get('/api/documents/?limit=5');
            documentsData = documentsResponse.data;
            console.log('Documents loaded:', documentsData);
        } catch (error) {
            console.warn('Documents loading failed:', error);
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
    const stats = dashboardData.stats;
    
    // Update stat cards
    document.getElementById('totalDocs').textContent = stats.total_documents || 0;
    document.getElementById('processedDocs').textContent = stats.processed_documents || 0;
    document.getElementById('processingDocs').textContent = 
        (stats.total_documents || 0) - (stats.processed_documents || 0);
    document.getElementById('processingRate').textContent = (stats.processing_rate || 0) + '%';
    
    // Update file type chart
    updateFileTypeChart(stats.file_type_distribution || {});
}

function updateRecentDocuments() {
    const container = document.getElementById('recentDocuments');
    if (!container) return;

    if (dashboardData.recentDocuments.length === 0) {
        container.innerHTML = `
            <div class="text-center p-3">
                <i class="fas fa-file-alt fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-0">Henüz döküman yüklenmemiş</p>
            </div>
        `;
        return;
    }

    const documentsHtml = dashboardData.recentDocuments.map(doc => `
        <div class="d-flex align-items-center mb-3 p-2 border rounded">
            <div class="file-icon ${getFileTypeColor(doc.file_type)} me-3" style="width: 32px; height: 32px; font-size: 0.9rem;">
                <i class="${getFileIconClass(doc.file_type)}"></i>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-0 text-truncate">${doc.original_filename}</h6>
                <small class="text-muted">${formatDate(doc.upload_date)}</small>
            </div>
            <div class="text-end">
                <span class="badge ${doc.processed ? 'bg-success' : 'bg-warning'}">
                    ${doc.processed ? 'İşlendi' : 'İşleniyor'}
                </span>
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
            <div class="text-center p-3">
                <i class="fas fa-chart-pie fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-0">Veri bulunmuyor</p>
            </div>
        `;
        return;
    }

    const total = Object.values(fileTypes).reduce((sum, count) => sum + count, 0);
    const chartHtml = Object.entries(fileTypes).map(([type, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <i class="${getFileIconClass(type)} me-2"></i>
                    <span>${type.toUpperCase()}</span>
                </div>
                <div class="text-end">
                    <span class="fw-bold">${count}</span>
                    <small class="text-muted">(${percentage}%)</small>
                </div>
            </div>
            <div class="progress mb-3" style="height: 6px;">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
        `;
    }).join('');

    container.innerHTML = chartHtml;
}

// Document upload handler
async function handleDocumentUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const file = formData.get('file');
    
    if (!file) {
        showError('Lütfen bir dosya seçin');
        return;
    }

    try {
        showLoading();
        
        const response = await axios.post('/api/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        showSuccess('Döküman başarıyla yüklendi! AI analizi başlatıldı.');
        e.target.reset();
        hideDocumentUpload();
        
        // Refresh dashboard data
        setTimeout(() => loadDashboardData(), 2000);
        
    } catch (error) {
        showError(error.response?.data?.detail || 'Döküman yüklenirken hata oluştu');
        console.error('Error uploading document:', error);
    } finally {
        hideLoading();
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
            <div class="p-3 text-center">
                <p class="text-muted mb-0">Henüz sohbet oturumu yok</p>
            </div>
        `;
        return;
    }

    const sessionsHtml = chatSessions.map(session => `
        <a href="#" class="list-group-item list-group-item-action ${currentChatSession?.id === session.id ? 'active' : ''}"
           onclick="selectChatSession(${session.id})">
            <div class="d-flex justify-content-between align-items-center">
                <div class="text-truncate">
                    <h6 class="mb-1">${session.session_name}</h6>
                    <small class="text-muted">${formatDate(session.updated_at || session.created_at)}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteChatSession(${session.id}, event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </a>
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
            <div class="text-muted text-center p-4">
                Merhaba! Size nasıl yardımcı olabilirim? Dökümanlarınız hakkında soru sorabilirsiniz.
            </div>
        `;
        return;
    }

    const messagesHtml = messages.map(message => `
        <div class="chat-message ${message.message_type} slide-in">
            <div class="message-content">
                ${message.content}
            </div>
            <div class="message-time">
                ${formatDate(message.timestamp)}
            </div>
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
        // Add user message to UI immediately
        const userMessageHtml = `
            <div class="chat-message user slide-in">
                <div class="message-content">${message}</div>
                <div class="message-time">${formatDate(new Date().toISOString())}</div>
            </div>
        `;
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', userMessageHtml);
        
        input.value = '';
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        
        // Send message to API
        const response = await axios.post('/api/chat/', {
            message: message,
            session_id: currentChatSession?.id
        });
        
        const chatResponse = response.data;
        
        // Update current session if new one was created
        if (!currentChatSession || currentChatSession.id !== chatResponse.session_id) {
            currentChatSession = { id: chatResponse.session_id, session_name: 'Yeni Sohbet' };
            loadChatSessions(); // Reload sessions
        }
        
        // Add AI response to UI
        const aiMessageHtml = `
            <div class="chat-message assistant slide-in">
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
                                ${doc.summary ? `
                                    <p class="text-truncate-3 mb-2">${doc.summary}</p>
                                ` : ''}
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-primary" onclick="viewDocument(${doc.id})">
                                        <i class="fas fa-eye me-1"></i>Görüntüle
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDocumentContent(${doc.id})">
                                        <i class="fas fa-file-alt me-1"></i>İçerik
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
