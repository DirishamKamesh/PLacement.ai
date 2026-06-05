import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, User, Bot, Loader2, Minimize2, Maximize2, MessageSquarePlus } from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

export const AIMentor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load last active conversation or create one on open
  useEffect(() => {
    if (!isOpen) return;

    const loadOrCreateConversation = async () => {
      try {
        const listData = await api.get<{ conversations: any[] }>('/api/chat/conversations');
        
        if (listData.conversations.length > 0) {
          const latest = listData.conversations[0];
          setActiveConversationId(latest.id);
          
          // Fetch complete history
          const detailed = await api.get<{ conversations: any[] }>('/api/chat/conversations');
          const matched = detailed.conversations.find((c: any) => c.id === latest.id);
          if (matched && matched.messages) {
            setMessages(matched.messages);
          }
        } else {
          // Create new conversation
          const newConv = await api.post<{ conversation: any }>('/api/chat/conversations', { context: 'global' });
          setActiveConversationId(newConv.conversation.id);
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load conversation history:', err);
      }
    };

    loadOrCreateConversation();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send chat request with current message history formatted for Gemini
      const chatResponse = await api.post<{ text: string }>('/api/chat', { 
        message: input, 
        history: messages.map(m => ({ role: m.role, parts: [{ text: m.parts }] })),
        context: 'global'
      });

      const assistantMessage: Message = { role: 'model', parts: chatResponse.text };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save messages back to the persistent conversation database record
      if (activeConversationId) {
        await api.put(`/api/chat/conversations/${activeConversationId}`, {
          messages: finalMessages
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', parts: 'I encountered an error. Please check your API key or connection.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    setIsLoading(true);
    try {
      const newConv = await api.post<{ conversation: any }>('/api/chat/conversations', { context: 'global' });
      setActiveConversationId(newConv.conversation.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '600px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "bg-white border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col transition-all duration-300 w-[400px] mb-4 origin-bottom-right",
              isMinimized ? "h-16" : "h-[600px]"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">AI Placement Mentor</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Verified Expertise</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleNewConversation}
                  title="New Conversation"
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50"
                >
                  {messages.length === 0 && (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                        <Bot className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">How can I help you today?</h4>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Practice mock interviews, review your resume, or solve DSA problems.</p>
                      <div className="flex flex-wrap justify-center gap-2 pt-4">
                        <QuickAction label="Mock Interview" onClick={setInput} />
                        <QuickAction label="Resume Review" onClick={setInput} />
                        <QuickAction label="DSA Concepts" onClick={setInput} />
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3",
                        m.role === 'user' ? "flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        m.role === 'user' ? "bg-slate-100 text-slate-600" : "bg-indigo-500 text-white"
                      )}>
                        {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl max-w-[85%] text-sm",
                        m.role === 'user' 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm"
                      )}>
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                          <Markdown>{m.parts}</Markdown>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span className="text-xs font-medium">Mentoring...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask your mentor anything..."
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-16 h-16 rounded-[2rem] ai-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group",
          isOpen ? "hidden" : "flex"
        )}
      >
        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};

const QuickAction = ({ label, onClick }: { label: string, onClick: (l: string) => void }) => (
  <button 
    onClick={() => onClick(label)}
    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
  >
    {label}
  </button>
);
