import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, Zap, BarChart3, ArrowRight, Play, Globe, Cpu, Lock } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const featureCards = [
    {
      icon: <Cpu size={24} className="text-indigo-400" />,
      title: "Neural-Link Voice",
      desc: "Ultra-low latency conversations powered by advanced LLMs for human-grade interaction."
    },
    {
      icon: <Lock size={24} className="text-purple-400" />,
      title: "Encrypted Security",
      desc: "Enterprise-grade security for your lead data and communication channels."
    },
    {
      icon: <Globe size={24} className="text-blue-400" />,
      title: "Global Reach",
      desc: "Deploy AI agents across time zones, scaling your outreach to a global audience instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-indigo-500/30">
      {/* Immersive Background Glows */}
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] bg-purple-600/10 blur-[130px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 sm:py-12 relative z-10">
        <nav className="flex justify-between items-center mb-20 sm:mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap size={20} className="text-white fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight uppercase italic">Sophia_AI</span>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-xl glass hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
          >
            Open Console
          </motion.button>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/5 text-[9px] font-black tracking-widest uppercase text-indigo-400 mb-6 font-mono">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              v2.4 Live
            </div>
            <h1 className="text-5xl sm:text-6xl font-black leading-[0.95] mb-8 tracking-tighter uppercase italic">
              Scale Your <br />
              <span className="text-indigo-500 text-glow">Outreach</span> <br />
              Efficiency
            </h1>
            <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-sm leading-relaxed font-medium">
               Deploy high-conversion AI voice agents that qualify leads, handle objections, and schedule meetings 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-white text-black hover:bg-indigo-50 transition-all rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl"
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 glass hover:bg-white/10 border border-white/5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all uppercase tracking-tight">
                <Play size={18} className="fill-current" />
                Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative lg:h-[450px] flex items-center justify-center"
          >
            <div className="relative group w-full max-w-sm">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[80px]" />
              <div className="glass-dark p-1.5 rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-white/5">
                <div className="bg-[#020617] rounded-[2.2rem] overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-widest text-slate-600 uppercase mb-0.5">Sophie.node</div>
                          <div className="text-sm font-black text-white italic">Active_Deploy</div>
                        </div>
                      </div>
                      <div className="text-[8px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-full border border-indigo-400/10">SYNC</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-3 bg-white/5 rounded-full w-full" />
                      <div className="h-3 bg-white/5 rounded-full w-2/3" />
                      
                      <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl space-y-3">
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Sentiment</div>
                        <div className="text-lg font-black italic uppercase tracking-tighter">Interest: High</div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-32 relative">
          {featureCards.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass p-8 rounded-3xl hover:bg-white/[0.05] transition-all group border-white/5 shadow-xl"
            >
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-all text-indigo-400 border-white/5">
                {f.icon}
              </div>
              <h3 className="text-lg font-black mb-3 uppercase italic tracking-tighter">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed text-xs font-medium">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-600">
        <div className="text-[9px] font-black uppercase tracking-[0.3em]">Sophia_AI • © 2026</div>
        <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest">
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
