import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, Zap, BarChart3, ArrowRight, Play } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      icon: <Zap className="text-yellow-400" />,
      title: "Real-time AI",
      desc: "Ultra-low latency conversations that feel human and natural."
    },
    {
      icon: <Shield className="text-blue-400" />,
      title: "Full Autonomy",
      desc: "Handles objections and schedules meetings without intervention."
    },
    {
      icon: <BarChart3 className="text-purple-400" />,
      title: "Smart Insights",
      desc: "Automatic lead qualification and interest detection."
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative z-10">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            
            
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition-all font-medium text-sm"
          >
            Go to Console
          </button>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn}>
            <h1 className="text-6xl font-extrabold leading-[1.1] mb-8 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
              The AI Agent <br />
              <span className="text-indigo-400 italic">that sells</span> <br />
              while you sleep.
            </h1>
            <p className="text-xl text-slate-400 mb-10 max-w-lg leading-relaxed">
              Automate your cold outreach with human-like AI. High-conversion voice agents that qualify leads in real-time.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-50 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:text-indigo-600 hover:border-indigo-600 transition-all rounded-full font-black text-lg flex items-center gap-3 group"
              >
                Launch Console
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold text-lg flex items-center gap-3 decoration-white/30 decoration-offset-4 decoration-2 underline-offset-4">
                <Play size={18} />
                Watch Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] group-hover:bg-indigo-500/30 transition-all" />
              <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-2 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <div className="bg-[#020617] rounded-[2rem] overflow-hidden">
                  {/* Mock UI Preview */}
                  <div className="p-8 space-y-4">
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Active Outreach</div>
                          <div className="text-xs text-slate-500">Queue: 128 Leads</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">LIVE_SESSION_01</div>
                    </div>
                    <div className="space-y-3 py-4">
                      <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                      <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                      <div className="h-8 bg-indigo-500/10 rounded-xl w-full flex items-center px-4">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Interested: Yes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-48">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
