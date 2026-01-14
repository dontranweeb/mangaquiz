const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Enables CORS for all routes (allows Next.js client to connect)
app.use(cors());

const httpServer = http.createServer(app);

// Initialize socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Store connected players
const players = new Map(); // map of socket.id -> player data

// Socket.IO Connection Handler
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join', (data) => {
        const username = data.username || `Player-${socket.id.slice(0, 6)}`; // Default of no username

        // Add player to map
        players.set(socket.id, {
            socketId: socket.id,
            username: username,
            score: 0,
            joinedAt: Date.now(),
        })

        console.log(`Player joined: ${username} (${socket.id})`);

        // Send confirmation to the client
        socket.emit('joined', {
            success: true,
            socketId: socket.id,
            username: username,
            totalPlayers: players.size
        })

        // Notify other players that someone joined
        socket.broadcast.emit('playerJoined', {
            username: username,
            totalPlayers: players.size
        })
    })

    // When a client disconnects
    socket.on("disconnect", () => {
        const player = players.get(socket.id);
        const username = player?.username || socket.id;

        console.log(`Client disconnected: ${username} (${socket.id})`);

        // Remove player from map
        players.delete(socket.id);

        // Notify other players
        socket.broadcast.emit('playerLeft', {
            username: username,
            totalPlayers: players.size
        })
    });

    // Test event: echo back messages (testing purposes)
    socket.on("test", (data) => {
        console.log("Received test message:", data);
        socket.emit("testResponse", { message: "Server received your message!"});
    })
})

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${PORT}`);
    console.log(`Waiting for client connections...`);
})