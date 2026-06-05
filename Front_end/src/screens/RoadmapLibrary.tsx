import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Compass, 
  Heart, 
  Bookmark, 
  Clock, 
  Copy, 
  Award,
  Flame,
  Star,
  Sparkles,
  ArrowRight,
  Loader2,
  BookmarkCheck,
  HeartOff
} from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Template {
  id: string;
  title: string;
  description: string;
  category: 'DSA' | 'Frontend' | 'Backend' | 'AI / ML' | 'Development' | 'Placement';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_hours: number;
  tags: string[];
  author: string;
  version: string;
  clones_count: number;
  likes_count: number;
  is_featured: boolean;
  is_trending: boolean;
  is_beginner_friendly: boolean;
  liked?: boolean;
  bookmarked?: boolean;
}

export const RoadmapLibrary = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'likes' | 'clones' | 'hours'>('likes');

  // Load templates from API
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{ templates: Template[] }>('/api/roadmaps/templates');
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to load roadmap templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter & Sort Logic
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => 
          t.title.toLowerCase().includes(q) || 
          t.description.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(t => t.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'All') {
      result = result.filter(t => t.difficulty === selectedDifficulty);
    }

    // Sort logic
    result.sort((a, b) => {
      if (sortBy === 'likes') {
        return b.likes_count - a.likes_count;
      }
      if (sortBy === 'clones') {
        return b.clones_count - a.clones_count;
      }
      if (sortBy === 'hours') {
        return b.estimated_hours - a.estimated_hours;
      }
      return 0;
    });

    return result;
  }, [templates, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  // Toggle Like API Call
  const handleLike = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.post<{ liked: boolean; likes_count: number }>(`/api/roadmaps/templates/${templateId}/like`);
      setTemplates(prev =>
        prev.map(t =>
          t.id === templateId
            ? { ...t, liked: res.liked, likes_count: res.likes_count }
            : t
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Toggle Bookmark API Call
  const handleBookmark = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.post<{ bookmarked: boolean }>(`/api/roadmaps/templates/${templateId}/bookmark`);
      setTemplates(prev =>
        prev.map(t =>
          t.id === templateId
            ? { ...t, bookmarked: res.bookmarked }
            : t
        )
      );
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  // Clone Template API Call
  const handleClone = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setCloningId(templateId);
      const res = await api.post<{ cloned_roadmap: { id: string } }>(`/api/roadmaps/templates/${templateId}/clone`);
      // Redirect to specific cloned roadmap using query string param
      navigate(`/roadmap?id=${res.cloned_roadmap.id}`);
    } catch (err: any) {
      console.error('Cloning failed:', err);
      alert(err.message || 'Failed to clone roadmap. Please try again.');
    } finally {
      setCloningId(null);
    }
  };

  const categories = ['All', 'DSA', 'Frontend', 'Backend', 'AI / ML', 'Development', 'Placement'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Hero Banner with Lavender-purple glow */}
      <div className="relative overflow-hidden rounded-3xl ai-gradient p-8 md:p-12 text-white shadow-2xl glow-purple flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
            Curated Knowledge Hub
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
            Community Roadmap Library
          </h1>
          <p className="text-purple-100 text-sm md:text-base font-medium leading-relaxed">
            Expand your horizon. Instantly clone structured templates compiled by administrators and leading engineers. Modify node tracks freely inside your private workspace.
          </p>
        </div>
        <div className="relative w-36 h-36 flex items-center justify-center bg-white/10 rounded-full border border-white/20 backdrop-blur-sm z-10 animate-bounce">
          <Compass className="w-16 h-16 text-white" />
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl -z-10" />
      </div>

      {/* Library Filter Panel */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-6">
        {/* Search & Select Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roadmaps by title, tags, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm text-slate-700 bg-slate-50"
            />
          </div>

          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm text-slate-700 bg-slate-50"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>
                  {diff === 'All' ? 'All Difficulties' : diff}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm text-slate-700 bg-slate-50"
            >
              <option value="likes">Sort by Popularity (Likes)</option>
              <option value="clones">Sort by Clone Count</option>
              <option value="hours">Sort by Duration (Hours)</option>
            </select>
          </div>
        </div>

        {/* Categories Tab Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid display templates */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Fetching public roadmaps...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-200 bg-white text-center shadow-xl flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Compass className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Roadmaps Found</h3>
          <p className="text-slate-500 max-w-md">
            We couldn't find any templates matching your search criteria. Try removing filters or adjusting search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <motion.div
              layout
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card bg-white border border-slate-200 rounded-3xl shadow-lg hover:shadow-2xl hover:border-indigo-200 transition-all flex flex-col overflow-hidden relative group"
            >
              {/* Badges indicators (Featured / Trending / Beginner Friendly) */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 pointer-events-none">
                {template.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    Featured
                  </span>
                )}
                {template.is_trending && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow">
                    <Flame className="w-2.5 h-2.5 fill-white" />
                    Trending
                  </span>
                )}
                {template.is_beginner_friendly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow">
                    <Award className="w-2.5 h-2.5" />
                    Beginner Friendly
                  </span>
                )}
              </div>

              {/* Utility Likes and Bookmarks absolute buttons */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={(e) => handleBookmark(template.id, e)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow bg-white/95 backdrop-blur",
                    template.bookmarked 
                      ? "text-indigo-600 border-indigo-200" 
                      : "text-slate-400 border-slate-100 hover:text-indigo-600"
                  )}
                  title={template.bookmarked ? 'Remove Bookmark' : 'Bookmark Template'}
                >
                  {template.bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => handleLike(template.id, e)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow bg-white/95 backdrop-blur",
                    template.liked 
                      ? "text-rose-500 border-rose-200" 
                      : "text-slate-400 border-slate-100 hover:text-rose-500"
                  )}
                  title={template.liked ? 'Unlike Template' : 'Like Template'}
                >
                  <Heart className={cn("w-4 h-4", template.liked && "fill-rose-500")} />
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col pt-16">
                {/* Meta details */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[10px]">
                    {template.category}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md font-bold text-[10px]",
                    template.difficulty === 'Beginner' && "bg-emerald-50 text-emerald-600",
                    template.difficulty === 'Intermediate' && "bg-amber-50 text-amber-600",
                    template.difficulty === 'Advanced' && "bg-rose-50 text-rose-600"
                  )}>
                    {template.difficulty}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {template.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                  {template.description}
                </p>

                {/* Tags block */}
                <div className="flex flex-wrap gap-1 mb-6">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Footer details & stats */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{template.estimated_hours} hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-slate-300 stroke-0" />
                      {template.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" />
                      {template.clones_count} clones
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Clone Button */}
              <button
                disabled={cloningId !== null}
                onClick={(e) => handleClone(template.id, e)}
                className="w-full py-4 text-center text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white transition-all flex items-center justify-center gap-2 group-hover:scale-y-100 cursor-pointer"
              >
                {cloningId === template.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>DUPLICATING PLAN...</span>
                  </>
                ) : (
                  <>
                    <span>CLONE TO WORKSPACE</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
