require('dotenv').config();

const express = require('express');
const http = require('http');
const routes = require('./routes');
const  setupTwilioMediaWebSocket  = require('./ws/twilio-media.ws');



const app = express();
const server = http.createServer(app);
const cors = require('cors');
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  perMessageDeflate: false
});

// Pass io to transcript service
const transcriptService = require('./services/transcript-service');
transcriptService.setIo(io);

setupTwilioMediaWebSocket(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', routes);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { io };
