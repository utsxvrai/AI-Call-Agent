import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Check, Loader2, Database } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function ExcelUpload({ onUploadSuccess }) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                const normalizedData = rawData.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.trim().toLowerCase();
                        newRow[normalizedKey] = row[key];
                    });
                    return newRow;
                });

                if (normalizedData.length === 0) {
                    setError("No data found.");
                    return;
                }

                const requiredColumns = ['name', 'number'];
                const missing = requiredColumns.filter(col => !(col in normalizedData[0]));

                if (missing.length > 0) {
                    setError(`Missing: ${missing.join(', ').toUpperCase()}`);
                    return;
                }

                setPreview(normalizedData);
            } catch (err) {
                setError("Invalid file format.");
                console.error(err);
            }
        };

        reader.readAsBinaryString(file);
    };

    const confirmUpload = async () => {
        if (!preview) return;
        setIsUploading(true);
        setError(null);

        try {
            await axios.post(`${API_BASE_URL}/leads/batch`, { leads: preview });
            setPreview(null);
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.response?.data?.error || "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                    >
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-500/10 rounded-2xl cursor-pointer hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                            <div className="flex flex-col items-center justify-center relative z-10 px-6 text-center">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-indigo-400">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <p className="text-sm font-bold text-white mb-0.5">Ingest Lead Data</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">XLSX • Name, Number Required</p>
                            </div>
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                        </label>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                    >
                        <div className="bg-slate-950/30 rounded-2xl p-6 border border-white/5 relative group">
                            <div className="absolute top-0 right-0 p-3">
                                <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Database size={16} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Validation Success</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{preview.length} Entries Ready</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                {preview.slice(0, 3).map((row, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-4 bg-white/[0.02] rounded-xl border border-white/5 text-xs text-slate-300">
                                        <span className="font-bold">{row.name}</span>
                                        <span className="font-mono text-[10px] text-slate-500">{row.number}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={confirmUpload}
                                disabled={isUploading}
                                className="w-full py-3 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> CONFIRM UPLOAD</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                    <X size={14} /> {error}
                </div>
            )}
        </div>
    );
}
