// Generate random room code (ABC123)
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Room storage: roomCode --> roomData
const roomCode = new Map();

const room = {
    roomCode: roomCode,
    host: hostSocketId,
    players: new Map(), // socket.id -> player data
}