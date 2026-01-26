const { Server } = require('socket.io');

let io;

function init(server, allowedOrigins) {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('📱 Frontend connected to Socket.io');

        socket.on('disconnect', () => {
            console.log('📱 Frontend disconnected');
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}

function emit(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

module.exports = {
    init,
    getIO,
    emit
};
