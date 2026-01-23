import React from 'react';
import { Phone, CheckCircle, XCircle, Clock, Trash2, User } from 'lucide-react';

export default function LeadsTable({ leads, onSelectLead, isLoading }) {
  const getStatusIcon = (status, isInterested) => {
    if (status === 'called') {
      return isInterested 
        ? <CheckCircle size={16} className="text-green-400" />
        : <XCircle size={16} className="text-red-400" />;
    }
    return <Clock size={16} className="text-slate-500" />;
  };

  const getStatusText = (status, isInterested) => {
    if (status === 'called') {
      return isInterested ? 'Interested' : 'Not Interested';
    }
    return 'Pending';
  };

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-500 italic">
        Loading leads...
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
          <User size={24} className="text-indigo-400" />
          Lead Pipeline
        </h2>
        <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400">
          {leads.length} TOTAL
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-widest bg-slate-950/20">
              <th className="px-6 py-4">Lead Info</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {leads.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-slate-600 italic">
                  No leads imported yet. Upload an Excel sheet to get started.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">{lead.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{lead.number}</div>
                    {lead.description && (
                      <div className="text-[10px] text-slate-600 mt-1 italic truncate max-w-[200px]">
                        {lead.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      {getStatusIcon(lead.call_status, lead.is_interested)}
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                        lead.call_status === 'called' 
                          ? (lead.is_interested ? 'text-green-500' : 'text-red-500')
                          : 'text-slate-500'
                      }`}>
                        {getStatusText(lead.call_status, lead.is_interested)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectLead(lead)}
                      disabled={lead.call_status === 'called'}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ml-auto transition-all ${
                        lead.call_status === 'called'
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                      }`}
                    >
                      <Phone size={14} />
                      {lead.call_status === 'called' ? 'RE-CALL' : 'CALL'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
