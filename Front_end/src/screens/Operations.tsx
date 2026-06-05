import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Briefcase, 
  Wallet, 
  PieChart as PieChartIcon, 
  Megaphone,
  TrendingUp,
  Clock,
  MoreVertical,
  Users
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const funnelData = [
  { step: 'Applied', count: 1250, full: 1250 },
  { step: 'Shortlisted', count: 937, full: 1250 },
  { step: 'Interviewed', count: 600, full: 1250 },
  { step: 'Offered', count: 312, full: 1250 },
];

const Card = ({ children, className }: any) => (
  <div className={cn("glass-card p-8 rounded-2xl border border-slate-200 shadow-sm", className)}>
    {children}
  </div>
);

const MetricCard = ({ label, value, sub, trend, icon: Icon, color }: any) => (
  <Card className="p-6 relative overflow-hidden group !bg-white">
     <div className="flex items-center justify-between mb-6">
        <div className={cn(
           "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
           color === 'primary' ? 'bg-indigo-50 text-indigo-600' :
           color === 'secondary' ? 'bg-purple-50 text-purple-600' :
           color === 'tertiary' ? 'bg-emerald-50 text-emerald-600' :
           'bg-rose-50 text-rose-600'
        )}>
           <Icon className="w-5 h-5" />
        </div>
        {trend && trend.includes('%') && (
           <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" /> {trend}
           </span>
        )}
     </div>
     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
     <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
        {sub && <span className="text-xs font-bold text-slate-400 uppercase">{sub}</span>}
     </div>
     {trend && !trend.includes('%') && <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{trend}</p>}
  </Card>
);

const DriveCard = ({ company, type, time, attendees, status, logo }: any) => (
  <div className="p-4 rounded-2xl bg-white border border-slate-100 group hover:border-indigo-200 transition-all cursor-pointer shadow-sm relative overflow-hidden">
     {status === 'Today' && <div className="absolute top-0 right-0 p-2"><span className="px-2 py-0.5 ai-gradient text-white rounded text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">Today</span></div>}
     <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 ai-gradient text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-lg">{logo}</div>
        <div>
           <h4 className="text-sm font-bold text-slate-900">{company}</h4>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{type}</p>
        </div>
     </div>
     <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {time}</span>
        <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {attendees}</span>
     </div>
  </div>
);

export const Operations = () => {
  return (
    <div className="p-8 pb-20 bg-slate-50 min-h-screen dot-grid">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tighter">Placement Ops</h2>
          <p className="text-slate-500 font-medium mt-1">Batch 2024 Placement Statistics</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
             <button className="px-4 py-1.5 bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow-sm">All Time</button>
             <button className="px-4 py-1.5 text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">This Month</button>
           </div>
           <button className="px-6 py-2.5 bg-slate-900 text-white border border-transparent rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Export Report
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
         <MetricCard label="Total Offers" value="842" trend="+12%" icon={Briefcase} color="primary" />
         <MetricCard label="Avg CTC" value="14.2" sub="LPA" trend="Median: 12.5 LPA" icon={Wallet} color="secondary" />
         <MetricCard label="Placement Rate" value="68%" sub="Of 1,250 eligible" icon={PieChartIcon} color="tertiary" />
         <MetricCard label="Active Drives" value="14" sub="3 closing this week" icon={Megaphone} color="error" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Placement Funnel */}
        <div className="col-span-8">
          <Card className="!bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">Placement Funnel</h3>
               <button className="p-1 hover:bg-slate-100 rounded transition-colors"><MoreVertical className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-6">
               {funnelData.map((d, i) => (
                 <div key={d.step} className="flex items-center gap-6 group">
                    <span className="w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{d.step}</span>
                    <div className="flex-1 h-12 bg-slate-100 rounded-lg overflow-hidden relative">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(d.count / d.full) * 100}%` }}
                         transition={{ delay: i * 0.1, duration: 1 }}
                         className={cn(
                           "h-full rounded-r-lg shadow-inner",
                           i === 3 ? "ai-gradient" : "bg-indigo-100/30"
                         )}
                       />
                       <div className="absolute inset-y-0 right-4 flex items-center">
                          <span className="text-sm font-black text-slate-900">{d.count.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>

        {/* Upcoming Drives */}
        <div className="col-span-4">
          <Card className="h-full flex flex-col !bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Drives</h3>
               <button className="p-1.5 ai-gradient text-white rounded-lg hover:scale-110 transition-transform shadow-lg shadow-indigo-200"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 flex-1">
               <DriveCard 
                 company="Amazon SDE" 
                 type="Online Assessment" 
                 time="14:00 - 16:00" 
                 attendees="120 pax" 
                 status="Today"
                 logo="AZ"
               />
               <DriveCard 
                 company="Microsoft" 
                 type="Pre-Placement Talk" 
                 time="Main Aud." 
                 attendees="Oct 24" 
                 status="Upcoming"
                 logo="MS"
               />
               <DriveCard 
                 company="Goldman Sachs" 
                 type="Technical Interviews" 
                 time="Virtual" 
                 attendees="Oct 28" 
                 status="Upcoming"
                 logo="GS"
               />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
