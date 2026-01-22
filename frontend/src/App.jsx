import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import BatchLeadsPage from './pages/BatchLeadsPage';
import AutoDialerPage from './pages/AutoDialerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/batch/:batchId" element={<BatchLeadsPage />} />
          <Route path="/agent/:batchId" element={<AutoDialerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
