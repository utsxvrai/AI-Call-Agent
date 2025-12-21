const WebSocket = require('ws');

function setupTwilioMediaWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/media' });

  wss.on('connection', (ws, req) => {
    console.log('🟢 Twilio Media Stream connected');

    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());

      switch (data.event) {
        case 'start':
          console.log('▶️ Stream started', data.start);
          break;

        case 'media':
          console.log(
            '🎧 Audio packet received:',
            data.media.payload.length
          );
          break;

        case 'stop':
          console.log('⏹️ Stream stopped');
          break;
      }
    });

    ws.on('close', () => {
      console.log('🔴 Twilio Media Stream disconnected');
    });
  });
}

module.exports = setupTwilioMediaWebSocket;
