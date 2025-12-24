# 🤖 AI Call Agent

An intelligent voice AI system that makes outbound calls, listens to responses, and engages in real-time conversations using advanced speech recognition, natural language processing, and text-to-speech technology.

## ✨ Features

- 📞 **Outbound Voice Calls** - Powered by Twilio
- 🎤 **Real-time Speech Recognition** - Converts caller speech to text
- 🧠 **AI Intent Analysis** - Uses Google Gemini to understand caller sentiment
- 🔊 **Natural Voice Synthesis** - ElevenLabs for human-like responses
- 💬 **Live Transcripts** - Real-time conversation streaming via WebSocket
- 📊 **Call Analytics** - Track sentiment (Interested/Not Interested/Unsure)
- ⏱️ **Call Duration Tracking** - Monitor conversation length
- 🎨 **Modern UI** - React-based dashboard with Tailwind CSS

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  • Call initiation interface                                 │
│  • Real-time transcript display                              │
│  • Call status & sentiment tracking                          │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP & WebSocket
┌────────────────▼────────────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│                                                               │
│  Controllers → Services → External APIs                      │
│                                                               │
│  Services:                                                    │
│  • Twilio Service - Manage calls                             │
│  • LLM Service - Intent classification                       │
│  • STT Service - Speech-to-text                              │
│  • TTS Service - Text-to-speech                              │
│  • Transcript Service - Real-time updates                    │
│  • WebSocket Handler - Media streaming                       │
└────────┬──────────┬──────────────────┬──────────────┬────────┘
         │          │                  │              │
    ┌────▼──┐  ┌────▼──────┐  ┌───────▼──┐  ┌───────▼──┐
    │ Twilio │  │ ElevenLabs│  │  Gemini  │  │Socket.IO │
    └────────┘  └───────────┘  └──────────┘  └──────────┘
```

## 📋 Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **ngrok** for local webhook tunneling ([Download](https://ngrok.com/))

### Required API Keys

1. **Twilio**
   - Account SID
   - Auth Token
   - Verified phone number
   - Sign up: https://www.twilio.com

2. **Google Gemini**
   - API Key for generative AI
   - Sign up: https://ai.google.dev

3. **ElevenLabs**
   - API Key for voice synthesis
   - Voice ID for character selection
   - Sign up: https://elevenlabs.io

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd "AI Call Agent"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# AI & Voice APIs
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# Server Configuration
BASE_URL=https://your-ngrok-url.ngrok-free.dev
PORT=3000
```

### 3. Start ngrok (Required for Local Development)

In a new terminal:

```bash
ngrok http 3000
```

Copy the HTTPS URL and paste it as `BASE_URL` in your `.env` file.

### 4. Start the Backend

```bash
cd backend
npm run dev
```

Output:
```
Server running on port 3000
✅ Health check ready at http://localhost:3000/health
```

### 5. Start the Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Opens at: `http://localhost:5173`

## 📞 How to Use

1. **Open the UI** → Navigate to `http://localhost:5173`
2. **Enter Contact Info**
   - Name: Recipient's name
   - Phone Number: Valid phone number (including country code)
3. **Click "Start Call"** button
4. **Monitor in Real-time**
   - Watch the call status update
   - View live transcript as conversation happens
   - See caller sentiment analysis
   - Track call duration

## 📁 Project Structure

```
AI Call Agent/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── call-controller.js     # Call request handlers
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── call-service.js        # Call orchestration
│   │   │   ├── llm-service.js         # AI intent analysis
│   │   │   ├── stt-service.js         # Speech-to-text
│   │   │   ├── tts-service.js         # Text-to-speech
│   │   │   ├── twilio-service.js      # Twilio API wrapper
│   │   │   ├── transcript-service.js  # Real-time updates
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   └── v1/
│   │   │       ├── call-route.js      # Call endpoints
│   │   │       └── index.js
│   │   ├── config/
│   │   │   ├── elevenlabs.js          # ElevenLabs config
│   │   │   ├── gemini.js              # Gemini config
│   │   │   └── twilio.js              # Twilio config
│   │   ├── ws/
│   │   │   └── twilio-media.ws.js     # WebSocket media handler
│   │   ├── utils/
│   │   │   └── audio.js               # Audio utilities
│   │   ├── db/                        # Database models (future)
│   │   ├── middlewares/               # Express middlewares
│   │   └── index.js                   # Server entry point
│   ├── .env                           # Environment variables
│   ├── package.json
│   └── nodemon.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Main application
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.css                    # Component styles
│   │   ├── index.css                  # Global styles
│   │   └── assets/                    # Static assets
│   ├── public/
│   ├── index.html
│   ├── vite.config.js                 # Vite configuration
│   ├── tailwind.config.js             # Tailwind setup
│   ├── eslint.config.js               # Linting rules
│   ├── postcss.config.js              # PostCSS setup
│   ├── package.json
│   └── README.md
│
└── README.md                          # This file
```

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 | User interface |
| **Frontend Build** | Vite | Fast module bundler |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Icons** | Lucide React | Icon library |
| **Backend** | Express.js | Web framework |
| **Runtime** | Node.js | JavaScript runtime |
| **Real-time** | Socket.IO | WebSocket communication |
| **HTTP Client** | Axios | API requests |
| **Voice Calls** | Twilio | VoIP platform |
| **Speech-to-Text** | Web Audio API | Browser-based STT |
| **Text-to-Speech** | ElevenLabs API | AI voice synthesis |
| **AI/LLM** | Google Gemini | Intent classification |
| **Environment** | dotenv | Config management |
| **Dev Tools** | Nodemon | Auto-reload server |

