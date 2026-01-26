import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Users, ArrowRight, Play, Upload, Clock, Search, Trash2, LayoutGrid, Plus } from 'lucide-react';
import ExcelUpload from '../components/ExcelUpload';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function Dashboard() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/leads/batches`);
      setBatches(response.data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleDeleteBatch = async (e, batchId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this campaign? All lead data will be lost.")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/leads/batch/${batchId}`);
      setBatches(batches.filter(b => b.id !== batchId));
    } catch (error) {
      console.error('Failed to delete batch:', error);
      alert('Failed to delete batch');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-x-hidden p-6 sm:p-10">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] right-0 w-[30%] h-[50%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <LayoutGrid size={24} className="text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Campaigns</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">Manage and monitor AI automation batches.</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowUpload(!showUpload)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm active:scale-95 ${
              showUpload 
              ? 'bg-slate-800 text-slate-300' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/10'
            }`}
          >
            {showUpload ? <Clock size={18} /> : <Plus size={18} />}
            {showUpload ? 'View All' : 'New Campaign'}
          </motion.button>
        </header>

        <AnimatePresence mode="wait">
          {showUpload ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Initialize Batch</h2>
                <p className="text-sm text-slate-500">Upload your target list to begin.</p>
              </div>
              <ExcelUpload onUploadSuccess={() => {
                fetchBatches();
                setShowUpload(false);
              }} />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 bg-slate-900/40 animate-pulse rounded-2xl border border-white/5" />
                ))
              ) : batches.length === 0 ? (
                <div className="col-span-full py-20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center text-center px-6">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-600 rotate-6">
                    <LayoutGrid size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No campaigns yet</h3>
                  <p className="text-slate-500 max-w-xs text-sm mb-8 font-medium">Launch your first AI outreach batch to see statistics and insights here.</p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    KICKOFF NOW
                  </button>
                </div>
              ) : (
                batches.map((batch, i) => (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/batch/${batch.id}`)}
                    className="group bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl hover:bg-slate-900/60 border border-white/5 transition-all cursor-pointer relative overflow-hidden flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                        <Calendar size={20} />
                      </div>
                      <button 
                        onClick={(e) => handleDeleteBatch(e, batch.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {batch.name || `Outreach - ${new Date(batch.date).toLocaleDateString()}`}
                      </h3>
                      <div className="flex flex-wrap gap-2.5 mt-2">
                         <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                          <Clock size={12} /> {formatDate(batch.date).split(',')[1].trim()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                          <Search size={12} /> ID: {batch.id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <Users size={14} />
                        Leads
                      </div>
                      <ArrowRight size={18} className="text-slate-700 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
