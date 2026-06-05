import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles,
  Zap,
  ArrowRight,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ResumeService } from '../lib/supabaseService';

export const ResumeLab = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch list of resumes on load
  const fetchResumes = async () => {
    try {
      const data = await ResumeService.fetchResumes();
      setResumes(data.resumes);
      if (data.resumes.length > 0) {
        setActiveResume(data.resumes[0]);
        setTargetRole(data.resumes[0].target_role || 'Software Engineer');
      } else {
        setActiveResume(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Handle PDF file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const data = await ResumeService.uploadResume(file, targetRole);
      setResumes((prev) => [data.resume, ...prev]);
      setActiveResume(data.resume);

      // Trigger automatic analysis
      await handleAnalyze(data.resume.id);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Run Gemini analysis
  const handleAnalyze = async (id: string) => {
    setIsAnalyzing(true);
    setError('');
    try {
      const data = await ResumeService.analyzeResume(id, targetRole);
      setActiveResume(data.resume);
      // Update in resumes list
      setResumes((prev) => prev.map(r => r.id === id ? data.resume : r));
    } catch (err: any) {
      setError(err.message || 'AI Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete resume
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await ResumeService.deleteResume(id);
      const filtered = resumes.filter(r => r.id !== id);
      setResumes(filtered);
      if (activeResume?.id === id) {
        setActiveResume(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (err: any) {
      setError('Failed to delete resume.');
    }
  };

  const handleRoleSelection = (role: string) => {
    setTargetRole(role);
    if (activeResume) {
      handleAnalyze(activeResume.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-12 pb-20 max-w-7xl mx-auto">
      <div className="mb-12 flex justify-between items-start">
        <div>
          <h2 className="text-5xl font-bold text-on-surface tracking-tighter mb-4">Resume Lab</h2>
          <p className="text-lg text-on-surface-variant font-medium max-w-2xl leading-relaxed">
            AI-powered analysis to optimize your resume for ATS and target roles. Improve your chances by 3x with guided refinements.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Upload & Main Metrics */}
        <div className="col-span-4 space-y-8">
           {/* Upload Card */}
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleUpload} 
             accept=".pdf" 
             className="hidden" 
           />
           <Card 
             onClick={() => fileInputRef.current?.click()}
             className="border-dashed border-2 border-primary/20 bg-primary/5 group cursor-pointer hover:bg-primary/[0.08] transition-colors flex flex-col items-center justify-center text-center p-12 h-80 relative"
           >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-on-surface mb-2">Uploading file...</h3>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                     <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Upload Resume</h3>
                  <p className="text-sm text-on-surface-variant font-medium">Select a PDF file of your resume</p>
                  <button className="mt-8 px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">
                    Select File
                  </button>
                </>
              )}
           </Card>

           {/* Performance metrics side by side */}
           {activeResume ? (
             <div className="grid grid-cols-2 gap-4">
                <Card className="text-center p-6 bg-white relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                   <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">ATS Score</h4>
                   <div className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
                     {activeResume.ats_score !== null ? activeResume.ats_score : '—'}
                   </div>
                   <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${activeResume.ats_score || 0}%` }} className="h-full bg-primary" />
                   </div>
                   <p className="text-[10px] font-bold text-primary mt-3 uppercase tracking-tighter">Based on parsing accuracy</p>
                </Card>
                <Card className="text-center p-6 bg-white relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-tertiary" />
                   <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Resume Health</h4>
                   <div className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
                     {activeResume.health_score !== null ? activeResume.health_score : '—'}
                   </div>
                   <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${activeResume.health_score || 0}%` }} className="h-full bg-tertiary" />
                   </div>
                   <p className="text-[10px] font-bold text-tertiary mt-3 uppercase tracking-tighter">Impact and formatting</p>
                </Card>
             </div>
           ) : null}

           {/* Target Role */}
           <Card>
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-6">Target Role</h4>
              <div className="relative mb-4">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                 <input 
                   type="text" 
                   value={targetRole}
                   onChange={(e) => setTargetRole(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && activeResume && handleAnalyze(activeResume.id)}
                   className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:border-primary transition-all"
                   placeholder="e.g. Frontend Developer"
                 />
              </div>
              <div className="flex flex-wrap gap-2">
                 {['Frontend', 'Backend', 'Fullstack', 'DevOps'].map(role => (
                   <span 
                     key={role} 
                     onClick={() => handleRoleSelection(role + ' Developer')}
                     className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white cursor-pointer transition-all"
                   >
                      {role}
                   </span>
                 ))}
              </div>
           </Card>

           {/* History List */}
           {resumes.length > 1 && (
             <Card>
                <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Uploaded Resumes</h4>
                <div className="space-y-2">
                  {resumes.map(r => (
                    <div 
                      key={r.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-sm transition-all cursor-pointer",
                        activeResume?.id === r.id ? "bg-indigo-50/50 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"
                      )}
                      onClick={() => {
                        setActiveResume(r);
                        setTargetRole(r.target_role || 'Software Engineer');
                      }}
                    >
                      <span className="truncate max-w-[180px] font-medium text-slate-700">{r.file_name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
             </Card>
           )}
        </div>
 
        {/* Right Column: AI Analysis */}
        <div className="col-span-8 space-y-8">
           <Card className="flex flex-col h-full bg-white relative overflow-hidden border-primary/10 min-h-[480px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center">
                       <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-on-surface">AI Optimization Suite</h3>
                       <p className="text-xs font-semibold text-on-surface-variant">Real-time suggestions to boost response rates</p>
                    </div>
                 </div>
                 {activeResume && (
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAnalyze(activeResume.id)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold hover:bg-tertiary/20 disabled:opacity-50 transition-all"
                      >
                         {isAnalyzing ? (
                           <Loader2 className="w-3.5 h-3.5 animate-spin" />
                         ) : (
                           <Zap className="w-3.5 h-3.5 fill-current" />
                         )}
                         Live Analysis
                      </button>
                   </div>
                 )}
              </div>

              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                   <p className="text-sm font-semibold text-slate-500">Gemini is analyzing your resume for keywords and suggestions...</p>
                </div>
              ) : activeResume ? (
                <div className="grid grid-cols-2 gap-12 flex-1">
                   {/* Keyword Analysis */}
                   <div>
                      <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-6">Keyword Analysis</h4>
                      <div className="space-y-8">
                         <div>
                            <p className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-4">Found Keywords</p>
                            <div className="flex flex-wrap gap-2">
                               {(activeResume.found_keywords || []).map((tag: string) => (
                                 <span key={tag} className="px-3 py-1 bg-tertiary/5 text-tertiary border border-tertiary/10 rounded-lg text-xs font-bold hover:scale-105 transition-transform cursor-default">
                                    {tag}
                                 </span>
                               ))}
                               {(activeResume.found_keywords || []).length === 0 && (
                                 <span className="text-xs text-slate-400">None found yet. Run live analysis.</span>
                               )}
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-error uppercase tracking-widest mb-4">Missing Keywords</p>
                            <div className="flex flex-wrap gap-2">
                               {(activeResume.missing_keywords || []).map((tag: string) => (
                                 <span key={tag} className="px-3 py-1 bg-error/5 text-error border border-error/10 rounded-lg text-xs font-bold group cursor-pointer hover:bg-error hover:text-white transition-all">
                                    {tag} <Plus className="w-3 h-3 inline ml-1 group-hover:rotate-90 transition-transform" />
                                 </span>
                               ))}
                               {(activeResume.missing_keywords || []).length === 0 && (
                                 <span className="text-xs text-slate-400">None detected. Run live analysis.</span>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Suggestions */}
                   <div className="space-y-6">
                      <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-6">AI Suggestions</h4>
                      <div className="space-y-4">
                         {(activeResume.ai_suggestions || []).map((item: any, idx: number) => (
                           <SuggestionItem 
                             key={idx}
                             title={item.title || 'Recommendation'}
                             desc={item.description || item.desc}
                           />
                         ))}
                         {(activeResume.ai_suggestions || []).length === 0 && (
                           <p className="text-xs text-slate-400">No suggestions yet. Run live analysis.</p>
                         )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-sm font-semibold text-slate-500">Please upload a resume to view analysis metrics.</p>
                </div>
              )}

              <div className="mt-12 p-6 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                       <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-on-surface">View Tailored Examples</h4>
                       <p className="text-xs font-semibold text-on-surface-variant">See resumes that got people hired at Google</p>
                    </div>
                 </div>
                 <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-2 transition-transform" />
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

const Card = ({ children, className, onClick }: any) => (
  <div onClick={onClick} className={cn("bg-white p-8 rounded-3xl border border-slate-200 shadow-sm", className)}>
    {children}
  </div>
);

const SuggestionItem = ({ title, desc }: any) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-primary/30 transition-all group">
     <div className="flex items-center gap-2 mb-1.5">
        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
        <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{title}</h5>
     </div>
     <p className="text-xs text-on-surface-variant leading-relaxed font-medium pl-3.5">
        {desc}
     </p>
  </div>
);
