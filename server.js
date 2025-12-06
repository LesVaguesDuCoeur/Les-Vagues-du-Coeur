const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Chat history file path
const CHAT_HISTORY_FILE = path.join(__dirname, 'chat_history.json');

// Middleware to serve static files
app.use(express.static('public'));
app.use(express.json());

// Initialize chat history if it doesn't exist
if (!fs.existsSync(CHAT_HISTORY_FILE)) {
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify([]));
}

// Helper to get chat history
function getChatHistory() {
    try {
        const data = fs.readFileSync(CHAT_HISTORY_FILE);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading chat history:", error);
        return [];
    }
}

// Helper to save chat message
function saveChatMessage(message) {
    const history = getChatHistory();
    history.push(message);
    // Keep only last 100 messages to prevent file from growing too large
    if (history.length > 100) {
        history.shift();
    }
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(history));
}

// Email Transporter Configuration
// Users must provide these environment variables in Render/Vercel or a .env file
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendNotification(username) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not set. Skipping notification.');
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'lyeslangouet@icloud.com',
        subject: 'Nouvel utilisateur connecté !',
        text: `L'utilisateur "${username}" vient de rejoindre le site de visioconférence.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent for user: ${username}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send chat history to new user
    socket.emit('chat_history', getChatHistory());

    socket.on('join_room', (data) => {
        const { username, roomId } = data;

        // Store room info on the socket for disconnect handling
        socket.currentRoom = roomId;

        socket.join(roomId);
        console.log(`${username} joined room ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit('user_connected', { socketId: socket.id, username });

        // Send email notification
        sendNotification(username);
    });

    // Handle WebRTC signaling
    socket.on('signal', (data) => {
        // Send signal to specific peer
        io.to(data.to).emit('signal', {
            from: socket.id,
            signal: data.signal
        });
    });

    // Handle Chat Messages
    socket.on('send_message', (data) => {
        const messageData = {
            id: Date.now(),
            username: data.username,
            text: data.text,
            time: new Date().toLocaleTimeString()
        };

        saveChatMessage(messageData);
        io.to(data.roomId).emit('receive_message', messageData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        if (socket.currentRoom) {
            // Broadcast only to the specific room
            socket.to(socket.currentRoom).emit('user_disconnected', { socketId: socket.id });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
