import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { Login } from './screens/Login';
import { Landing } from './screens/Landing';
import { Dashboard } from './screens/Dashboard';
import { Roadmap } from './screens/Roadmap';
import { Workspace } from './screens/Workspace';
import { Attendance } from './screens/Attendance';
import { ResumeLab } from './screens/ResumeLab';
import { Analytics } from './screens/Analytics';
import { Operations } from './screens/Operations';
import { Profile } from './screens/Profile';
import { AdminConsole } from './screens/AdminConsole';
import { RoadmapLibrary } from './screens/RoadmapLibrary';
import { NotFound } from './screens/NotFound';
import { Sidebar } from './components/layout/Sidebar';
import { AIMentor } from './components/AIMentor';
import { cn } from './lib/utils';

// Layout wrapper for all protected routes (displays Sidebar, Header, AIMentor)
const AppLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const currentView = location.pathname.substring(1) || 'dashboard';

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
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
            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
              {userInitials}
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
            Share Activity
          </button>
        </div>
      </header>

      <main className="min-h-screen transition-all duration-300 pl-64 pt-16">
        <div className="min-h-full">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="roadmap-library" element={<RoadmapLibrary />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="resume-lab" element={<ResumeLab />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="operations" element={<Operations />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<AdminConsole />} />
            <Route path="" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <AIMentor />
      </main>
    </div>
  );
};

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
