import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Phone, 
  Linkedin, 
  Github, 
  Globe, 
  Edit3, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Code,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Star,
  Settings,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

export const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Edit form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [department, setDepartment] = useState(user?.department || '');
  
  // Skill states
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setInstitution(user.institution || '');
      setDepartment(user.department || '');
      setSkills(user.skills || []);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const data = await api.put<{ user: any }>('/api/users/profile', {
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
        institution: institution || null,
        department: department || null,
        skills
      });
      updateUser(data.user);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const updatedSkills = [...skills, newSkill.trim()];
    
    try {
      const data = await api.put<{ user: any }>('/api/users/profile', {
        skills: updatedSkills
      });
      updateUser(data.user);
      setSkills(updatedSkills);
      setNewSkill('');
    } catch (err: any) {
      console.error('Failed to add skill:', err);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    try {
      const data = await api.put<{ user: any }>('/api/users/profile', {
        skills: updatedSkills
      });
      updateUser(data.user);
      setSkills(updatedSkills);
    } catch (err: any) {
      console.error('Failed to remove skill:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 max-w-6xl mx-auto dot-grid min-h-screen">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 mb-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-[40%] h-full ai-gradient opacity-10 blur-3xl -mr-32 group-hover:opacity-20 transition-opacity" />
         
         <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
            {/* Avatar Section */}
            <div className="relative">
               <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl bg-slate-300 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-20 h-20 text-slate-500" />
                  )}
               </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
               <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{user.full_name}</h2>
                  <div className="flex justify-center md:justify-start gap-2">
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 uppercase">{user.role}</span>
                     <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">ELITE RANK</span>
                  </div>
               </div>
               
               <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mb-6">
                  {user.bio || 'No bio provided. Write a short bio in Edit Profile to let placement managers know about you!'}
               </p>

               <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> {user.institution || 'Technical Institute of Excellence'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> {user.phone}
                    </div>
                  )}
               </div>
            </div>

            {/* Floating Action */}
            <div className="flex flex-col gap-3">
               <button 
                 onClick={() => setIsEditing(true)}
                 className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
               >
                  <Edit3 className="w-4 h-4" /> Edit Profile
               </button>
               <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all">
                  <Linkedin className="w-4 h-4" /> Connect
               </button>
            </div>
         </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl relative"
          >
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight mb-6">Edit Profile Info</h3>
            
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Phone</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Bio / Professional Summary</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Describe your goals and fields of expertise..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Institution</label>
                  <input 
                    type="text" 
                    value={institution} 
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Department</label>
                  <input 
                    type="text" 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 mt-6 bg-slate-950 text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Changes'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
         {/* Left Side: Professional Summary */}
         <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* Skills & Expertise */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                     <Code className="w-6 h-6 text-indigo-500" /> Digital Arsenal
                  </h3>
               </div>
               
               <form onSubmit={handleAddSkill} className="flex gap-3 mb-6">
                 <input 
                   type="text"
                   value={newSkill}
                   onChange={(e) => setNewSkill(e.target.value)}
                   placeholder="e.g. Next.js, Kubernetes"
                   className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                 />
                 <button 
                   type="submit"
                   className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm hover:scale-[1.02] transition-all"
                 >
                   Add Skill
                 </button>
               </form>

               <div className="flex flex-wrap gap-3">
                  {skills.map(skill => (
                    <div key={skill} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default flex items-center gap-2 group">
                       <span>{skill}</span>
                       <button 
                         onClick={() => handleRemoveSkill(skill)}
                         className="text-slate-400 hover:text-red-500 transition-colors"
                       >
                         <X className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-slate-400 text-sm font-medium">No skills added yet.</p>
                  )}
               </div>
            </section>

            {/* Experience & Projects */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
               <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-indigo-500" /> Professional Track
               </h3>
               <div className="space-y-8">
                  <ProfileItem 
                    title="Frontend Developer Intern" 
                    subtitle="Acme Cloud Solutions • Jun 2023 - Aug 2023"
                    desc="Re-architected the main internal dashboard using React 18 and server components, leading to a 40% reduction in TTI."
                    icon={Briefcase}
                  />
                  <ProfileItem 
                    title="E-commerce Engine (Open Source)" 
                    subtitle="Self Project • 1.2k Stars on GitHub"
                    desc="Developed a high-performance headless commerce engine with focus on edge caching and real-time inventory sync."
                    icon={Code}
                    isProject
                  />
               </div>
            </section>

            {/* Education */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
               <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-indigo-500" /> Academic Journey
               </h3>
               <div className="space-y-6">
                  <div className="flex gap-6">
                     <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <GraduationCap className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-900 line-tight">{user.institution || 'Technical Institute of Excellence'}</h4>
                        <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">{user.department || 'B.Tech, Computer Science'}</p>
                        <div className="flex gap-4">
                           <div className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-600">GPA: 3.92/4.0</div>
                           <div className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-600">Dean's List x3</div>
                        </div>
                     </div>
                  </div>
               </div>
            </section>
         </div>

         {/* Right Side: Badges & Rewards */}
         <div className="col-span-12 lg:col-span-4 space-y-8">
            
            {/* Achievement Badges */}
            <section className="glass-card rounded-[2rem] p-8 border border-white shadow-xl">
               <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <Award className="w-6 h-6 text-indigo-500" /> Achievements
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <Badge icon={ShieldCheck} label="Verified Pro" color="bg-indigo-50 text-indigo-600" />
                  <Badge icon={Star} label="Streak Active" color="bg-amber-50 text-amber-600" />
                  <Badge icon={Code} label="Open Source Contributor" color="bg-purple-50 text-purple-600" />
                  <Badge icon={Briefcase} label="Internship Certified" color="bg-emerald-50 text-emerald-600" />
               </div>
            </section>

            {/* Quick Readiness Score */}
            <section className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 ai-gradient" />
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Placement IQ</h4>
                  <Settings className="w-4 h-4 text-slate-600 cursor-pointer hover:text-white transition-colors" />
               </div>
               <div className="text-center">
                  <div className="text-6xl font-black text-white tracking-tighter mb-2">94</div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">ELITE PERCENTILE</div>
               </div>
               <div className="space-y-4">
                  <MinimalStat label="Technical Prowess" value="98%" color="bg-indigo-500" />
                  <MinimalStat label="Soft Skill Signals" value="86%" color="bg-purple-500" />
                  <MinimalStat label="Culture Match" value="92%" color="bg-emerald-500" />
               </div>
               <button className="w-full mt-10 py-3 ai-gradient text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-900/50 hover:scale-[1.02] active:scale-95 transition-all">
                  Full Analytics Report
               </button>
            </section>
         </div>
      </div>
    </div>
  );
};

const ProfileItem = ({ title, subtitle, desc, icon: Icon, isProject }: any) => (
  <div className="flex gap-6 group cursor-pointer">
     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
        <Icon className="w-6 h-6" />
     </div>
     <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
           <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{title}</h4>
           {isProject && <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />}
        </div>
        <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">{subtitle}</p>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{desc}</p>
     </div>
  </div>
);

const Badge = ({ icon: Icon, label, color }: any) => (
  <div className={cn("p-4 rounded-2xl flex flex-col items-center text-center gap-3 transition-transform hover:scale-105 cursor-pointer", color)}>
     <Icon className="w-8 h-8" />
     <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{label}</span>
  </div>
);

const MinimalStat = ({ label, value, color }: any) => (
  <div className="space-y-1.5">
     <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
        <span>{label}</span>
        <span>{value}</span>
     </div>
     <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: value }} />
     </div>
  </div>
);
