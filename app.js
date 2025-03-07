// DOM Elements
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');
const roomsList = document.getElementById('room-list');
const currentRoomDisplay = document.getElementById('current-room');
const userCount = document.getElementById('user-count');
const roomUsersCount = document.getElementById('room-users-count');
const usersList = document.getElementById('users-list');
const newRoomInput = document.getElementById('new-room');
const createRoomButton = document.getElementById('create-room-btn');

// App State
let currentUser = null;
let currentRoom = 'general';
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// WebSocket server URL - will be replaced with actual deployed backend URL
const WS_SERVER_URL = 'wss://chat-tracker-backend.onrender.com';

// Initialize the application
function init() {
    // Event listeners
    usernameInput.addEventListener('keyup', handleUsernameInput);
    messageInput.addEventListener('keyup', handleMessageInputKeyup);
    sendButton.addEventListener('click', sendMessage);
    roomsList.addEventListener('click', handleRoomClick);
    createRoomButton.addEventListener('click', createNewRoom);
    newRoomInput.addEventListener('keyup', handleNewRoomInputKeyup);
    
    // Check for saved username in localStorage
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        handleUsernameInput({ target: usernameInput });
    }
}

// Handle username input
function handleUsernameInput(event) {
    const username = event.target.value.trim();
    
    if (username.length >= 3) {
        // Enable chat if username is valid
        messageInput.disabled = false;
        sendButton.disabled = false;
        
        // Save username to localStorage
        localStorage.setItem('chatUsername', username);
        
        // Update current user
        if (currentUser !== username) {
            currentUser = username;
            
            // Connect to WebSocket if not already connected
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                connectWebSocket();
            } else {
                // Update user info if already connected
                sendUserUpdate();
            }
        }
    } else {
        // Disable chat if username is invalid
        messageInput.disabled = true;
        sendButton.disabled = true;
        
        // Disconnect WebSocket if connected
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        
        currentUser = null;
    }
}

// Connect to WebSocket server
function connectWebSocket() {
    try {
        socket = new WebSocket(WS_SERVER_URL);
        
        socket.onopen = () => {
            console.log('Connected to WebSocket server');
            reconnectAttempts = 0;
            
            // Join default room and send user info
            sendUserUpdate();
            joinRoom(currentRoom);
            
            // Add system message
            addSystemMessage('Connected to chat server');
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        socket.onclose = (event) => {
            console.log('Disconnected from WebSocket server', event.code, event.reason);
            addSystemMessage('Disconnected from chat server. Attempting to reconnect...');
            
            // Attempt to reconnect
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(connectWebSocket, RECONNECT_DELAY);
            } else {
                addSystemMessage('Failed to reconnect to chat server. Please refresh the page.');
            }
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            addSystemMessage('Error connecting to chat server');
        };
    } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        addSystemMessage('Error connecting to chat server');
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    console.log('Received message:', data);
    
    switch (data.type) {
        case 'message':
            addChatMessage(data);
            break;
        case 'users':
            updateUsersList(data.users);
            break;
        case 'rooms':
            updateRoomsList(data.rooms);
            break;
        case 'room_users':
            updateRoomUsersCount(data.count);
            break;
        case 'system':
            addSystemMessage(data.message);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Send user update to server
function sendUserUpdate() {
    if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
        socket.send(JSON.stringify({
            type: 'user_update',
            username: currentUser
        }));
    }
}

// Join a chat room
function joinRoom(roomName) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'join_room',
            room: roomName,
            username: currentUser
        }));
        
        // Update UI
        currentRoom = roomName;
        currentRoomDisplay.textContent = roomName;
        
        // Update active room in UI
        const roomElements = roomsList.querySelectorAll('.room');
        roomElements.forEach(room => {
            if (room.dataset.room === roomName) {
                room.classList.add('active');
            } else {
                room.classList.remove('active');
            }
        });
        
        // Clear messages
        messagesContainer.innerHTML = '';
        addSystemMessage(`Joined room: ${roomName}`);
    }
}

// Send a chat message
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'message',
            room: currentRoom,
            username: currentUser,
            message: message,
            timestamp: new Date().toISOString()
        }));
        
        // Clear input
        messageInput.value = '';
        messageInput.focus();
    }
}

// Handle message input keyup event
function handleMessageInputKeyup(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Handle new room input keyup event
function handleNewRoomInputKeyup(event) {
    if (event.key === 'Enter') {
        createNewRoom();
    }
}

// Create a new chat room
function createNewRoom() {
    const roomName = newRoomInput.value.trim().toLowerCase();
    
    if (roomName && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'create_room',
            room: roomName,
            username: currentUser
        }));
        
        // Clear input
        newRoomInput.value = '';
    }
}

// Handle room click event
function handleRoomClick(event) {
    const roomElement = event.target.closest('.room');
    if (roomElement) {
        const roomName = roomElement.dataset.room;
        if (roomName && roomName !== currentRoom) {
            joinRoom(roomName);
        }
    }
}

// Add a chat message to the UI
function addChatMessage(data) {
    const { username, message, timestamp, room } = data;
    
    // Only add message if it's for the current room
    if (room === currentRoom) {
        const isOwnMessage = username === currentUser;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (isOwnMessage) {
            messageElement.classList.add('own');
        }
        
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-avatar">${username.charAt(0).toUpperCase()}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${username}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${escapeHTML(message)}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
    }
}

// Add a system message to the UI
function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system');
    
    messageElement.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Update the users list in the UI
function updateUsersList(users) {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    
    users.forEach(user => {
        const userElement = document.createElement('li');
        userElement.textContent = user;
        usersList.appendChild(userElement);
    });
}

// Update the rooms list in the UI
function updateRoomsList(rooms) {
    // Keep existing rooms
    const existingRooms = Array.from(roomsList.querySelectorAll('.room')).map(room => room.dataset.room);
    
    // Add new rooms
    rooms.forEach(room => {
        if (!existingRooms.includes(room)) {
            const roomElement = document.createElement('div');
            roomElement.classList.add('room');
            roomElement.dataset.room = room;
            
            if (room === currentRoom) {
                roomElement.classList.add('active');
            }
            
            roomElement.innerHTML = `<i class="fas fa-hashtag"></i> ${room}`;
            roomsList.appendChild(roomElement);
        }
    });
}

// Update the room users count in the UI
function updateRoomUsersCount(count) {
    roomUsersCount.textContent = count;
}

// Scroll messages container to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle page visibility changes to reconnect if needed
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!socket || socket.readyState !== WebSocket.OPEN) && currentUser) {
        connectWebSocket();
    }
});