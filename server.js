const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Use the modern Server initialization syntax cleanly
const io = new Server(server, { 
    cors: { origin: "*" } 
});

// Serve frontend static assets cleanly
app.use(express.static(path.join(__dirname, 'public')));

// Use an object to track connections safely
let players = {}; 

io.on('connection', (socket) => {
    console.log(`🟢 SUCCESS: Player connected! ID: ${socket.id}`);

    // 1. Assign player slots dynamically based on active player count
    const activePlayerCount = Object.keys(players).length;

    if (activePlayerCount === 0) {
        players[socket.id] = 1;
        socket.emit('assignPlayer', 1);
        console.log(`🎮 Assigned ${socket.id} as Player 1`);
    } else if (activePlayerCount === 1) {
        players[socket.id] = 2;
        socket.emit('assignPlayer', 2);
        console.log(`🎮 Assigned ${socket.id} as Player 2`);
    } else {
        socket.emit('assignPlayer', 'spectator');
        console.log(`👁️  Assigned ${socket.id} as Spectator`);
    }

    // 2. Intercept keystrokes and broadcast to ALL screens via io.emit
    socket.on('playerMove', (inputData) => {
        // Ensure spectators don't accidentally send random movement packets
        if (players[socket.id] === 'spectator') return;

        io.emit('remoteMove', {
            playerNum: players[socket.id],
            keys: inputData.keys
        });
    });
    socket.on('syncPositions', (positionData) => {
    socket.broadcast.emit('positionsUpdated', positionData);
});

    // 3. Handle graceful player dropouts
    socket.on('disconnect', () => {
        console.log(`🔴 WARNING: Player disconnected! ID: ${socket.id}`);
        delete players[socket.id];
    });
});

// Start the server ONCE
const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
    console.log(`🚀 Multiplayer Server Running Online! Access locally at http://localhost:${PORT}`);
});