import { io, Socket } from 'socket.io-client';

// Server URL --> change this in production
const SERVER_URL = 'http://localhost:3001';

// Socket instance (initialized on connection)
let socket: Socket | null = null;

// Connect to server
export const connectSocket = () => {
    if (!socket) {
        socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
            reconnection: true, // Auto-reconnect if connection is lost
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });
    }

    // Connection event listeners
    socket.on('connect', () => {
        console.log('Connected to server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
    });
    
    return socket;
};

// Get current socket instance
export const getSocket = (): Socket | null => {
    return socket;
};

// Disconnect from server
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Join game with username
export const joinGame = (username: string) => {
    if (!socket) {
        console.error('Socket not connected. Call connectSocket() first.');
        return;
    }

    socket.emit('join', {username: username});
};

// Export defaults
export default {
    connectSocket,
    getSocket,
    disconnectSocket,
    joinGame,
};