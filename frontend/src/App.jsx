import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, User, Hash, MessageSquare, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

// Prefer environment variables and fall back to local backend
// Vite exposes env vars via import.meta.env and they must be prefixed with VITE_
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

function App() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSid, setCallSid] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [status, setStatus] = useState('Idle');
  const [callDuration, setCallDuration] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);

  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) return;
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    console.log('🔌 Connecting to socket...');
    // Use default transports (polling + websocket) so the client can gracefully
    // fall back if a direct websocket connection is not available.
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setSocketConnected(true);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setSocketConnected(false);
    });

    newSocket.on('transcript', (data) => {
      console.log('📝 Received transcript:', data);
      setTranscript((prev) => [...prev, data]);
    });

    newSocket.on('status', (data) => {
      console.log('🎯 Received status update:', data);
      if (data.status === 'Interested') setStatus('Interested');
      else if (data.status === 'Not Interested') setStatus('Not Interested');
    });

    newSocket.on('callStatus', (data) => {
      console.log('📞 Received callStatus update:', data);
      const s = data.status.toLowerCase();

      if (s === 'answered') {
        setStatus('In Call');
        startTimer();
      } else if (s === 'completed' || s === 'busy' || s === 'no-answer' || s === 'failed' || s === 'canceled') {
        setStatus(prev => (prev === 'Interested' || prev === 'Not Interested') ? prev : 'Ended');
        setIsCalling(false);
        stopTimer();
      } else if (s === 'ringing') {
        setStatus('Ringing');
      }
    });

    return () => {
      newSocket.close();
      stopTimer();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    setTranscript([]);
    setCallDuration(0);
    setStatus('Initiating...');
    setIsCalling(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/call/start`, { to: phone });
      setCallSid(response.data.callSid);
      console.log('Call started, SID:', response.data.callSid);
    } catch (error) {
      console.error('Failed to start call:', error);
      setStatus('Failed to connect');
      setIsCalling(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Interested': return 'text-green-400 bg-green-400/10 border-green-400/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]';
      case 'Not Interested': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'In Call': return 'text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse';
      case 'Ringing': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'Idle': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Salesence AI
            </h1>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <p className="text-slate-400 text-sm">{socketConnected ? 'Live Connection Active' : 'Connecting to server...'}</p>
            </div>
          </div>
          <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 font-bold text-lg transition-all duration-500 ${getStatusColor()}`}>
            <Activity size={22} className={status === 'In Call' || status === 'Initiating...' ? 'animate-spin' : ''} />
            {status.toUpperCase()}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />

              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <User size={22} className="text-indigo-400" />
                Target Seller
              </h2>
              <form onSubmit={handleStartCall} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Utsav Rai"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all placeholder:text-slate-700 text-lg"
                      disabled={isCalling}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all placeholder:text-slate-700 text-lg font-mono"
                      disabled={isCalling}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCalling || !name || !phone}
                  className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-500 transform active:scale-[0.98] mt-4 ${isCalling || !name || !phone
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] text-white shadow-xl'
                    }`}
                >
                  {isCalling ? (
                    <>
                      <Activity size={24} className="animate-spin" />
                      CALLING...
                    </>
                  ) : (
                    <>
                      <Phone size={24} />
                      START OUTREACH
                    </>
                  )}
                </button>

                {isCalling && (
                  <button
                    onClick={() => {
                      setIsCalling(false);
                      setStatus('Ended');
                      stopTimer();
                    }}
                    className="w-full py-3 rounded-xl font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all mt-2 flex items-center justify-center gap-2"
                  >
                    <PhoneOff size={18} />
                    Force Reset UI
                  </button>
                )}
              </form>
            </div>

            {/* Metrics Card */}
            <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2rem] space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duration</p>
                    <p className="text-xl font-mono font-bold text-slate-200">{formatDuration(callDuration)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">SID</p>
                  <p className="text-sm font-mono text-slate-400">{callSid ? callSid.slice(0, 8) + '...' : '----'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Area */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[700px]">
              <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                    <MessageSquare size={24} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Real-time Transcript</h2>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs font-bold tracking-widest uppercase">
                  <span className="flex items-center gap-2 text-indigo-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" /> AI AGENT
                  </span>
                  <span className="flex items-center gap-2 text-slate-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600" /> SELLER
                  </span>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar bg-gradient-to-b from-transparent to-slate-950/20"
              >
                {transcript.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6">
                    <div className="relative">
                      <Activity size={64} className="animate-pulse text-indigo-500/20" />
                      <Phone size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-800" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">Ready for conversation</p>
                      <p className="text-sm text-slate-700 max-w-[200px] mt-1">Initiate a call to see live transcription</p>
                    </div>
                  </div>
                )}
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                  >
                    <div className={`relative group max-w-[85%] rounded-[2rem] px-6 py-4 ${msg.role === 'ai'
                        ? 'bg-slate-800/40 border border-slate-700/50 text-indigo-50 rounded-tl-none shadow-lg'
                        : 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100 rounded-tr-none text-right'
                      }`}>
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-40 ${msg.role === 'ai' ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {msg.role === 'ai' ? 'Utsav (Salesence)' : 'Seller'}
                      </p>
                      <p className="text-lg leading-relaxed font-medium">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Action Bar */}
              <div className="p-6 bg-slate-950/50 border-t border-slate-800/50">
                {status === 'Interested' && (
                  <div className="flex items-center gap-3 text-green-400 font-extrabold justify-center py-4 bg-green-500/5 rounded-2xl border border-green-500/20 animate-in zoom-in duration-500">
                    <CheckCircle size={28} className="animate-bounce" />
                    <span className="text-xl tracking-tight">OPPORTUNITY DETECTED: SELLER IS INTERESTED</span>
                  </div>
                )}
                {status === 'Not Interested' && (
                  <div className="flex items-center gap-3 text-red-500 font-extrabold justify-center py-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                    <XCircle size={28} />
                    <span className="text-xl tracking-tight">CONVERSATION ENDED: NOT INTERESTED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
