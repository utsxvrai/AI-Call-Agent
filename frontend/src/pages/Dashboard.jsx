import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Users, ArrowRight, Play, Upload, Clock, Search, Trash2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Campaign Console</h1>
            <p className="text-slate-500">Manage your outreach batches and AI agents.</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            {showUpload ? <Clock size={20} /> : <Upload size={20} />}
            {showUpload ? 'View Batches' : 'New Campaign'}
          </button>
        </header>

        {showUpload ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl"
          >
            <ExcelUpload onUploadSuccess={() => {
              fetchBatches();
              setShowUpload(false);
            }} />
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                <p className="font-medium">Loading your campaigns...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="py-20 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 text-slate-500">
                  <Calendar size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
                <p className="text-slate-500 max-w-xs mb-8">Upload an Excel sheet to start your first AI outreach campaign.</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-indigo-400 font-bold hover:underline flex items-center gap-2"
                >
                  Get started now <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              batches.map((batch, i) => (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/batch/${batch.id}`)}
                  className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        Outreach - {formatDate(batch.date).split(',')[0]}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> {formatDate(batch.date).split(',')[1]}
                        </span>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Search size={12} /> ID: {batch.id?.slice(0, 8) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => handleDeleteBatch(e, batch.id)}
                      className="p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-slate-400 transition-colors">
                      <Users size={18} />
                    </button>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
