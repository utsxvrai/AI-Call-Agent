import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, User, MessageSquare, Activity, CheckCircle, XCircle, Clock, ArrowRight, Play, Loader2, Volume2, Shield, Zap, Signal, Power } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function AutoDialerPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, DIALING, ACTIVE, COMPLETED, COOLDOWN, CAMPAIGN_COMPLETE
  const [leadStatus, setLeadStatus] = useState(null); // Interested, Not Interested
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const leadsRef = useRef([]);
  const currentIndexRef = useRef(0);

  // Keep refs in sync with state for use in closures
  useEffect(() => { leadsRef.current = leads; }, [leads]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads?batch_id=${batchId}`);
      // Filter only pending leads for the auto-dialer
      const pendingLeads = response.data.filter(l => l.call_status === 'pending');
      setLeads(pendingLeads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false
    });
    setSocket(newSocket);

    newSocket.on('transcript', (data) => {
      setTranscript(prev => [...prev, data]);
      setCallStatus(prev => {
        if (prev !== 'ACTIVE') return 'ACTIVE';
        return prev;
      });
    });

    newSocket.on('callStatus', (data) => {
      const s = data.status.toLowerCase();
      if (s === 'answered' || s === 'in-progress') {
        setCallStatus('ACTIVE');
      } else if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(s)) {
        handleCallEnd();
      } else if (s === 'ringing') {
        setCallStatus('DIALING');
      }
    });

    newSocket.on('syncComplete', (data) => {
      setCallStatus(prev => {
        const lds = leadsRef.current;
        const idx = currentIndexRef.current;

        if (idx + 1 < lds.length) {
          setCurrentIndex(prevIdx => prevIdx + 1);
          return 'COOLDOWN';
        } else {
          return 'CAMPAIGN_COMPLETE';
        }
      });
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
    const lds = leadsRef.current;
    const idx = currentIndexRef.current;
    if (idx >= lds.length) {
      setCallStatus('CAMPAIGN_COMPLETE');
      return;
    }
    
    const lead = lds[idx];
    setTranscript([]);
    setCallDuration(0);
    setLeadStatus(null);
    setCallStatus('DIALING');

    try {
      await axios.post(`${API_BASE_URL}/outbound/outgoing-call`, { 
        number: lead.number,
        leadId: lead.id,
        name: lead.name 
      });
    } catch (error) {
      console.error('Call failed:', error);
      if (idx + 1 < lds.length) {
        setCurrentIndex(prev => prev + 1);
        setCallStatus('COOLDOWN');
      } else {
        setCallStatus('CAMPAIGN_COMPLETE');
      }
    }
  };

  const handleCallEnd = () => {
    if (callStatus === 'COMPLETED' || callStatus === 'COOLDOWN' || callStatus === 'CAMPAIGN_COMPLETE') return;
    setCallStatus('COMPLETED');
    stopTimer();
  };

  useEffect(() => {
    if (callStatus === 'ACTIVE') startTimer();
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'COOLDOWN') startCall();
  }, [currentIndex]);

  const currentLead = leads[currentIndex];

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden font-sans">
      {/* HUD Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-gentle" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-gentle" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Top Navbar HUD - Reduced Padding/Size */}
      <header className="relative z-20 px-6 py-4 border-b border-white/5 bg-slate-950/20 backdrop-blur-md flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="p-2 glass rounded-xl text-indigo-400">
            <Shield size={16} />
          </div>
          <div>
            <div className="text-[8px] font-black tracking-[0.2em] text-slate-500 uppercase">System Status</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="font-bold text-xs">ENCRYPTED</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Signal size={12} className="text-green-500" />
            LIVE
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-indigo-500" />
            120ms
          </div>
        </div>

        <button 
          onClick={() => navigate(`/batch/${batchId}`)}
          className="p-2 glass rounded-xl hover:bg-white/10 transition-all text-slate-400"
        >
          <Power size={18} />
        </button>
      </header>

      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {callStatus === 'IDLE' ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full animate-pulse" />
                <div className="w-20 h-20 glass border-indigo-500/30 rounded-3xl flex items-center justify-center relative z-10">
                  <Play size={32} className="text-indigo-400 ml-1.5 fill-current" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic">
                  Launch <span className="text-indigo-500 text-glow">Sophia</span>
                </h1>
                <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">
                  {leads.length} Pending Nodes • Batch {batchId.slice(0, 8)}
                </p>
              </div>
              <button 
                onClick={startCall}
                className="bg-white text-black px-8 py-3.5 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 group"
              >
                INITIATE
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : callStatus === 'CAMPAIGN_COMPLETE' ? (
             <motion.div 
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-3xl border border-green-500/30 flex items-center justify-center">
                 <CheckCircle size={40} className="text-green-500" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black uppercase italic">Sequence Finished</h1>
                <p className="text-slate-500 font-medium text-sm tracking-wide">All target nodes processed.</p>
              </div>
              <button 
                onClick={() => navigate(`/batch/${batchId}`)}
                className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 rounded-2xl font-black text-md transition-all shadow-glow uppercase tracking-wider"
              >
                Return to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-10 h-full overflow-hidden"
            >
              {/* Left Column: Caller Panel - Fixed height/scroll allowed within */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-8 h-full overflow-y-auto custom-scrollbar pr-2">
                <div className="relative flex justify-center shrink-0">
                  <AnimatePresence>
                    {(callStatus === 'DIALING' || callStatus === 'ACTIVE') && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {[1, 2, 3].map((i) => (
                          <motion.div 
                            key={i}
                            initial={{ scale: 1, opacity: 0.3 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.7 }}
                            className={`absolute w-32 h-32 border-2 rounded-[2.5rem] ${callStatus === 'ACTIVE' ? 'border-green-500/20' : 'border-indigo-500/20'}`}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div 
                    layout
                    className={`w-40 h-40 sm:w-48 sm:h-48 rounded-[3rem] bg-slate-900 border-2 flex flex-col items-center justify-center relative z-10 transition-all duration-700 ${
                      callStatus === 'ACTIVE' 
                        ? 'border-green-500 bg-slate-950 shadow-[0_0_50px_rgba(34,197,94,0.1)]' 
                        : 'border-white/10'
                    }`}
                  >
                    <User size={64} className={`${callStatus === 'ACTIVE' ? 'text-indigo-400' : 'text-slate-700'} transition-colors duration-700`} />
                  </motion.div>
                </div>

                <div className="text-center space-y-3 shrink-0">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white truncate px-4 uppercase italic">
                      {currentLead?.name || '---'}
                    </h2>
                    <p className="font-mono text-slate-500 font-bold tracking-[0.3em] text-[10px] uppercase">
                      {callStatus === 'DIALING' ? 'DIALING_TARGET' : callStatus === 'COMPLETED' ? 'DISCONNECTED' : currentLead?.number}
                    </p>
                    <div className="flex justify-center mt-2">
                      <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border-white/5">
                        <Clock size={12} className="text-indigo-400" />
                        <span className="font-mono font-bold text-sm tracking-tight tabular-nums">
                          {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                </div>

                <AnimatePresence>
                  {leadStatus && (
                     <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-[2rem] border-2 text-center relative overflow-hidden shrink-0 ${
                        leadStatus === 'Interested' 
                          ? 'bg-green-500/5 border-green-500/20 text-green-400'
                          : 'bg-red-500/5 border-red-500/10 text-slate-500'
                      }`}
                    >
                      <div className={`text-[8px] font-black tracking-[0.4em] uppercase mb-2`}>
                        Classification
                      </div>
                      <div className="text-xl font-black italic uppercase tracking-tighter">
                        {leadStatus === 'Interested' ? 'OPPORTUNITY' : 'REJECTED'}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Transcript HUD Hub - Scrollable only in the transcript part */}
              <div className="lg:col-span-7 h-full flex flex-col overflow-hidden">
                <div className="flex-1 glass rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative border-white/5">
                   <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                     <div className="flex items-center gap-3">
                        <MessageSquare size={16} className="text-indigo-400" />
                        <span className="font-black tracking-[0.2em] text-[9px] uppercase text-slate-400">Stream.sophia_v01</span>
                     </div>
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                   </div>

                   <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20"
                   >
                     {transcript.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-3">
                         <Activity size={32} className="text-indigo-400 animate-pulse" />
                         <div className="text-[8px] font-black uppercase tracking-[0.3em]">Network Idle...</div>
                       </div>
                     )}
                     {transcript.map((m, i) => (
                       <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: m.role === 'agent' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'}`}
                       >
                         <div className={`max-w-[85%]`}>
                           <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium ${
                             m.role === 'agent' 
                              ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-50 rounded-tl-none' 
                              : 'bg-white/5 border border-white/5 text-slate-300 rounded-tr-none'
                           }`}>
                             {m.text}
                             {m.role === 'agent' && (
                               <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[size:100%_4px] pointer-events-none rounded-2xl opacity-20" />
                             )}
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                   
                   <AnimatePresence>
                     {callStatus === 'COMPLETED' && (
                       <motion.div 
                        initial={{ y: 40 }}
                        animate={{ y: 0 }}
                        exit={{ y: 40 }}
                        className="p-4 bg-indigo-600 flex items-center justify-center gap-3"
                       >
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span className="font-black text-[10px] tracking-[0.2em] uppercase italic">Syncing Neuron Data</span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress Bar HUD - Slimmer */}
      <footer className="relative z-20 px-6 py-3 bg-slate-950/40 border-t border-white/5 flex items-center justify-between gap-8 h-12">
        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative group">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + (callStatus === 'COMPLETED' ? 1 : 0)) / leads.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 30 }}
          />
        </div>
        <div className="font-mono text-[10px] font-black text-indigo-400 uppercase tracking-widest tabular-nums">
          {currentIndex + 1} / {leads.length} • {Math.round(((currentIndex + (callStatus === 'COMPLETED' ? 1 : 0)) / leads.length) * 100)}%
        </div>
      </footer>
    </div>
  );
}
