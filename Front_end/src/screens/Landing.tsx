import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  Code, 
  FileText, 
  BarChart, 
  PlayCircle,
  Map as MapIcon 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">PlaceMentor AI</h1>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/roadmap" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Roadmaps</Link>
          <Link to="/analytics" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Analytics</Link>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:scale-[1.02] transition-transform"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto py-20">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            PlaceMentor AI 2.0 is live
          </div>
          <h1 className="text-7xl font-bold tracking-tighter text-on-surface mb-8 leading-[1.1]">
            Your Personal <span className="text-primary">AI Mentor</span><br />
            for Placements
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mb-12 leading-relaxed">
            Accelerate your career with data-driven roadmaps, real-time resume analysis, and predictive interview analytics. Built for high-performance students.
          </p>
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-primary/20"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-lg hover:bg-surface-container transition-colors">
              Book a Demo
            </button>
          </div>
        </motion.div>

        {/* Featured Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-24 w-full relative group"
        >
          <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors" />
          <div className="relative glass rounded-3xl overflow-hidden shadow-2xl border border-white/50 aspect-video flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-700">
             <div className="flex gap-4 p-8 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                {/* Mockup Windows */}
                <div className="w-[600px] h-96 bg-[#0f172a] rounded-2xl shadow-2xl transform -rotate-12 translate-x-12 translate-y-20 border border-white/10 p-6">
                    <div className="flex gap-2 mb-6">
                       <div className="w-2 h-2 rounded-full bg-red-500" />
                       <div className="w-2 h-2 rounded-full bg-yellow-500" />
                       <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <div className="space-y-4">
                       <div className="h-4 w-1/2 bg-white/10 rounded" />
                       <div className="h-4 w-3/4 bg-white/10 rounded" />
                       <div className="h-32 w-full bg-primary/20 rounded-xl" />
                    </div>
                </div>
                <div className="w-[600px] h-96 bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 p-6 z-10">
                    <div className="flex gap-2 mb-6">
                       <div className="w-2 h-2 rounded-full bg-red-500" />
                       <div className="w-2 h-2 rounded-full bg-yellow-500" />
                       <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <div className="h-full w-full bg-slate-900/50 rounded-xl flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Logos */}
        <div className="mt-32 w-full">
           <p className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-10">Trusted by top placement cells</p>
           <div className="flex flex-wrap justify-center items-center gap-16 opacity-40 hover:opacity-60 transition-opacity">
              <span className="text-xl font-extrabold tracking-tighter">🎓 IvyTech</span>
              <span className="text-xl font-extrabold tracking-tighter">🌍 Global State</span>
              <span className="text-xl font-extrabold tracking-tighter">🏢 Enterprise U</span>
              <span className="text-xl font-extrabold tracking-tighter">🔬 Polytechnic</span>
           </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-40 grid grid-cols-2 gap-8 w-full">
           <FeatureCard 
             icon={Sparkles}
             title="AI Mentor"
             desc="24/7 personalized guidance. Practice mock interviews and get instant, actionable feedback."
           />
           <FeatureCard 
             icon={MapIcon}
             title="Dynamic DSA Roadmaps"
             desc="Structured paths tailored to your target companies. Tracks progress and adapts to your learning pace."
           />
           <FeatureCard 
             icon={BarChart}
             title="Placement Analytics"
             desc="Deep dive into your performance metrics. Compare against campus benchmarks and identify weak points."
           />
           <FeatureCard 
             icon={FileText}
             title="Resume Lab"
             desc="ATS-friendly scoring. AI suggests high-impact verbs and formatting adjustments instantly."
           />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-40 border-t border-surface-container-high px-10 py-12 bg-white">
         <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-10">
               <span className="text-lg font-bold text-on-surface">PlaceMentor AI</span>
               <div className="flex gap-6 text-sm text-on-surface-variant font-medium">
                  <span className="hover:text-primary cursor-pointer">Privacy Policy</span>
                  <span className="hover:text-primary cursor-pointer">Terms of Service</span>
                  <span className="hover:text-primary cursor-pointer">Contact Support</span>
                  <span className="hover:text-primary cursor-pointer">API Documentation</span>
               </div>
            </div>
            <p className="text-sm text-on-surface-variant font-medium">© 2024 PlaceMentor AI. Precision-driven placement management.</p>
         </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="p-8 rounded-3xl bg-white border border-surface-container-high hover:border-primary/50 transition-all group text-left shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300">
    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
      <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
    </div>
    <h3 className="text-xl font-bold text-on-surface mb-3">{title}</h3>
    <p className="text-on-surface-variant leading-relaxed font-medium">{desc}</p>
  </div>
);
