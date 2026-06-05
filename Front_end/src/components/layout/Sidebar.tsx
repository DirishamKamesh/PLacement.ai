import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Code2, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Clock,
  TrendingUp,
  Users,
  Compass
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-all duration-300 group relative font-medium text-sm",
        isActive 
          ? "bg-slate-100 text-primary" 
          : "text-slate-500 hover:bg-slate-50"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
};

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center text-white font-bold">P</div>
        <span className="font-semibold text-lg tracking-tight">PlaceMentor</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Readiness Hub" />
        <NavItem to="/roadmap-library" icon={Compass} label="Roadmap Library" />
        <NavItem to="/roadmap" icon={MapIcon} label="Career Roadmap" />
        <NavItem to="/workspace" icon={Code2} label="Code Workspace" />
        <NavItem to="/attendance" icon={Clock} label="Attendance" />
        <NavItem to="/resume-lab" icon={FileText} label="Resume Lab" />
        <NavItem to="/analytics" icon={BarChart3} label="Batch Analytics" />
        <NavItem to="/operations" icon={TrendingUp} label="Drive Ops" />
        <NavItem to="/profile" icon={Users} label="My Profile" />
        <NavItem to="/admin" icon={Settings} label="Admin Console" />
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.full_name || 'Alex Rivera'}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || 'student'} User</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors group text-sm font-medium"
        >
          <LogOut className="w-4 h-4 group-hover:text-error" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
