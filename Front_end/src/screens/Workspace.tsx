import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Maximize2, 
  Settings, 
  RotateCcw,
  Sparkles,
  Terminal,
  BrainCircuit,
  MessageSquare,
  Copy,
  ChevronDown,
  Layout as LayoutIcon,
  Code2,
  Target,
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ChatService } from '../lib/supabaseService';

interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export const Workspace = () => {
  const [code, setCode] = useState(`class LRUCache:
    def __init__(self, capacity: int):
        # Initialize data structures
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        # Implement get logic
        pass

    def put(self, key: int, value: int) -> None:
        # Implement put logic
        pass`);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', parts: "I've analyzed your project 'LRU Cache'. Your core dictionary logic is solid, but remember that standard dicts only provide entry order in Python 3.7+. Ready for a deep-dive on **O(1)** efficiency?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (msg?: string) => {
    const textToSend = msg || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', parts: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, parts: [{ text: m.parts }] }));
      const data = await ChatService.sendChatMessage(textToSend, history, 'workspace');

      setChatMessages(prev => [...prev, { role: 'model', parts: data.text }]);
    } catch (error) {
      console.error('Workspace chat error:', error);
      setChatMessages(prev => [...prev, { role: 'model', parts: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const analyzeSolution = async () => {
    const prompt = `Please analyze my current implementation of LRU Cache and provide feedback on efficiency and correctness: \n\n\`\`\`python\n${code}\n\`\`\``;
    handleSendMessage(prompt);
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Navbar Overlay */}
      <div className="h-14 border-b border-surface-container-high flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
           <button className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">
              <LayoutIcon className="w-4 h-4" /> Problem List
           </button>
           <div className="h-4 w-px bg-surface-container-high" />
           <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-on-surface tracking-tight">146. LRU Cache</h2>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black uppercase tracking-widest">Medium</span>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-surface-container rounded-lg p-1">
              <button className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">Python3 <ChevronDown className="w-3 h-3 inline ml-1" /></button>
           </div>
           <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant"><Settings className="w-4 h-4" /></button>
           <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant"><Maximize2 className="w-4 h-4" /></button>
           <button className="flex items-center gap-2 px-4 py-1.5 bg-surface border border-surface-container-high text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container transition-colors">
              <Play className="w-3.5 h-3.5 fill-current" /> Run
           </button>
           <button className="px-6 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
              Submit
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Desc */}
        <div className="w-[400px] border-r border-surface-container-high flex flex-col">
            <div className="flex border-b border-surface-container-high">
               <button className="flex-1 py-3 text-xs font-bold text-primary border-b-2 border-primary bg-primary/5">Description</button>
               <button className="flex-1 py-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Submissions</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">Design</span>
                   <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">Hash Table</span>
                   <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">Linked List</span>
                </div>
                <div className="prose prose-sm max-w-none">
                   <p className="text-on-surface leading-relaxed font-medium">Design a data structure that follows the constraints of a <b>Least Recently Used (LRU) cache</b>.</p>
                   <p className="text-on-surface leading-relaxed">Implement the LRUCache class:</p>
                   <ul className="list-disc pl-4 space-y-2 text-on-surface-variant">
                      <li><code className="bg-surface-container px-1 py-0.5 rounded">LRUCache(int capacity)</code> Initialize the LRU cache with positive size capacity.</li>
                      <li><code className="bg-surface-container px-1 py-0.5 rounded">int get(int key)</code> Return the value of the key if the key exists, otherwise return -1.</li>
                      <li><code className="bg-surface-container px-1 py-0.5 rounded">void put(int key, int value)</code> Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache.</li>
                   </ul>
                </div>
                
                <div className="bg-surface border border-surface-container-high p-4 rounded-xl">
                   <div className="flex items-center gap-2 mb-3">
                      <Terminal className="w-4 h-4 text-on-surface-variant" />
                      <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Example 1</span>
                   </div>
                   <div className="space-y-4 text-xs font-mono">
                      <div>
                         <p className="text-on-surface-variant mb-1 uppercase tracking-tighter opacity-70">Input</p>
                         <p className="p-2 bg-white border border-surface-container rounded-lg">[ "LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get" ]</p>
                      </div>
                      <div>
                         <p className="text-on-surface-variant mb-1 uppercase tracking-tighter opacity-70">Output</p>
                         <p className="p-2 bg-white border border-surface-container rounded-lg">[ null, null, null, 1, null, -1, null, -1, 3, 4 ]</p>
                      </div>
                   </div>
                </div>
            </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col bg-[#f8fafc]">
            <div className="flex-1 p-6 font-mono text-sm relative group overflow-hidden">
                <div className="absolute top-0 left-0 p-4 pointer-events-none opacity-5 hover:opacity-10 transition-opacity">
                   <Code2 className="w-64 h-64 text-on-surface" />
                </div>
                <textarea 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-[#1e293b] leading-6 selection:bg-primary/20"
                  spellCheck={false}
                />
            </div>
            
            {/* Bottom: Tabs */}
            <div className="h-1/3 border-t border-surface-container-high bg-white flex flex-col">
               <div className="flex border-b border-surface-container-high px-4">
                  <button className="px-6 py-3 text-xs font-bold text-on-surface border-b-2 border-on-surface">Testcases</button>
                  <button className="px-6 py-3 text-xs font-bold text-on-surface-variant">Test Result</button>
               </div>
               <div className="flex-1 p-6 flex gap-8">
                  <div className="w-48 space-y-2">
                     <button className="w-full px-4 py-2 bg-primary/5 text-primary text-xs font-bold rounded-lg text-left border border-primary/20">Case 1</button>
                     <button className="w-full px-4 py-2 bg-surface text-on-surface-variant text-xs font-bold rounded-lg text-left border border-surface-container-high hover:bg-surface-container transition-colors">Case 2</button>
                     <button className="w-full px-4 py-2 text-primary text-xs font-bold flex items-center gap-2">+ Add Case</button>
                  </div>
                  <div className="flex-1 space-y-4">
                      <div>
                         <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 block">capacity =</label>
                         <input type="text" value="2" readOnly className="w-full p-2 bg-surface border border-surface-container-high rounded-lg text-xs font-mono" />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 block">operations =</label>
                         <textarea readOnly className="w-full p-2 bg-surface border border-surface-container-high rounded-lg text-xs font-mono resize-none h-24" value='[ "put", "put", "get", "put", "get", "put", "get", "get", "get" ]' />
                      </div>
                  </div>
               </div>
            </div>
        </div>

        {/* Right: AI Mentor */}
        <div className="w-[380px] border-l border-slate-200 bg-slate-50 flex flex-col relative overflow-hidden">
            <div className="p-4 ai-gradient flex items-center justify-between shadow-lg">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <h3 className="text-sm font-semibold text-white">AI Mentor</h3>
               </div>
               <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full uppercase font-bold tracking-widest">Guide Mode</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div className="space-y-4">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      m.role === 'user' ? "flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                        m.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-500 text-white"
                      )}>
                        {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl max-w-[90%] text-[11px] leading-relaxed shadow-sm",
                        m.role === 'user' ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-700"
                      )}>
                        <ReactMarkdown>{m.parts}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                        <span className="text-[10px] font-medium text-slate-400">Analyzing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Readiness Engine Section */}
                <div className="glass-card rounded-2xl p-5 shadow-xl border-indigo-100 glow-indigo">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Readiness Engine</h4>
                      <button 
                        onClick={analyzeSolution}
                        className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                        title="AI Analysis"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                      </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-tight">
                                <span>DSA Concept Mastery</span>
                                <span className="text-indigo-600">82%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full">
                                <div className="h-full w-[82%] bg-green-500 rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-tight">
                                <span>Optimization Skills</span>
                                <span className="text-indigo-600">64%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full">
                                <div className="h-full w-[64%] bg-indigo-500 rounded-full shadow-sm"></div>
                            </div>
                        </div>
                    </div>
                    <button 
                      onClick={analyzeSolution}
                      className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <BrainCircuit className="w-3 h-3" /> ANALYZE THIS SOLUTION
                    </button>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shadow-2xl">
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about design patterns..." 
                    className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={() => handleSendMessage()}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-200"
                  >
                     <Send className="w-4 h-4" />
                  </button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ className, children }: any) => (
  <div className={cn("", className)}>
    {children}
  </div>
);