## 📡 API Endpoints

### Call Management
- `POST /api/v1/call/start` - Initiate an outbound call
- `POST /api/v1/call/twiml` - Generate TwiML for call handling
- `POST /api/v1/call/status` - Receive call status updates

### Health Check
- `GET /health` - Server health status

### WebSocket Events
- `/ws/media` - Real-time audio streaming with Twilio

## 🎯 Call Flow

```
1. User enters contact info and clicks "Start Call"
                    ↓
2. Frontend sends POST to /api/v1/call/start
                    ↓
3. Backend calls Twilio API to make outbound call
                    ↓
4. Twilio connects and streams audio via WebSocket
                    ↓
5. Backend receives audio stream in /ws/media
                    ↓
6. Audio is processed:
   - Speech → Text (STT)
   - Text → Intent classification (Gemini)
   - Generate AI response
   - Response → Speech (ElevenLabs TTS)
                    ↓
7. Audio sent back to caller via Twilio media stream
                    ↓
8. Transcript sent to frontend via Socket.IO in real-time
                    ↓
9. Frontend updates UI with transcript and sentiment
                    ↓
10. Call ends after defined duration or caller hangs up
```

## 🚦 Call Status Flow

```
Idle → Initiated → Ringing → Answered → In Progress → Completed
```

## 📊 Sentiment Classification

The AI classifies caller intent into:
- ✅ **Interested** - Positive response, willing to continue
- ❌ **Not Interested** - Explicit rejection or disengagement
- ❓ **Unsure** - Neutral or unclear intent

## 🛠️ Development

### Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - ngrok (for webhooks):**
```bash
ngrok http 3000
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```
Output in `frontend/dist/`

**Backend:**
```bash
cd backend
npm start  # (ensure "start" script is in package.json)
```

## 🔒 Security Notes

- ⚠️ **Never commit `.env` files** to version control
- 🔐 Store sensitive API keys in environment variables only
- 🛡️ Use HTTPS in production (ngrok already provides this)
- 🔍 Validate all user inputs on backend

## 🐛 Troubleshooting

### ngrok URL keeps changing
- Use ngrok's free tier token for stability: `ngrok config add-authtoken <token>`

### Twilio call fails
- Verify phone number is in E.164 format: `+1234567890`
- Check account balance and active phone number

### No audio received
- Ensure WebSocket connection is established
- Check browser console for connection errors
- Verify `BASE_URL` matches ngrok URL

### "No such voice ID" error
- Verify `ELEVENLABS_VOICE_ID` is correct
- List available voices at: https://api.elevenlabs.io/v1/voices

## 📝 Environment Variables Reference

| Variable | Example | Description |
|----------|---------|-------------|
| `TWILIO_ACCOUNT_SID` | `AC6cb1c94...` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | `dad3c76cc373...` | Twilio authentication |
| `TWILIO_PHONE_NUMBER` | `+15107382629` | Your Twilio phone number |
| `GEMINI_API_KEY` | `AIzaSyDGqK5X...` | Google Gemini API key |
| `ELEVENLABS_API_KEY` | `sk_25d16d97...` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | `pLaNsQLq7c...` | ElevenLabs voice character |
| `BASE_URL` | `https://xxx.ngrok-free.dev` | Public webhook URL |
| `PORT` | `3000` | Backend server port |

## 📞 Support & Resources

- **Twilio Docs**: https://www.twilio.com/docs
- **Google Gemini**: https://ai.google.dev/docs
- **ElevenLabs**: https://elevenlabs.io/docs
- **Socket.IO**: https://socket.io/docs
- **React**: https://react.dev

## 📄 License

This project is open source and available under the ISC License.

---

**Happy calling! 🎉** If you encounter any issues, check the logs and ensure all API keys are correctly configured.
