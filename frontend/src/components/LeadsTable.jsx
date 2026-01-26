import React from 'react';
import { Phone, CheckCircle, XCircle, Clock, Trash2, User, MoreHorizontal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeadsTable({ leads, onSelectLead, isLoading }) {
  const getStatusConfig = (status, isInterested) => {
    if (status === 'called' || status === 'hanged up') {
      if (isInterested) return {
        icon: <CheckCircle size={14} className="text-green-400" />,
        text: 'Interested',
        color: 'text-green-400',
        bg: 'bg-green-400/5',
        border: 'border-green-400/10'
      };
      return {
        icon: <XCircle size={14} className="text-red-400" />,
        text: status === 'hanged up' ? 'Hanged Up' : 'Not Interested',
        color: 'text-red-400',
        bg: 'bg-red-400/5',
        border: 'border-red-400/10'
      };
    }
    if (status === 'calling') return {
      icon: <Activity size={14} className="text-indigo-400 animate-pulse" />,
      text: 'Calling',
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/5',
      border: 'border-indigo-400/10'
    };
    return {
      icon: <Clock size={14} className="text-slate-500" />,
      text: 'Waiting',
      color: 'text-slate-500',
      bg: 'bg-slate-500/5',
      border: 'border-slate-500/10'
    };
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="font-bold tracking-widest text-[10px] uppercase opacity-50">Syncing...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="text-slate-500 text-[9px] font-black uppercase tracking-[0.15em] border-b border-white/5 bg-slate-950/10">
            <th className="px-6 py-4 text-left">Target Profile</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Operation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.length === 0 ? (
            <tr>
              <td colSpan="3" className="px-6 py-20 text-center text-slate-600 text-xs font-medium italic">
                No records found in this dataset.
              </td>
            </tr>
          ) : (
            leads.map((lead, i) => {
              const config = getStatusConfig(lead.call_status, lead.is_interested);
              return (
                <motion.tr 
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5 tracking-tight">
                          {lead.number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
                        {config.icon}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {config.text}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectLead(lead)}
                      disabled={lead.call_status === 'called' || lead.call_status === 'calling'}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center gap-2 ml-auto transition-all active:scale-95 ${
                        lead.call_status === 'called' || lead.call_status === 'calling'
                          ? 'bg-slate-900/50 text-slate-700 cursor-not-allowed border border-white/5'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/10'
                      }`}
                    >
                      <Phone size={12} />
                      {lead.call_status === 'called' ? 'SYCHRONIZED' : lead.call_status === 'calling' ? 'ACTIVE' : 'DIAL'}
                    </button>
                  </td>
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
