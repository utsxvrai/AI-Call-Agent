require('dotenv').config();

const express = require('express');
const http = require('http');
const routes = require('./routes');
const setupOutboundMediaWS = require('./ws/outbound-media.ws');
const { init: initSocket } = require('./services/socket-service');

const app = express();
const server = http.createServer(app);
const cors = require('cors');

// Initialize Socket.io for frontend communication
const allowedOrigins = [
  'https://call-kro.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

initSocket(server, allowedOrigins);

// Setup Twilio WebSocket handlers
setupOutboundMediaWS(server);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not ' +
                  'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

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


