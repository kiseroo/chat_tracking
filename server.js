const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: PORT });

// Store connected clients, rooms, and users
const clients = new Map();
const rooms = new Set(['general', 'tech', 'random']);
const roomUsers = new Map();

// Initialize room users counts
rooms.forEach(room => {
    roomUsers.set(room, new Set());
});

console.log(`WebSocket server starting on port ${PORT}`);

// Handle new WebSocket connections
wss.on('connection', (ws) => {
    const clientId = generateClientId();
    let username = null;
    let currentRoom = null;
    
    console.log(`Client connected: ${clientId}`);
    
    // Store client connection
    clients.set(clientId, {
        id: clientId,
        ws: ws,
        username: username,
        room: currentRoom
    });
    
    // Handle messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Received message from ${clientId}:`, data);
            
            switch (data.type) {
                case 'user_update':
                    handleUserUpdate(clientId, data.username);
                    break;
                case 'join_room':
                    handleJoinRoom(clientId, data.room);
                    break;
                case 'message':
                    handleChatMessage(clientId, data);
                    break;
                case 'create_room':
                    handleCreateRoom(clientId, data.room);
                    break;
                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
        handleClientDisconnect(clientId);
    });
    
    // Send initial system message
    sendToClient(ws, {
        type: 'system',
        message: 'Connected to chat server'
    });
    
    // Send available rooms
    sendToClient(ws, {
        type: 'rooms',
        rooms: Array.from(rooms)
    });
});

// Handle user update
function handleUserUpdate(clientId, username) {
    const client = clients.get(clientId);
    if (client) {
        // Update client username
        client.username = username;
        
        // Broadcast updated users list
        broadcastUsersList();
        
        console.log(`User updated: ${clientId} -> ${username}`);
    }
}

// Handle room join
function handleJoinRoom(clientId, roomName) {
    const client = clients.get(clientId);
    if (!client || !client.username) return;
    
    // Leave current room if any
    if (client.room) {
        roomUsers.get(client.room).delete(client.username);
        broadcastRoomUserCount(client.room);
    }
    
    // Join new room
    client.room = roomName;
    
    // Create room if it doesn't exist
    if (!roomUsers.has(roomName)) {
        roomUsers.set(roomName, new Set());
    }
    
    // Add user to room
    roomUsers.get(roomName).add(client.username);
    
    // Broadcast room user count
    broadcastRoomUserCount(roomName);
    
    console.log(`User ${client.username} joined room: ${roomName}`);
}

// Handle chat message
function handleChatMessage(clientId, data) {
    const client = clients.get(clientId);
    if (!client || !client.username || !client.room) return;
    
    // Broadcast message to all users in the room
    broadcastToRoom(client.room, {
        type: 'message',
        room: client.room,
        username: client.username,
        message: data.message,
        timestamp: data.timestamp
    });
    
    console.log(`Message in ${client.room} from ${client.username}: ${data.message}`);
}

// Handle room creation
function handleCreateRoom(clientId, roomName) {
    const client = clients.get(clientId);
    if (!client || !client.username) return;
    
    // Validate room name
    if (!roomName || roomName.trim() === '' || rooms.has(roomName)) {
        return;
    }
    
    // Add new room
    rooms.add(roomName);
    roomUsers.set(roomName, new Set());
    
    // Broadcast updated rooms list
    broadcastToAll({
        type: 'rooms',
        rooms: Array.from(rooms)
    });
    
    // Send system message
    broadcastToAll({
        type: 'system',
        message: `${client.username} created a new room: ${roomName}`
    });
    
    console.log(`New room created by ${client.username}: ${roomName}`);
}

// Handle client disconnect
function handleClientDisconnect(clientId) {
    const client = clients.get(clientId);
    if (client) {
        // Remove from room if in one
        if (client.room && client.username) {
            roomUsers.get(client.room).delete(client.username);
            broadcastRoomUserCount(client.room);
        }
        
        // Remove client
        clients.delete(clientId);
        
        // Broadcast updated users list
        broadcastUsersList();
        
        console.log(`Client disconnected: ${clientId}`);
    }
}

// Broadcast to all connected clients
function broadcastToAll(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
        }
    });
}

// Broadcast to all clients in a room
function broadcastToRoom(roomName, data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.room === roomName && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
        }
    });
}

// Send message to a specific client
function sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

// Broadcast updated users list
function broadcastUsersList() {
    const users = Array.from(clients.values())
        .filter(client => client.username)
        .map(client => client.username);
    
    broadcastToAll({
        type: 'users',
        users: users
    });
}

// Broadcast room user count
function broadcastRoomUserCount(roomName) {
    const count = roomUsers.get(roomName).size;
    
    clients.forEach(client => {
        if (client.room === roomName && client.ws.readyState === WebSocket.OPEN) {
            sendToClient(client.ws, {
                type: 'room_users',
                count: count
            });
        }
    });
}

// Generate a unique client ID
function generateClientId() {
    return Math.random().toString(36).substring(2, 15);
}