const socketIO = require('socket.io');

const socketManager = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const onlineUsers = new Map(); // userId -> socketId

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('setup', (userData) => {
            if (userData && userData.id) {
                socket.join(userData.id);
                onlineUsers.set(userData.id, socket.id);
                console.log(`User ${userData.id} setup and online`);
                io.emit('online-users', Array.from(onlineUsers.keys()));
            }
        });

        socket.on('join-chat', (room) => {
            socket.join(room);
            console.log('User joined room:', room);
        });

        socket.on('new-message', (message) => {
            const { receiverId, senderId } = message;
            
            // Send to receiver's private room
            socket.to(receiverId).emit('message-received', message);
            
            // Also update sender's other tabs if any
            socket.to(senderId).emit('message-sent-sync', message);

            console.log(`Message from ${senderId} to ${receiverId}`);
        });

        socket.on('typing', (data) => {
            socket.to(data.receiverId).emit('user-typing', { senderId: data.senderId });
        });

        socket.on('stop-typing', (data) => {
            socket.to(data.receiverId).emit('user-stop-typing', { senderId: data.senderId });
        });

        socket.on('disconnect', () => {
            let disconnectedUserId = null;
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            console.log('User disconnected:', socket.id);
            if (disconnectedUserId) {
                io.emit('online-users', Array.from(onlineUsers.keys()));
            }
        });
    });

    return io;
};

module.exports = socketManager;
