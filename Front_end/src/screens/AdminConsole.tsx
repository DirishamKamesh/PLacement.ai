import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Bell, 
  Download, 
  RotateCw, 
  Activity, 
  Globe, 
  ShieldAlert, 
  Database, 
  Users, 
  Plus, 
  School,
  FileCode2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '@/src/lib/utils';

const apiData = [
  { time: '10am', requests: 400 },
  { time: '12pm', requests: 700 },
  { time: '2pm', requests: 500 },
  { time: '4pm', requests: 900 },
  { time: '6pm', requests: 1200 },
  { time: '8pm', requests: 800 },
  { time: '10pm', requests: 600 },
];

const institutionData = [
  { q: 'Q1', count: 15 },
  { q: 'Q2', count: 28 },
  { q: 'Q3', count: 45 },
  { q: 'Q4', count: 20 },
];

export const AdminConsole = () => {
  return (
    <div className="p-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tighter">System Overview</h2>
          <p className="text-on-surface-variant font-medium mt-1">Real-time metrics and system health monitoring.</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search users, institutions..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-80"
              />
           </div>
           <button className="px-6 py-2.5 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container transition-colors shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Report
           </button>
           <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 flex items-center gap-2">
              <RotateCw className="w-4 h-4" /> Refresh
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Server Status */}
        <div className="col-span-3">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-on-surface">Server Status</h3>
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse" /> Online
               </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase">
                     <span>CPU Usage</span>
                     <span className="text-on-surface">24%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: '24%' }} className="h-full bg-primary" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase">
                     <span>Memory</span>
                     <span className="text-on-surface">6.2 / 16 GB</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: '38%' }} className="h-full bg-primary" />
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* API Requests */}
        <div className="col-span-3">
          <Card className="h-full flex flex-col">
            <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">API Requests (24h)</h4>
            <div className="text-4xl font-black text-on-surface mb-6">1.2M</div>
            <div className="flex-1 min-h-[100px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apiData}>
                     <Bar dataKey="requests" fill="var(--color-primary-container)" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Active Institutions */}
        <div className="col-span-6">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-on-surface">Active Institutions</h3>
               <button className="text-xs font-bold text-primary hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-4 gap-4 h-[120px] items-end px-4">
               {institutionData.map((d) => (
                 <div key={d.q} className="flex flex-col items-center gap-4">
                    <div className="text-xs font-bold text-on-surface-variant">{d.count}</div>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${d.count * 2}px` }}
                      className={cn(
                        "w-full rounded-lg transition-colors group-hover:bg-primary",
                        d.q === 'Q3' ? 'bg-primary' : 'bg-surface-container-high'
                      )}
                    />
                    <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{d.q}</div>
                 </div>
               ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Recent Audit Logs */}
        <div className="col-span-7">
          <Card className="p-0 overflow-hidden">
             <div className="p-6 border-b border-surface-container-high flex items-center justify-between">
                <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Recent Audit Logs</h3>
                <button className="p-1 hover:bg-surface-container rounded transition-colors"><RotateCw className="w-4 h-4 text-on-surface-variant" /></button>
             </div>
             <div className="divide-y divide-surface-container">
                <LogItem 
                  icon={FileCode2} 
                  title="Content Updated" 
                  desc="DSA Roadmap: Graphs" 
                  time="2 mins ago" 
                  color="tertiary"
                />
                <LogItem 
                  icon={School} 
                  title="New Institution Onboarded" 
                  desc="Tech University" 
                  time="1 hr ago" 
                  color="primary"
                />
                <LogItem 
                  icon={ShieldAlert} 
                  title="API Rate Limit Exceeded" 
                  desc="Endpoint: /v1/evaluate" 
                  time="3 hrs ago" 
                  color="error"
                />
             </div>
          </Card>
        </div>

        {/* System Operations */}
        <div className="col-span-5">
           <Card>
              <h3 className="text-lg font-bold text-on-surface mb-8">System Operations</h3>
              <div className="grid grid-cols-2 gap-4">
                 <OpButton 
                   icon={Plus} 
                   title="Add DSA Problem" 
                   desc="Update content library" 
                   color="primary"
                 />
                 <OpButton 
                   icon={Globe} 
                   title="Manage Institutions" 
                   desc="Subscriptions & tiers" 
                   color="secondary"
                 />
                 <OpButton 
                   icon={Users} 
                   title="User Directory" 
                   desc="Search students/faculty" 
                   color="tertiary"
                 />
                 <OpButton 
                   icon={Database} 
                   title="Database Backup" 
                   desc="Manual snapshot" 
                   color="secondary"
                 />
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

const Card = ({ children, className }: any) => (
  <div className={cn("bg-white p-8 rounded-3xl border border-surface-container-high shadow-sm", className)}>
    {children}
  </div>
);

const LogItem = ({ icon: Icon, title, desc, time, color }: any) => (
  <div className="p-6 flex items-start gap-6 hover:bg-surface-container-lowest transition-colors group">
     <div className={cn(
       "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
       color === 'tertiary' ? 'bg-tertiary/5 text-tertiary' : 
       color === 'primary' ? 'bg-primary/5 text-primary' : 
       'bg-error/5 text-error'
     )}>
        <Icon className="w-5 h-5" />
     </div>
     <div className="flex-1">
        <h4 className="text-sm font-bold text-on-surface">{title}</h4>
        <p className="text-xs font-medium text-on-surface-variant truncate max-w-[200px]">{desc}</p>
     </div>
     <div className="text-xs font-bold text-on-surface-variant whitespace-nowrap">{time}</div>
  </div>
);

const OpButton = ({ icon: Icon, title, desc, color }: any) => (
  <button className="p-6 rounded-2xl bg-white border border-surface-container-high hover:border-primary/50 text-left transition-all group shadow-sm hover:shadow-lg">
     <div className={cn(
       "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
       color === 'primary' ? 'bg-primary/5 text-primary' :
       color === 'secondary' ? 'bg-secondary/5 text-secondary' :
       'bg-tertiary/5 text-tertiary'
     )}>
        <Icon className="w-5 h-5" />
     </div>
     <h4 className="text-sm font-bold text-on-surface mb-1">{title}</h4>
     <p className="text-[10px] font-medium text-on-surface-variant leading-tight">{desc}</p>
  </button>
);
