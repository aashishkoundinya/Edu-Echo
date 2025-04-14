document.addEventListener('DOMContentLoaded', () => {
    const chatsGrid = document.getElementById('chats-grid');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    
    // Load all chat sessions
    async function loadChatSessions() {
        try {
            const response = await fetch('/api/sessions/');
            const data = await response.json();
            
            if (response.status === 200) {
                // Remove loading indicator
                chatsGrid.innerHTML = '';
                
                if (data.sessions.length === 0) {
                    // Show empty state if no sessions
                    emptyState.style.display = 'flex';
                    chatsGrid.style.display = 'none';
                } else {
                    // Hide empty state and show grid
                    emptyState.style.display = 'none';
                    chatsGrid.style.display = 'grid';
                    
                    // Add each session to the grid
                    data.sessions.forEach(session => {
                        addChatCard(session);
                    });
                    
                    // Add search functionality
                    setupSearch(data.sessions);
                }
            } else {
                console.error('Failed to load sessions:', data.error);
                showErrorState('Failed to load sessions. Please try again later.');
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            showErrorState('Error connecting to the server. Please check your connection.');
        }
    }
    
    // Add a chat card to the grid
    function addChatCard(session) {
        const card = document.createElement('div');
        card.classList.add('chat-card');
        card.setAttribute('data-session-id', session.id);
        card.setAttribute('data-topic', session.topic.toLowerCase());
        
        // Get session details
        const date = new Date(session.created_at);
        const formattedDate = formatDate(date);
        
        // Construct the card content
        card.innerHTML = `
            <div class="chat-topic">${session.topic}</div>
            <div class="chat-proficiency">${session.proficiency.charAt(0).toUpperCase() + session.proficiency.slice(1)}</div>
            <div class="chat-date">${formattedDate}</div>
            <div class="chat-messages">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span id="message-count-${session.id}">Loading messages...</span>
            </div>
            <div class="chat-confidence">
                <div class="confidence-label">
                    <span>Confidence Level</span>
                    <span id="confidence-value-${session.id}">--</span>
                </div>
                <div class="confidence-bar-container">
                    <div class="confidence-bar" id="confidence-bar-${session.id}" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        // Add click event to navigate to the chat
        card.addEventListener('click', () => {
            navigateToChat(session.id);
        });
        
        // Add the card to the grid
        chatsGrid.appendChild(card);
        
        // Load additional session details (message count and confidence)
        loadSessionDetails(session.id);
    }
    
    // Load additional session details
    async function loadSessionDetails(sessionId) {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/messages/`);
            
            if (response.status === 200) {
                const data = await response.json();
                
                // Update message count
                const messageCountElement = document.getElementById(`message-count-${sessionId}`);
                if (messageCountElement) {
                    const messageCount = data.messages.length;
                    messageCountElement.textContent = `${messageCount} message${messageCount !== 1 ? 's' : ''}`;
                }
                
                // Update confidence score
                let lastConfidence = 70; // Default
                
                // Find the last AI message with a confidence score
                const aiMessages = data.messages.filter(msg => !msg.is_user && msg.confidence_score !== null);
                if (aiMessages.length > 0) {
                    lastConfidence = aiMessages[aiMessages.length - 1].confidence_score;
                }
                
                const confidenceValueElement = document.getElementById(`confidence-value-${sessionId}`);
                const confidenceBarElement = document.getElementById(`confidence-bar-${sessionId}`);
                
                if (confidenceValueElement && confidenceBarElement) {
                    confidenceValueElement.textContent = `${lastConfidence}%`;
                    confidenceBarElement.style.width = `${lastConfidence}%`;
                    
                    // Change color based on confidence level
                    if (lastConfidence < 40) {
                        confidenceBarElement.style.background = 'var(--danger-color)';
                    } else if (lastConfidence < 70) {
                        confidenceBarElement.style.background = 'var(--warning-color)';
                    } else {
                        confidenceBarElement.style.background = 'linear-gradient(to right, var(--warning-color), var(--success-color))';
                    }
                }
            }
        } catch (error) {
            console.error(`Error loading details for session ${sessionId}:`, error);
        }
    }
    
    // Navigate to chat
    function navigateToChat(sessionId) {
        // Store the session ID to load on the chat page
        sessionStorage.setItem('load_session_id', sessionId);
        window.location.href = '/chat/';
    }
    
    // Format date
    function formatDate(date) {
        const now = new Date();
        
        // If today, just show time
        if (date.toDateString() === now.toDateString()) {
            return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If yesterday
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If this year, show month and day
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                   ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Otherwise show full date
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) +
               ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Setup search functionality
    function setupSearch(sessions) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            
            // Get all chat cards
            const cards = document.querySelectorAll('.chat-card');
            
            // Filter cards based on search term
            cards.forEach(card => {
                const topic = card.getAttribute('data-topic');
                
                if (topic.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Show empty state if no results
            const visibleCards = document.querySelectorAll('.chat-card[style="display: block"]');
            if (visibleCards.length === 0 && searchTerm) {
                emptyState.style.display = 'flex';
                emptyState.querySelector('h2').textContent = 'No matching chats found';
                emptyState.querySelector('p').textContent = `No chats match "${searchTerm}"`;
            } else {
                emptyState.style.display = 'none';
            }
        });
    }
    
    // Show error state
    function showErrorState(message) {
        chatsGrid.innerHTML = '';
        emptyState.style.display = 'flex';
        emptyState.querySelector('h2').textContent = 'Something went wrong';
        emptyState.querySelector('p').textContent = message;
    }
    
    // Load chat sessions when page loads
    loadChatSessions();
});