import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, User, MessageSquare, Activity, CheckCircle, XCircle, Clock, ArrowRight, Play, Loader2, Volume2 } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function AutoDialerPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, DIALING, ACTIVE, COMPLETED, COOLDOWN
  const [leadStatus, setLeadStatus] = useState(null); // Interested, Not Interested
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads?batch_id=${batchId}`);
      // Filter only pending leads for the auto-dialer
      const pendingLeads = response.data.filter(l => l.status === 'pending');
      setLeads(pendingLeads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('transcript', (data) => {
      setTranscript(prev => [...prev, data]);
    });

    newSocket.on('status', (data) => {
      if (data.status === 'Interested') setLeadStatus('Interested');
      else if (data.status === 'Not Interested') setLeadStatus('Not Interested');
    });

    newSocket.on('callStatus', (data) => {
      const s = data.status.toLowerCase();
      if (s === 'answered') {
        setCallStatus('ACTIVE');
        startTimer();
      } else if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(s)) {
        handleCallEnd();
      } else if (s === 'ringing') {
        setCallStatus('DIALING');
      }
    });

    return () => {
      newSocket.close();
      stopTimer();
    };
  }, [batchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

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

  const startCall = async () => {
    if (currentIndex >= leads.length) return;
    const lead = leads[currentIndex];
    
    setTranscript([]);
    setCallDuration(0);
    setLeadStatus(null);
    setCallStatus('DIALING');

    try {
      await axios.post(`${API_BASE_URL}/call/start`, { 
        to: lead.number,
        leadId: lead.id 
      });
    } catch (error) {
      console.error('Call failed to start:', error);
      setCallStatus('IDLE');
    }
  };

  const handleCallEnd = () => {
    setCallStatus('COMPLETED');
    stopTimer();
    
    // 3 second cool-down before moving to next lead
    setTimeout(() => {
      if (currentIndex + 1 < leads.length) {
        setCallStatus('COOLDOWN');
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 1000);
      } else {
        setCallStatus('CAMPAIGN_COMPLETE');
      }
    }, 3000);
  };

  // Auto-start next call when currentIndex changes (if already in campaign mode)
  useEffect(() => {
    if (callStatus === 'COOLDOWN') {
      startCall();
    }
  }, [currentIndex]);

  const currentLead = leads[currentIndex];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <AnimatePresence mode="wait">
          {callStatus === 'IDLE' ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-8"
            >
              <div className="w-24 h-24 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play size={40} className="text-indigo-400 fill-current" />
              </div>
              <div>
                <h1 className="text-4xl font-black mb-2">Ready to Start?</h1>
                <p className="text-slate-500">You have {leads.length} leads in this campaign batch.</p>
              </div>
              <button 
                onClick={startCall}
                className="bg-white text-black px-12 py-5 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                KICK OFF AGENT
              </button>
            </motion.div>
          ) : callStatus === 'CAMPAIGN_COMPLETE' ? (
             <motion.div 
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h1 className="text-4xl font-black">Campaign Complete</h1>
              <p className="text-slate-500">All leads in this batch have been processed.</p>
              <button 
                onClick={() => navigate(`/batch/${batchId}`)}
                className="text-indigo-400 font-bold hover:underline"
              >
                Back to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center"
            >
              {/* Left Side: Calling UI */}
              <div className="lg:col-span-2 space-y-12">
                <div className="relative flex justify-center">
                  {/* Pulse Animation for Ringing */}
                  {callStatus === 'DIALING' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[1, 2, 3].map((i) => (
                        <motion.div 
                          key={i}
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                          className="absolute w-32 h-32 border-2 border-indigo-500/30 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className={`w-40 h-40 rounded-[3rem] bg-slate-900 border-2 ${callStatus === 'ACTIVE' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-indigo-500/50'} flex items-center justify-center relative z-10 transition-colors duration-500`}>
                    <User size={64} className="text-slate-700" />
                    {callStatus === 'ACTIVE' && (
                      <div className="absolute -bottom-4 right-4 bg-green-500 p-2 rounded-xl border-4 border-[#020617] animate-bounce">
                        <Activity size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-3xl font-black text-white truncate max-w-xs mx-auto mb-1">
                    {currentLead?.name || 'Loading...'}
                  </h2>
                  <p className="font-mono text-slate-500 font-bold tracking-widest uppercase text-sm">
                    {callStatus === 'DIALING' ? 'Ringing...' : callStatus === 'COMPLETED' ? 'Call Ended' : currentLead?.number}
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <span className="text-xs font-black bg-slate-900 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                       <Clock size={14} className="text-indigo-400" />
                       {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                    </span>
                    {currentIndex + 1 < leads.length && (
                      <span className="text-xs font-black text-slate-600">
                        NEXT UP: {leads[currentIndex + 1]?.name}
                      </span>
                    )}
                  </div>
                </div>

                {leadStatus && (
                   <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-6 rounded-[2rem] border text-center font-black text-lg ${
                      leadStatus === 'Interested' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {leadStatus === 'Interested' ? 'OPPORTUNITY: INTERESTED' : 'CONVERSATION ENDED'}
                  </motion.div>
                )}
              </div>

              {/* Right Side: Transcript HUD */}
              <div className="lg:col-span-3">
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 h-[500px] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                   <div className="p-6 border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <MessageSquare size={20} className="text-indigo-400" />
                       <span className="font-bold text-sm">LIVE FEED</span>
                     </div>
                     <div className="flex gap-1">
                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-slate-700 rounded-full" />)}
                     </div>
                   </div>

                   <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
                   >
                     {transcript.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center opacity-20 bg-slate-900/40 rounded-[2rem]">
                         <Volume2 size={40} className="mb-4 animate-pulse" />
                         <span className="text-xs font-bold uppercase tracking-widest">Waiting for speech...</span>
                       </div>
                     )}
                     {transcript.map((m, i) => (
                       <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                       >
                         <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm ${
                           m.role === 'ai' 
                            ? 'bg-white/5 border border-white/10 rounded-tl-none' 
                            : 'bg-indigo-600/20 border border-indigo-500/20 text-indigo-100 rounded-tr-none'
                         }`}>
                           <p className="leading-relaxed">{m.text}</p>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                   
                   {callStatus === 'COMPLETED' && (
                     <div className="p-6 bg-indigo-600 text-center font-black text-sm tracking-widest uppercase animate-pulse">
                        Call Completed. Moving to next lead...
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Campaign Progress Bar */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-slate-900 overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + (callStatus === 'COMPLETED' ? 1 : 0)) / leads.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
