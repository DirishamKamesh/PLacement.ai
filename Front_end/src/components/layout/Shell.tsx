import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { AIMentor } from '../AIMentor';
import { useAppStore } from '@/src/store';
import { cn } from '@/src/lib/utils';
import { Landing } from '@/src/screens/Landing';
import { Dashboard } from '@/src/screens/Dashboard';
import { Roadmap } from '@/src/screens/Roadmap';
import { Workspace } from '@/src/screens/Workspace';
import { ResumeLab } from '@/src/screens/ResumeLab';
import { Analytics } from '@/src/screens/Analytics';
import { Operations } from '@/src/screens/Operations';
import { AdminConsole } from '@/src/screens/AdminConsole';
import { Attendance } from '@/src/screens/Attendance';
import { Profile } from '@/src/screens/Profile';

export const Shell = () => {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <Landing />;
      case 'dashboard': return <Dashboard />;
      case 'roadmap': return <Roadmap />;
      case 'workspace': return <Workspace />;
      case 'resume-lab': return <ResumeLab />;
      case 'analytics': return <Analytics />;
      case 'operations': return <Operations />;
      case 'attendance': return <Attendance />;
      case 'profile': return <Profile />;
      case 'admin': return <AdminConsole />;
      default: return <Landing />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
      {currentView !== 'landing' && (
        <>
          <Sidebar />
          <header className="fixed top-0 right-0 left-64 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>My Dashboard</span>
                <span>/</span>
                <span className="text-slate-900 font-medium capitalize">{currentView.replace('-', ' ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">JS</div>
              </div>
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
                Share Activity
              </button>
            </div>
          </header>
        </>
      )}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        currentView === 'landing' ? "" : "pl-64 pt-16"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="min-h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
        {currentView !== 'landing' && <AIMentor />}
      </main>
    </div>
  );
};
