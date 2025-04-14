document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidencePercentage = document.getElementById('confidence-percentage');
    const currentTopicTitle = document.getElementById('current-topic-title');
    const proficiencyBadge = document.getElementById('proficiency-badge');
    const topicPlaceholder = document.getElementById('topic-placeholder');
    const topicsList = document.getElementById('topics-list');
    const newTopicBtn = document.getElementById('new-topic-btn');

    // Get session data from sessionStorage
    const topic = sessionStorage.getItem('topic') || 'Unknown Topic';
    const proficiency = sessionStorage.getItem('proficiency') || 'intermediate';
    const hfToken = sessionStorage.getItem('hf_token');
    
    // Set initial values
    currentTopicTitle.textContent = topic;
    proficiencyBadge.textContent = proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
    topicPlaceholder.textContent = topic;
    
    // Session management
    let sessionId = null;
    let confidenceScore = 70; // Default starting confidence

    // Update confidence meter
    function updateConfidenceMeter(score) {
        confidenceScore = score;
        confidenceBar.style.width = `${score}%`;
        confidencePercentage.textContent = `${score}%`;
        
        // Change color based on confidence level
        if (score < 40) {
            confidenceBar.style.background = 'var(--danger-color)';
        } else if (score < 70) {
            confidenceBar.style.background = 'var(--warning-color)';
        } else {
            confidenceBar.style.background = 'linear-gradient(to right, var(--warning-color), var(--success-color))';
        }
    }

    // Add a message to the chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Format date for display
    function formatDate(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        
        // If today, just show time
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If this year, show month and day
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        
        // Otherwise show full date
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Helper function to create a topic item element
    function createTopicItem(topicName, sessionId, createdAt, isActive = false) {
        const topicItem = document.createElement('div');
        topicItem.classList.add('topic-item');
        if (isActive) topicItem.classList.add('active');
        
        topicItem.innerHTML = `
            <div class="topic-name">${topicName}</div>
            <div class="topic-date">${formatDate(createdAt)}</div>
        `;
        
        // Add click event to load this session
        topicItem.addEventListener('click', function() {
            console.log(`Topic clicked: ${topicName}, Session ID: ${sessionId}`);
            loadSessionChat(sessionId);
        });
        
        return topicItem;
    }

    // Load sessions function
    async function loadSessions() {
        try {
            const response = await fetch('/api/sessions/');
            const data = await response.json();
            
            if (response.status === 200) {
                console.log(`Loaded ${data.sessions.length} sessions`);
                
                // Clear the current list
                topicsList.innerHTML = '';
                
                // Add each session to the list
                data.sessions.forEach(session => {
                    const topicItem = createTopicItem(
                        session.topic, 
                        session.id, 
                        session.created_at,
                        session.id === sessionId // Is this the active session?
                    );
                    topicsList.appendChild(topicItem);
                });
            } else {
                console.error('Failed to load sessions:', data.error);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    // Function to load a session's messages
    async function loadSessionChat(clickedSessionId) {
        console.log(`Attempting to load session: ${clickedSessionId}`);
        if (clickedSessionId === sessionId) {
            console.log('Already on this session, not reloading');
            return; // Already loaded
        }
        
        showLoading();
        
        try {
            console.log(`Fetching messages for session ${clickedSessionId}`);
            const response = await fetch(`/api/sessions/${clickedSessionId}/messages/`);
            console.log(`Response status: ${response.status}`);
            
            if (response.status === 200) {
                const data = await response.json();
                console.log(`Successfully loaded session with ${data.messages.length} messages`);
                
                // Update the session ID
                sessionId = clickedSessionId;
                
                // Update the UI with session info
                currentTopicTitle.textContent = data.session.topic;
                proficiencyBadge.textContent = data.session.proficiency.charAt(0).toUpperCase() + 
                                            data.session.proficiency.slice(1);
                
                // Clear the chat container
                chatContainer.innerHTML = '';
                
                // Add all messages
                data.messages.forEach(msg => {
                    addMessage(msg.content, msg.is_user);
                    
                    // Update confidence if it's an AI message
                    if (!msg.is_user && msg.confidence_score !== null) {
                        updateConfidenceMeter(msg.confidence_score);
                    }
                });
                
                // Update topic list UI to reflect active session
                document.querySelectorAll('.topic-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Find and mark the clicked session as active
                const items = document.querySelectorAll('.topic-item');
                for (let i = 0; i < items.length; i++) {
                    if (items[i].querySelector('.topic-name').textContent === data.session.topic) {
                        items[i].classList.add('active');
                        break;
                    }
                }
            } else {
                const errorData = await response.json();
                console.error('Failed to load session chat:', errorData.error);
            }
        } catch (error) {
            console.error('Error loading session chat:', error);
        } finally {
            hideLoading();
        }
    }

    // Add topic to history list
    function addTopicToHistory(topicName, sessionId, isActive = true) {
        // Instead of manually adding, now we'll just reload all sessions
        loadSessions();
    }

    // Initialize session
    async function initializeSession() {
        showLoading();
        
        try {
            const response = await fetch('/api/start_session/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    proficiency
                })
            });
            
            const data = await response.json();
            
            if (response.status === 200) {
                sessionId = data.session_id;
                console.log(`Session initialized with ID: ${sessionId}`);
                
                // Load sessions to update the sidebar
                loadSessions();
            } else {
                console.error('Failed to initialize session:', data.error);
                addMessage('Sorry, I had trouble starting our session. Please try again.', false);
            }
        } catch (error) {
            console.error('Error initializing session:', error);
            addMessage('Sorry, I had trouble connecting to the server. Please check your connection and try again.', false);
        } finally {
            hideLoading();
        }
    }

    // Send message to API
    async function sendMessage(message) {
        if (!sessionId) {
            console.error('No active session.');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    message,
                    hf_token: hfToken
                })
            });
            
            const data = await response.json();
            
            if (response.status === 200) {
                addMessage(data.response, false);
                updateConfidenceMeter(data.confidence_score);
            } else {
                console.error('Failed to send message:', data.error);
                addMessage('Sorry, I had trouble processing your message. Please try again.', false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Fallback to direct API call if Django backend fails
            fallbackToDirectAPI(message);
        } finally {
            hideLoading();
        }
    }

    // Direct API call fallback (in case Django server fails)
    async function fallbackToDirectAPI(message) {
        try {
            console.log("Attempting direct API call to Hugging Face");
            
            // Create a prompt for the Hugging Face API
            const prompt = `
            You are an AI student learning from a human teacher about ${topic}.
            The human teacher has ${proficiency} knowledge about this topic.
            
            Your goal is to learn from them while asking insightful questions that help them reinforce their knowledge.
            
            If they explain something correctly, ask follow-up questions that help them elaborate further.
            
            If they explain something incorrectly, don't correct them directly, but ask strategic questions
            that help them realize their misunderstanding. For example, if they say plants use oxygen instead
            of CO2 for photosynthesis, ask "That's interesting - if plants use oxygen, what do they release
            during photosynthesis?"
            
            Human teacher: ${message}
            
            AI student:
            `;
            
            const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 200,
                        temperature: 0.7,
                        top_p: 0.9,
                        do_sample: true
                    }
                })
            });
            
            const data = await response.json();
            console.log("Received fallback API response");
            
            if (data && data[0] && data[0].generated_text) {
                // Extract just the AI response part
                const fullResponse = data[0].generated_text;
                const aiResponsePart = fullResponse.split('AI student:')[1]?.trim() || 
                                      "I'm having trouble processing that. Could you explain it again?";
                
                addMessage(aiResponsePart, false);
                
                // Simple confidence calculation for fallback mode
                const questionCount = (aiResponsePart.match(/\?/g) || []).length;
                const newConfidence = Math.min(confidenceScore + (questionCount > 0 ? 5 : -5), 100);
                updateConfidenceMeter(newConfidence);
            } else {
                addMessage("I'm sorry, I'm having trouble connecting to my knowledge base. Could we try again later?", false);
            }
        } catch (error) {
            console.error('Fallback API error:', error);
            addMessage("I'm sorry, there seems to be a connection issue. Please check your internet connection and try again.", false);
        }
    }

    // Handle form submission
    function handleSubmit() {
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, true);
        
        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Send to API
        sendMessage(message);
    }

    // Utility functions
    function showLoading() {
        loadingIndicator.classList.add('active');
    }
    
    function hideLoading() {
        loadingIndicator.classList.remove('active');
    }
    
    // Event listeners
    sendBtn.addEventListener('click', handleSubmit);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });
    
    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });
    
    newTopicBtn.addEventListener('click', () => {
        // Redirect back to landing page
        window.location.href = '/';
    });
    
    // Initialize the session on page load
    initializeSession();
    
    // Set initial confidence
    updateConfidenceMeter(confidenceScore);

    // Load previous sessions
    loadSessions();
});

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidencePercentage = document.getElementById('confidence-percentage');
    const currentTopicTitle = document.getElementById('current-topic-title');
    const proficiencyBadge = document.getElementById('proficiency-badge');
    const topicPlaceholder = document.getElementById('topic-placeholder');
    const topicsList = document.getElementById('topics-list');
    const newTopicBtn = document.getElementById('new-topic-btn');
    const loadSessionId = sessionStorage.getItem('load_session_id');

    if (loadSessionId) {
        // Clear the stored session ID to prevent loading it on future page loads
        sessionStorage.removeItem('load_session_id');
        
        // We'll load this session once the page is initialized
        const shouldLoadSession = true;
    }

    // Get session data from sessionStorage
    const topic = sessionStorage.getItem('topic') || 'Unknown Topic';
    const proficiency = sessionStorage.getItem('proficiency') || 'intermediate';
    const hfToken = sessionStorage.getItem('hf_token');
    
    // Set initial values
    currentTopicTitle.textContent = topic;
    proficiencyBadge.textContent = proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
    topicPlaceholder.textContent = topic;
    
    // Session management
    let sessionId = null;
    let confidenceScore = 70; // Default starting confidence

    // Speech Recognition Setup
    let recognition = null;
    let isRecording = false;

    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Create speech recognition instance
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Configure speech recognition
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Set language to English, can be changed based on user preference
        
        // Handle speech recognition results
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const isFinal = event.results[0].isFinal;
            
            // Update textarea with transcribed text
            userInput.value = transcript;
            
            // Resize textarea to fit content
            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight) + 'px';
            
            // If final result, stop recording
            if (isFinal) {
                stopRecording();
            }
        };
        
        // Handle end of speech recognition
        recognition.onend = () => {
            stopRecording();
        };
        
        // Handle errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
            
            // Show error message if needed
            if (event.error === 'no-speech') {
                // Add a small hint to the user
                userInput.placeholder = 'No speech detected. Try speaking louder...';
                setTimeout(() => {
                    userInput.placeholder = 'Explain the concept to your AI student...';
                }, 3000);
            }
        };
    }

    // Start recording
    function startRecording() {
        if (!recognition) {
            // Browser doesn't support speech recognition
            alert('Sorry, your browser does not support speech recognition. Please try using a modern browser like Chrome or Edge.');
            return;
        }
        
        if (isRecording) return;
        
        isRecording = true;
        micBtn.classList.add('recording');
        
        // Clear previous input
        userInput.value = '';
        userInput.placeholder = 'Listening...';
        
        // Start recognition
        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }

    // Stop recording
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        micBtn.classList.remove('recording');
        userInput.placeholder = 'Explain the concept to your AI student...';
        
        try {
            recognition.stop();
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
        }
    }

    // Update confidence meter
    function updateConfidenceMeter(score) {
        confidenceScore = score;
        confidenceBar.style.width = `${score}%`;
        confidencePercentage.textContent = `${score}%`;
        
        // Change color based on confidence level
        if (score < 40) {
            confidenceBar.style.background = 'var(--danger-color)';
        } else if (score < 70) {
            confidenceBar.style.background = 'var(--warning-color)';
        } else {
            confidenceBar.style.background = 'linear-gradient(to right, var(--warning-color), var(--success-color))';
        }
    }

    // Add a message to the chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Format date for display
    function formatDate(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        
        // If today, just show time
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If this year, show month and day
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        
        // Otherwise show full date
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Helper function to create a topic item element
    function createTopicItem(topicName, sessionId, createdAt, isActive = false) {
        const topicItem = document.createElement('div');
        topicItem.classList.add('topic-item');
        if (isActive) topicItem.classList.add('active');
        
        topicItem.innerHTML = `
            <div class="topic-name">${topicName}</div>
            <div class="topic-date">${formatDate(createdAt)}</div>
        `;
        
        // Add click event to load this session
        topicItem.addEventListener('click', function() {
            console.log(`Topic clicked: ${topicName}, Session ID: ${sessionId}`);
            loadSessionChat(sessionId);
        });
        
        return topicItem;
    }

    // Load sessions function
    async function loadSessions() {
        try {
            const response = await fetch('/api/sessions/');
            const data = await response.json();
            
            if (response.status === 200) {
                console.log(`Loaded ${data.sessions.length} sessions`);
                
                // Clear the current list
                topicsList.innerHTML = '';
                
                // Add each session to the list
                data.sessions.forEach(session => {
                    const topicItem = createTopicItem(
                        session.topic, 
                        session.id, 
                        session.created_at,
                        session.id === sessionId // Is this the active session?
                    );
                    topicsList.appendChild(topicItem);
                });
            } else {
                console.error('Failed to load sessions:', data.error);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    // Function to load a session's messages
    async function loadSessionChat(clickedSessionId) {
        console.log(`Attempting to load session: ${clickedSessionId}`);
        if (clickedSessionId === sessionId) {
            console.log('Already on this session, not reloading');
            return; // Already loaded
        }
        
        showLoading();
        
        try {
            console.log(`Fetching messages for session ${clickedSessionId}`);
            const response = await fetch(`/api/sessions/${clickedSessionId}/messages/`);
            console.log(`Response status: ${response.status}`);
            
            if (response.status === 200) {
                const data = await response.json();
                console.log(`Successfully loaded session with ${data.messages.length} messages`);
                
                // Update the session ID
                sessionId = clickedSessionId;
                
                // Update the UI with session info
                currentTopicTitle.textContent = data.session.topic;
                proficiencyBadge.textContent = data.session.proficiency.charAt(0).toUpperCase() + 
                                            data.session.proficiency.slice(1);
                
                // Clear the chat container
                chatContainer.innerHTML = '';
                
                // Add all messages
                data.messages.forEach(msg => {
                    addMessage(msg.content, msg.is_user);
                    
                    // Update confidence if it's an AI message
                    if (!msg.is_user && msg.confidence_score !== null) {
                        updateConfidenceMeter(msg.confidence_score);
                    }
                });
                
                // Update topic list UI to reflect active session
                document.querySelectorAll('.topic-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Find and mark the clicked session as active
                const items = document.querySelectorAll('.topic-item');
                for (let i = 0; i < items.length; i++) {
                    if (items[i].querySelector('.topic-name').textContent === data.session.topic) {
                        items[i].classList.add('active');
                        break;
                    }
                }
            } else {
                const errorData = await response.json();
                console.error('Failed to load session chat:', errorData.error);
            }
        } catch (error) {
            console.error('Error loading session chat:', error);
        } finally {
            hideLoading();
        }
    }

    // Add topic to history list
    function addTopicToHistory(topicName, sessionId, isActive = true) {
        // Instead of manually adding, now we'll just reload all sessions
        loadSessions();
    }

    async function initializeSession() {
        showLoading();
        
        // Check if there's a session to load from history page
        const loadSessionId = sessionStorage.getItem('load_session_id');
        
        try {
            // If we're loading a previous session
            if (loadSessionId) {
                console.log(`Loading existing session: ${loadSessionId}`);
                sessionStorage.removeItem('load_session_id'); // Clear to prevent future auto-loads
                loadSessionChat(loadSessionId);
                return;
            }
            
            // Otherwise create a new session
            const response = await fetch('/api/start_session/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    proficiency
                })
            });
            
            const data = await response.json();
            
            if (response.status === 200) {
                sessionId = data.session_id;
                console.log(`Session initialized with ID: ${sessionId}`);
                
                // Load sessions to update the sidebar
                loadSessions();
            } else {
                console.error('Failed to initialize session:', data.error);
                addMessage('Sorry, I had trouble starting our session. Please try again.', false);
            }
        } catch (error) {
            console.error('Error initializing session:', error);
            addMessage('Sorry, I had trouble connecting to the server. Please check your connection and try again.', false);
        } finally {
            hideLoading();
        }
    }

    // Send message to API
    async function sendMessage(message) {
        if (!sessionId) {
            console.error('No active session.');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    message,
                    hf_token: hfToken
                })
            });
            
            const data = await response.json();
            
            if (response.status === 200) {
                addMessage(data.response, false);
                updateConfidenceMeter(data.confidence_score);
            } else {
                console.error('Failed to send message:', data.error);
                addMessage('Sorry, I had trouble processing your message. Please try again.', false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Fallback to direct API call if Django backend fails
            fallbackToDirectAPI(message);
        } finally {
            hideLoading();
        }
    }

    // Direct API call fallback (in case Django server fails)
    async function fallbackToDirectAPI(message) {
        try {
            console.log("Attempting direct API call to Hugging Face");
            
            // Create a prompt for the Hugging Face API
            const prompt = `
            You are an AI student learning from a human teacher about ${topic}.
            The human teacher has ${proficiency} knowledge about this topic.
            
            Your goal is to learn from them while asking insightful questions that help them reinforce their knowledge.
            
            If they explain something correctly, ask follow-up questions that help them elaborate further.
            
            If they explain something incorrectly, don't correct them directly, but ask strategic questions
            that help them realize their misunderstanding. For example, if they say plants use oxygen instead
            of CO2 for photosynthesis, ask "That's interesting - if plants use oxygen, what do they release
            during photosynthesis?"
            
            Human teacher: ${message}
            
            AI student:
            `;
            
            const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 200,
                        temperature: 0.7,
                        top_p: 0.9,
                        do_sample: true
                    }
                })
            });
            
            const data = await response.json();
            console.log("Received fallback API response");
            
            if (data && data[0] && data[0].generated_text) {
                // Extract just the AI response part
                const fullResponse = data[0].generated_text;
                const aiResponsePart = fullResponse.split('AI student:')[1]?.trim() || 
                                      "I'm having trouble processing that. Could you explain it again?";
                
                addMessage(aiResponsePart, false);
                
                // Simple confidence calculation for fallback mode
                const questionCount = (aiResponsePart.match(/\?/g) || []).length;
                const newConfidence = Math.min(confidenceScore + (questionCount > 0 ? 5 : -5), 100);
                updateConfidenceMeter(newConfidence);
            } else {
                addMessage("I'm sorry, I'm having trouble connecting to my knowledge base. Could we try again later?", false);
            }
        } catch (error) {
            console.error('Fallback API error:', error);
            addMessage("I'm sorry, there seems to be a connection issue. Please check your internet connection and try again.", false);
        }
    }

    // Handle form submission
    function handleSubmit() {
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Stop recording if in progress
        if (isRecording) {
            stopRecording();
        }
        
        // Add user message to chat
        addMessage(message, true);
        
        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Send to API
        sendMessage(message);
    }

    // Utility functions
    function showLoading() {
        loadingIndicator.classList.add('active');
    }
    
    function hideLoading() {
        loadingIndicator.classList.remove('active');
    }
    
    // Event listeners
    sendBtn.addEventListener('click', handleSubmit);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });
    
    // Microphone button click event
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
                
                // If there's transcribed text, submit it
                if (userInput.value.trim()) {
                    handleSubmit();
                }
            } else {
                startRecording();
            }
        });
    }
    
    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });
    
    newTopicBtn.addEventListener('click', () => {
        // Redirect back to landing page
        window.location.href = '/';
    });
    
    // Initialize the session on page load
    initializeSession();
    
    // Set initial confidence
    updateConfidenceMeter(confidenceScore);

    // Load previous sessions
    loadSessions();
});

// Add this to your DOMContentLoaded event listener
const languageSelector = document.getElementById('language-selector');

// Update recognition language when selector changes
if (languageSelector && recognition) {
    languageSelector.addEventListener('change', () => {
        recognition.lang = languageSelector.value;
    });
}
function saveToHistory(question, response) {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    chatHistory.push({ question, response });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }
  
  // Example usage:
  saveToHistory("What is JavaScript?", "JavaScript is a programming language...");
  