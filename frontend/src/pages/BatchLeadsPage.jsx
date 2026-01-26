import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Play, User, Hash, MessageSquare, Clock, Filter, ListFilter, Trash2, ShieldCheck, Zap } from 'lucide-react';
import LeadsTable from '../components/LeadsTable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function BatchLeadsPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/leads?batch_id=${batchId}`);
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [batchId]);

  const handleDeleteBatch = async () => {
    if (!window.confirm("Are you sure you want to delete this campaign? All lead data will be lost.")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/leads/batch/${batchId}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete batch:', error);
      alert('Failed to delete batch');
    }
  };

  const stats = {
    total: leads.length,
    called: leads.filter(l => l.call_status === 'called' || l.call_status === 'hanged up').length,
    interested: leads.filter(l => l.is_interested).length
  };

  const statCards = [
    { label: 'Identities', value: stats.total, icon: <User size={18} className="text-blue-400" />, bg: 'bg-blue-400/5', border: 'border-blue-400/10' },
    { label: 'Processed', value: stats.called, icon: <ShieldCheck size={18} className="text-indigo-400" />, bg: 'bg-indigo-400/5', border: 'border-indigo-400/10' },
    { label: 'Interested', value: stats.interested, icon: <Zap size={18} className="text-amber-400" />, bg: 'bg-amber-400/5', border: 'border-amber-400/10' }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 sm:p-10 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-0 w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[30%] h-[50%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-slate-900/50 rounded-xl hover:bg-slate-800 transition-colors text-slate-500 border border-white/5"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Pipeline View</div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Hash size={18} className="text-slate-700" />
                {batchId.slice(0, 12)}...
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={handleDeleteBatch}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/10 transition-all font-bold text-xs"
              title="Delete Campaign"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={() => navigate(`/agent/${batchId}`)}
              disabled={leads.length === 0}
              className="px-6 py-3 bg-white text-black rounded-xl font-black text-xs transition-all hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2 uppercase tracking-tighter"
            >
              <Play size={16} className="fill-current" />
              Start Deployment
            </button>
          </div>
        </header>

        {/* Stats Grid - Smaller */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {statCards.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${s.bg} ${s.border} border p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden group shadow-lg shadow-black/20`}
            >
              <div className="p-4 bg-slate-900/50 rounded-xl group-hover:scale-105 transition-transform duration-500">{s.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <div className="text-2xl font-black text-white tabular-nums">{s.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Leads Table Section - Polished */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ListFilter size={18} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Target Database</h2>
            </div>
            <div className="text-[8px] font-black text-slate-600 bg-slate-950/50 px-3 py-1 rounded-full border border-white/5 uppercase tracking-[0.2em]">
              Synchronized Live
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <LeadsTable 
              leads={leads} 
              onSelectLead={(lead) => {
                console.log('Selected lead:', lead);
              }} 
              isLoading={isLoading} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
