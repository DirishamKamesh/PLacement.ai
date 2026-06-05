import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Bell, 
  Download, 
  MoreHorizontal, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { cn } from '@/src/lib/utils';

const performanceData = [
  { range: '<50', count: 8 },
  { range: '50-60', count: 15 },
  { range: '60-70', count: 28 },
  { range: '70-80', count: 42 },
  { range: '80-90', count: 25 },
  { range: '90-100', count: 12 },
];

const masteryData = [
  { week: 'W1', score: 65 },
  { week: 'W2', score: 68 },
  { week: 'W3', score: 70 },
  { week: 'W4', score: 75 },
  { week: 'W5', score: 72 },
  { week: 'W6', score: 82 },
];

export const Analytics = () => {
  return (
    <div className="p-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tighter">Batch Overview: CS_2025_A</h2>
          <p className="text-on-surface-variant font-medium mt-1">Comprehensive performance analytics and AI risk assessment.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search students, batches..." 
                className="pl-10 pr-4 py-2 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary transition-all w-64"
              />
           </div>
           <div className="px-4 py-2 bg-white border border-surface-container-high rounded-xl text-sm font-bold shadow-sm">CS_2025_A</div>
           <button className="px-6 py-2 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container transition-colors shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Avg Readiness Score" value="78%" trend="+2.4%" icon={TrendingUp} />
        <StatCard label="Batch Completion" value="62%" trend="+5.1%" icon={CheckCircle2} />
        <StatCard label="Students Active" value="114" sub="/ 120" icon={Users} />
        <StatCard label="At Risk" value="12" sub="Students" icon={AlertTriangle} color="error" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Performance Distribution */}
        <div className="col-span-8">
          <Card>
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-lg font-bold text-on-surface tracking-tight">Performance Distribution</h3>
               <button className="p-1 hover:bg-surface-container rounded transition-colors"><MoreHorizontal className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                     <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'var(--color-surface-container)', radius: 8 }}
                      />
                     <Bar dataKey="count" fill="var(--color-primary-container)" radius={[8, 8, 0, 0]}>
                        {performanceData.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`} 
                             fill={index === 3 ? 'var(--color-primary)' : 'var(--color-primary-container)'}
                           />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* AI Risk Assessment */}
        <div className="col-span-4">
          <Card className="bg-[#faf8ff] border-primary/10 relative overflow-hidden h-full">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
             <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                   <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">AI Risk Assessment</h3>
             </div>
             <div className="space-y-4 mb-10">
                <RiskItem name="Rahul Sharma" risk="High" reason="Declining DSA scores" />
                <RiskItem name="Priya Patel" risk="High" reason="Missed last 3 mock interviews" />
                <RiskItem name="Amit Kumar" risk="Med" reason="Stagnant resume score" />
                <RiskItem name="Neha Gupta" risk="Med" reason="Low engagement this week" />
             </div>
             <button className="w-full py-3 bg-white border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                View All 12 Interventions
             </button>
          </Card>
        </div>

        {/* Topic Mastery Trends */}
        <div className="col-span-4">
          <Card>
            <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-8">Topic Mastery Trends</h3>
            <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={masteryData}>
                     <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                     <YAxis hide />
                     <Line 
                       type="monotone" 
                       dataKey="score" 
                       stroke="var(--color-primary)" 
                       strokeWidth={3} 
                       dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }}
                       activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Assignments */}
        <div className="col-span-8">
          <Card className="p-0 overflow-hidden">
             <div className="p-6 border-b border-surface-container-high flex items-center justify-between">
                <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Recent Assignments</h3>
                <button className="text-xs font-bold text-primary">View All</button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-surface-container-low border-b border-surface-container-high text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                         <th className="px-6 py-3">Assignment</th>
                         <th className="px-6 py-3">Module</th>
                         <th className="px-6 py-3">Completion</th>
                         <th className="px-6 py-3 text-center">Avg Score</th>
                         <th className="px-6 py-3">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-surface-container">
                      <Row 
                        title="Graph Algorithms Set 1" 
                        module="DSA Core" 
                        progress={85} 
                        score="72/100" 
                        status="Active" 
                      />
                      <Row 
                        title="React Component Patterns" 
                        module="Frontend Dev" 
                        progress={92} 
                        score="88/100" 
                        status="Closed" 
                      />
                      <Row 
                        title="System Design Mock" 
                        module="Interview Prep" 
                        progress={45} 
                        score="65/100" 
                        status="Low Engagement" 
                        isWarning
                      />
                   </tbody>
                </table>
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

const StatCard = ({ label, value, trend, sub, icon: Icon, color }: any) => (
  <Card className="p-6 relative overflow-hidden group">
     <div className="flex items-center justify-between mb-4">
        <div className={cn(
           "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
           color === 'error' ? 'bg-error/5 text-error' : 'bg-primary/5 text-primary'
        )}>
           <Icon className="w-5 h-5" />
        </div>
        {trend && (
           <span className="flex items-center gap-1 text-[10px] font-black text-tertiary uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" /> {trend}
           </span>
        )}
     </div>
     <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{label}</h4>
     <div className="flex items-baseline gap-1">
        <span className={cn("text-3xl font-black tracking-tighter", color === 'error' ? 'text-error' : 'text-on-surface')}>{value}</span>
        {sub && <span className="text-xs font-bold text-on-surface-variant uppercase">{sub}</span>}
     </div>
  </Card>
);

const RiskItem = ({ name, risk, reason }: any) => (
  <div className="flex items-center justify-between group cursor-pointer hover:bg-white p-2 -mx-2 rounded-xl transition-colors">
     <div>
        <h5 className="text-sm font-bold text-on-surface">{name}</h5>
        <p className="text-[10px] font-medium text-on-surface-variant">{reason}</p>
     </div>
     <span className={cn(
        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
        risk === 'High' ? 'bg-error/10 text-error' : 'bg-yellow-500/10 text-yellow-600'
     )}>
        {risk}
     </span>
  </div>
);

const Row = ({ title, module, progress, score, status, isWarning }: any) => (
  <tr className="hover:bg-surface-container-lowest transition-colors">
     <td className="px-6 py-4">
        <div className="text-sm font-bold text-on-surface">{title}</div>
     </td>
     <td className="px-6 py-4 font-medium text-xs text-on-surface-variant">{module}</td>
     <td className="px-6 py-4">
        <div className="flex items-center gap-3">
           <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={cn("h-full", isWarning ? 'bg-error' : 'bg-primary')} />
           </div>
           <span className="text-[10px] font-bold text-on-surface-variant">{progress}%</span>
        </div>
     </td>
     <td className="px-6 py-4 text-center text-xs font-bold text-on-surface">{score}</td>
     <td className="px-6 py-4">
        <span className={cn(
           "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
           status === 'Active' ? 'bg-primary/10 text-primary' : 
           status === 'Closed' ? 'bg-tertiary/10 text-tertiary' : 
           'bg-error/10 text-error'
        )}>
           {status}
        </span>
     </td>
  </tr>
)
