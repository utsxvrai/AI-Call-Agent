import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Play, User, Hash, MessageSquare, Clock, Filter, ListFilter } from 'lucide-react';
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

  const stats = {
    total: leads.length,
    called: leads.filter(l => l.status === 'called').length,
    interested: leads.filter(l => l.is_interested).length
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-4 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-colors text-slate-400"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">Campaign Batch</div>
              <h1 className="text-3xl font-black text-white">ID: {batchId.slice(0, 8)}</h1>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(`/agent/${batchId}`)}
            disabled={leads.length === 0}
            className="group flex items-center gap-4 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            <Play size={24} className="fill-current" />
            START AI AGENT
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Leads', value: stats.total, icon: <User className="text-blue-400" />, bg: 'bg-blue-400/5' },
            { label: 'Called', value: stats.called, icon: <Phone className="text-indigo-400" />, bg: 'bg-indigo-400/5' },
            { label: 'Interested', value: stats.interested, icon: <Play className="text-green-400" />, bg: 'bg-green-400/5' }
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border border-white/5 p-6 rounded-[2rem] flex items-center gap-6`}>
              <div className="p-4 bg-white/5 rounded-2xl">{s.icon}</div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-3xl font-black text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Leads Table Section */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ListFilter size={20} className="text-slate-500" />
              <h2 className="text-xl font-bold text-white">Lead Pipeline</h2>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase">CSV Export</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase">Sort by Date</span>
            </div>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <LeadsTable 
              leads={leads} 
              onSelectLead={(lead) => {
                // For individual calls, we could still support the old modal or 
                // just navigate to a single-dialer mode
                console.log('Selected lead:', lead);
              }} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
