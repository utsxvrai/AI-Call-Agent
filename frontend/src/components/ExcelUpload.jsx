import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

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

                // Normalize keys (lowercase and trim) for robustness
                const normalizedData = rawData.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.trim().toLowerCase();
                        newRow[normalizedKey] = row[key];
                    });
                    return newRow;
                });

                // Basic validation
                if (normalizedData.length === 0) {
                    setError("Sheet is empty");
                    return;
                }

                const requiredColumns = ['name', 'number'];
                const firstRow = normalizedData[0];
                const missing = requiredColumns.filter(col => !(col in firstRow));

                if (missing.length > 0) {
                    setError(`Missing columns: ${missing.join(', ')}`);
                    return;
                }

                setPreview(normalizedData);
            } catch (err) {
                setError("Failed to parse Excel file");
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
            setError(err.response?.data?.error || "Failed to upload leads");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Upload size={20} className="text-indigo-400" />
                    Import Leads
                </h3>
                {preview && (
                    <button
                        onClick={() => setPreview(null)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {!preview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/30 hover:border-indigo-500/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileSpreadsheet size={32} className="text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
                        <p className="text-sm text-slate-500">
                            <span className="font-bold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-600 mt-1">Excel (.xlsx) with name, number, description</p>
                    </div>
                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                </label>
            ) : (
                <div className="space-y-4">
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Preview ({preview.length} leads)</p>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-600 border-b border-slate-800">
                                    <th className="pb-2 font-medium">Name</th>
                                    <th className="pb-2 font-medium">Number</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.slice(0, 5).map((row, i) => (
                                    <tr key={i} className="text-slate-400 border-b border-slate-900/50 last:border-0">
                                        <td className="py-2">{row.name}</td>
                                        <td className="py-2 font-mono">{row.number}</td>
                                    </tr>
                                ))}
                                {preview.length > 5 && (
                                    <tr>
                                        <td colSpan="2" className="py-2 text-center text-slate-600 text-xs italic">
                                            + {preview.length - 5} more rows...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={confirmUpload}
                        disabled={isUploading}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        IMPORT LEADS
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm flex items-center gap-2">
                    <X size={16} />
                    {error}
                </div>
            )}
        </div>
    );
}
