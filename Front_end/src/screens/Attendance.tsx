import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  QrCode, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  History,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export const Attendance = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    attendance_rate: '0.0%',
    present_days: 0,
    late_days: 0,
    absent_days: 0,
    avg_arrival: 'N/A',
    streak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState('');

  const fetchAttendance = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await api.get<{ records: any[]; stats: any }>(
        `/api/attendance?month=${month}&year=${year}`
      );
      setRecords(data.records);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentDate]);

  const handleCheckin = async () => {
    setIsCheckingIn(true);
    setError('');
    try {
      await api.post('/api/attendance/checkin', {
        location: 'CS Lab 12',
        mode: 'qr'
      });
      setIsScanning(false);
      // Refresh list
      await fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar days with proper offset
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0
    const numDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding days for previous month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, status: 'empty' });
    }
    // Days in current month
    for (let i = 1; i <= numDays; i++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = records.find(r => r.attendance_date === dayStr);
      days.push({
        day: i,
        status: record ? record.status : 'none',
        time: record?.check_in_time || null,
        location: record?.location || null
      });
    }
    return days;
  };

  const calendarDays = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Attendance & Tracking</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Managed by Institutional Biometric Bridge</p>
        </div>
        <button 
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <QrCode className="w-5 h-5" />
          Quick Check-in
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Stats Section */}
        <div className="col-span-12 flex gap-6">
           <StatusCard label="Total Attendance" value={stats.attendance_rate} trend="Avg" icon={CalendarIcon} color="indigo" />
           <StatusCard label="Present Days" value={stats.present_days} trend="Monthly" icon={CheckCircle2} color="emerald" />
           <StatusCard label="Average Arrival" value={stats.avg_arrival} trend="On Time" icon={Clock} color="purple" />
           <StatusCard label="Active Streak" value={`${stats.streak} Days`} trend="Current" icon={History} color="orange" />
        </div>

        {/* Calendar View */}
        <div className="col-span-8">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 h-full">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-bold text-slate-900">Attendance Calendar</h3>
                 <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-lg">
                      <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <span className="text-sm font-bold text-slate-600">{monthName}</span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-lg">
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                 </div>
              </div>
              
              {/* Grid Header */}
              <div className="grid grid-cols-7 gap-4 mb-4">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                   <span key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                 ))}
              </div>

              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-4">
                 {calendarDays.map((d, i) => {
                   if (d.status === 'empty') {
                     return <div key={`empty-${i}`} className="aspect-square" />;
                   }

                   return (
                     <div 
                       key={`day-${i}`} 
                       className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center relative group cursor-pointer transition-all",
                        d.status === 'present' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        d.status === 'absent' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        d.status === 'late' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-slate-50 text-slate-400 border border-transparent"
                       )}
                     >
                        <span className="text-xs font-bold">{d.day}</span>
                        {d.status === 'present' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />}
                        {d.status === 'absent' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />}
                        {d.status === 'late' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />}

                        {/* Tooltip Simulation */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                           {d.status === 'present' ? `In: ${d.time} • ${d.location}` : 
                            d.status === 'late' ? `In: ${d.time} • Late` :
                            d.status === 'absent' ? 'Absent • Unexcused' : 'No Data'}
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        {/* Recent History */}
        <div className="col-span-4">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Check-ins</h3>
              <div className="space-y-4 overflow-y-auto pr-2 max-h-[360px]">
                 {records.slice(0, 7).map((d, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center",
                           d.status === 'present' ? "bg-emerald-100 text-emerald-600" :
                           d.status === 'absent' ? "bg-rose-100 text-rose-600" :
                           "bg-amber-100 text-amber-600"
                         )}>
                            {d.status === 'present' ? <CheckCircle2 className="w-5 h-5" /> : 
                             d.status === 'absent' ? <XCircle className="w-5 h-5" /> : 
                             <Clock className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 capitalize">{d.status}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.attendance_date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-900">{d.check_in_time || '—'}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{d.location || '—'}</p>
                      </div>
                   </div>
                 ))}
                 {records.length === 0 && (
                   <p className="text-slate-400 text-sm text-center py-6 font-medium">No recent check-ins recorded.</p>
                 )}
              </div>
           </div>
        </div>

        {/* Integrity Section */}
        <div className="col-span-12">
            <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 ai-gradient opacity-10 blur-3xl -mr-32 -mt-32" />
               <div className="flex items-center gap-8 relative z-10">
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 flex items-center justify-center bg-indigo-500/10">
                     <ShieldCheck className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold mb-2">Verified Attendance Protocol</h3>
                     <p className="text-slate-400 text-sm max-w-xl">
                        Your attendance is verified using military-grade session tokens and geofenced biometric matching. Any discrepancies must be reported to the registrar within 24 hours.
                     </p>
                  </div>
               </div>
               <div className="flex gap-4 relative z-10">
                  <div className="text-center px-6 border-r border-slate-800">
                     <div className="text-2xl font-black text-indigo-400">98%</div>
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Integrity Score</div>
                  </div>
                  <div className="text-center px-6">
                     <div className="text-2xl font-black text-emerald-400">Low</div>
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anomalies</div>
                  </div>
               </div>
            </div>
        </div>
      </div>

      {/* QR Scanner Simulation Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
           >
              <div className="absolute top-0 left-0 w-full h-1.5 ai-gradient" />
              <button 
                onClick={() => setIsScanning(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="text-center mb-8 pt-4">
                 <h4 className="text-2xl font-black text-slate-900 mb-2">Check-in Terminal</h4>
                 <p className="text-sm text-slate-500">Scan institutional QR to log session</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs rounded-xl mb-4 text-center">
                  {error}
                </div>
              )}

              <div className="relative aspect-square bg-slate-100 rounded-3xl mb-8 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                 <QrCode className="w-32 h-32 text-slate-300" />
                 <motion.div 
                   animate={{ top: ['0%', '100%', '0%'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 right-0 h-1 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                 />
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                   onClick={handleCheckin}
                   disabled={isCheckingIn}
                   className="w-full py-4 ai-gradient text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                 >
                    {isCheckingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Check-in
                 </button>
                 <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mt-2">
                    <MapPin className="w-3 h-3" /> Detectable: CS Lab 12
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

const StatusCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group overflow-hidden transition-all hover:translate-y-[-4px] hover:shadow-xl">
     <div className="flex items-center justify-between mb-6">
        <div className={cn(
           "w-10 h-10 rounded-xl flex items-center justify-center",
           color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
           color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
           color === 'purple' ? "bg-purple-50 text-purple-600" :
           "bg-orange-50 text-orange-600"
        )}>
           <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">{trend}</span>
     </div>
     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
     <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
  </div>
);
