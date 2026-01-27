import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, User, MessageSquare, Activity, CheckCircle, XCircle, Clock, ArrowRight, Play, Loader2, Volume2, Shield, Zap, Signal, Power, RefreshCcw } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function AutoDialerPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, DIALING, ACTIVE, COMPLETED, COOLDOWN, CAMPAIGN_COMPLETE
  const [leadStatus, setLeadStatus] = useState(null); 
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const leadsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const processedLeadsRef = useRef(new Set());

  useEffect(() => { leadsRef.current = leads; }, [leads]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads?batch_id=${batchId}`);
      const pendingLeads = response.data.filter(l => l.call_status === 'pending' || l.call_status === 'calling');
      setLeads(pendingLeads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
    const newSocket = io(SOCKET_URL, { transports: ['websocket'], upgrade: false });
    setSocket(newSocket);

    newSocket.on('transcript', (data) => {
      setTranscript(prev => [...prev, data]);
      setCallStatus(prev => (prev === 'DIALING' || prev === 'IDLE' ? 'ACTIVE' : prev));
    });

    newSocket.on('callStatus', (data) => {
      const s = data.status.toLowerCase();
      if (s === 'answered' || s === 'in-progress') setCallStatus('ACTIVE');
      else if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(s)) handleCallEnd();
      else if (s === 'ringing') setCallStatus('DIALING');
    });

    newSocket.on('syncComplete', (data) => {
      console.log('🏁 Sync signal received:', data);
      handleNextLead();
    });

    return () => {
      newSocket.close();
      stopTimer();
    };
  }, [batchId]);

  const handleNextLead = () => {
    const lds = leadsRef.current;
    const idx = currentIndexRef.current;
    const currentId = lds[idx]?.id;

    if (currentId && processedLeadsRef.current.has(currentId)) return;
    if (currentId) processedLeadsRef.current.add(currentId);

    if (idx + 1 < lds.length) {
      setCurrentIndex(idx + 1);
      setCallStatus('COOLDOWN');
    } else {
      setCallStatus('CAMPAIGN_COMPLETE');
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
      console.error('Initial dial failed:', error);
      setTimeout(() => handleNextLead(), 2000);
    }
  };

  const handleCallEnd = () => {
    if (['COMPLETED', 'COOLDOWN', 'CAMPAIGN_COMPLETE'].includes(callStatus)) return;
    setCallStatus('COMPLETED');
    stopTimer();
  };

  useEffect(() => {
    if (callStatus === 'ACTIVE') startTimer();
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'COOLDOWN') {
      const t = setTimeout(() => startCall(), 3000);
      return () => clearTimeout(t);
    }
  }, [callStatus, currentIndex]);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const currentLead = leads[currentIndex];

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden">
      <header className="relative z-20 px-6 py-4 border-b border-white/5 bg-slate-950/20 backdrop-blur-md flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-indigo-400" />
          <span className="font-bold text-xs uppercase tracking-widest">System Live</span>
        </div>
        <button onClick={() => navigate(`/batch/${batchId}`)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
          <Power size={18} />
        </button>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {callStatus === 'IDLE' ? (
            <motion.div key="idle" className="text-center space-y-6">
              <h1 className="text-4xl font-black italic">READY TO LAUNCH?</h1>
              <p className="text-slate-500 font-bold">{leads.length} Leads Pending</p>
              <button onClick={startCall} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all">
                START CAMPAIGN
              </button>
            </motion.div>
          ) : callStatus === 'CAMPAIGN_COMPLETE' ? (
            <motion.div key="complete" className="text-center space-y-6">
              <CheckCircle size={64} className="text-green-500 mx-auto" />
              <h1 className="text-3xl font-black uppercase">Batch Complete</h1>
              <button onClick={() => navigate(`/batch/${batchId}`)} className="bg-indigo-600 px-8 py-3 rounded-2xl font-black">RETURN DASHBOARD</button>
            </motion.div>
          ) : (
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 h-[80vh]">
              {/* Profile Card */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-8 text-center">
                <div className="relative mx-auto">
                   <div className={`w-48 h-48 rounded-[3rem] bg-slate-900 border-2 flex items-center justify-center ${callStatus === 'ACTIVE' ? 'border-green-500 shadow-glow' : 'border-white/10 carousel-item'}`}>
                     <User size={80} className="text-slate-700" />
                   </div>
                </div>
                <div>
                  <h2 className="text-4xl font-black uppercase italic">{currentLead?.name}</h2>
                  <p className="font-mono text-slate-500 mt-2 tracking-widest uppercase">{callStatus === 'DIALING' ? 'Dialing...' : currentLead?.number}</p>
                </div>
                <div className="flex justify-center gap-4">
                   <div className="glass px-6 py-2 rounded-2xl font-mono font-bold flex items-center gap-2">
                     <Clock size={16} /> 0:{callDuration.toString().padStart(2, '0')}
                   </div>
                   {callStatus === 'COMPLETED' && (
                     <button onClick={handleNextLead} className="bg-indigo-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 animate-bounce">
                       <RefreshCcw size={14} /> FORCE SKIP
                     </button>
                   )}
                </div>
              </div>

              {/* Transcript */}
              <div className="lg:col-span-7 flex flex-col overflow-hidden glass rounded-[3rem] border-white/5 shadow-2xl">
                 <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Transcript Hub</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 </div>
                 <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/20">
                    {transcript.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: m.role === 'agent' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm ${m.role === 'agent' ? 'bg-indigo-600/10 border border-indigo-500/20' : 'bg-white/5 border border-white/5'}`}>
                          {m.text}
                        </div>
                      </motion.div>
                    ))}
                    {transcript.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <Activity size={40} className="animate-pulse mb-4" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting Uplink...</p>
                      </div>
                    )}
                 </div>
                 {callStatus === 'COMPLETED' && (
                   <div className="p-4 bg-indigo-600 flex items-center justify-center gap-3">
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span className="font-black text-[10px] tracking-[0.2em] uppercase italic">Syncing Post-Call Data</span>
                   </div>
                 )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-1 bg-slate-900 absolute bottom-0 left-0 w-full overflow-hidden">
        <motion.div className="h-full bg-indigo-600" initial={{ width: 0 }} animate={{ width: `${((currentIndex + (callStatus === 'COMPLETED' ? 1 : 0)) / (leads.length || 1)) * 100}%` }} />
      </footer>
    </div>
  );
}
