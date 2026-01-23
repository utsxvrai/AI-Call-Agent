require('dotenv').config();

const express = require('express');
const http = require('http');
const routes = require('./routes');
const setupOutboundMediaWS = require('./ws/outbound-media.ws');

const app = express();
const server = http.createServer(app);
const cors = require('cors');

// Setup Twilio WebSocket handlers
setupOutboundMediaWS(server);

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

const PORT = process.env.PORT;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


