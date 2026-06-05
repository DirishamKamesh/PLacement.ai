import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position,
  Node,
  Edge,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'motion/react';
import { 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Play,
  Layout,
  Code2,
  Sparkles,
  Zap,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

const TopicNode = ({ data }: any) => {
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isLocked = data.status === 'locked';

  const handleStatusToggle = async () => {
    if (data.onStatusChange) {
      const nextStatus = isCompleted ? 'in-progress' : isInProgress ? 'completed' : 'in-progress';
      await data.onStatusChange(data.id, nextStatus);
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl glass-card shadow-xl z-20 w-64 border transition-all duration-500 bg-white",
      isInProgress && "border-indigo-200 glow-indigo",
      isLocked && "opacity-60"
    )}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-300 !border-0" />
      
      <div className="flex items-center justify-between mb-3">
         <span className={cn(
           "text-[10px] uppercase tracking-widest font-bold",
           isCompleted ? "text-tertiary" : isInProgress ? "text-primary" : "text-slate-400"
         )}>
           {data.label || 'Topic'}
         </span>
         <div className={cn(
           "w-2 h-2 rounded-full",
           isCompleted ? "bg-tertiary" : isInProgress ? "bg-primary animate-pulse" : "bg-slate-300"
         )} />
      </div>

      <h3 className="font-bold text-lg leading-tight mb-1 text-slate-900">{data.title}</h3>
      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{data.description || 'Master industrial patterns and optimize your execution logic.'}</p>

      {isInProgress && (
        <div className="space-y-3">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${data.total > 0 ? (data.solved/data.total) * 100 : 0}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary uppercase">{data.total > 0 ? Math.round((data.solved/data.total) * 100) : 0}% Progress</span>
            <button 
              onClick={handleStatusToggle}
              className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
               DONE
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">COMPLETED</span>
            <span className="text-[10px] text-slate-400">{data.solved}/{data.total} challenges</span>
          </div>
          <button 
            onClick={handleStatusToggle}
            className="text-[10px] text-slate-400 hover:text-primary transition-colors font-bold"
          >
            Reopen
          </button>
        </div>
      )}

      {isLocked && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Locked</span>
          </div>
          <button 
            onClick={handleStatusToggle}
            className="text-[10px] text-indigo-600 hover:underline font-bold"
          >
            Unlock
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-300 !border-0" />
    </div>
  );
};

const MilestoneNode = ({ data }: any) => (
  <div className="p-5 rounded-full glass-card border-2 border-indigo-100 shadow-2xl flex flex-col items-center justify-center w-32 h-32 group hover:scale-110 transition-transform duration-500 bg-white/90">
    <Handle type="target" position={Position.Top} className="!opacity-0" />
    <div className="w-12 h-12 ai-gradient rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
      <Trophy className="w-6 h-6 text-white" />
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mt-2">{data.label}</span>
    <Handle type="source" position={Position.Bottom} className="!opacity-0" />
  </div>
);

const nodeTypes = {
  topic: TopicNode,
  milestone: MilestoneNode,
};

export const Roadmap = () => {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch details for a specific roadmap
  const loadRoadmapDetails = async (roadmapId: string) => {
    try {
      setIsLoading(true);
      const detailed = await api.get<{ roadmap: any; nodes: any[]; edges: any[] }>(`/api/roadmaps/${roadmapId}`);
      setActiveRoadmap(detailed.roadmap);
      
      // Map to ReactFlow Nodes
      const flowNodes = detailed.nodes.map((n: any) => ({
        id: n.id,
        type: n.node_type,
        position: { x: n.position_x, y: n.position_y },
        data: { 
          id: n.id,
          title: n.title, 
          status: n.status, 
          solved: n.solved, 
          total: n.total, 
          label: n.label,
          description: n.description,
          onStatusChange: handleStatusChangeForId(roadmapId)
        }
      }));
      setNodes(flowNodes);

      // Map to ReactFlow Edges
      const flowEdges = detailed.edges.map((e: any) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        animated: e.animated,
        style: e.style || { stroke: 'var(--color-surface-dim)', strokeWidth: 2 }
      }));
      setEdges(flowEdges);
    } catch (err) {
      console.error('Failed to load roadmap details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all roadmaps for the user
  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const data = await api.get<{ roadmaps: any[] }>('/api/roadmaps');
        setRoadmaps(data.roadmaps);
        if (data.roadmaps.length > 0) {
          const searchParams = new URLSearchParams(window.location.search);
          const forceId = searchParams.get('id');
          const targetId = forceId && data.roadmaps.some(r => r.id === forceId) ? forceId : data.roadmaps[0].id;
          await loadRoadmapDetails(targetId);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load roadmaps:', err);
        setIsLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  // Update node status handler factory scoped to specific roadmap
  const handleStatusChangeForId = (roadmapId: string) => async (nodeId: string, nextStatus: string) => {
    try {
      const updatedNodes = nodes.map((n: any) => {
        if (n.id === nodeId) {
          const solvedCount = nextStatus === 'completed' ? n.data.total : nextStatus === 'in-progress' ? Math.round(n.data.total / 2) : 0;
          return {
            ...n,
            data: { ...n.data, status: nextStatus, solved: solvedCount }
          };
        }
        return n;
      });

      setNodes(updatedNodes);

      // Send to server
      const payload = updatedNodes.map((n: any) => ({
        id: n.id,
        node_type: n.type,
        title: n.data.title,
        status: n.data.status,
        solved: n.data.solved,
        total: n.data.total,
        label: n.data.label,
        position_x: n.position.x,
        position_y: n.position.y
      }));

      await api.put(`/api/roadmaps/${roadmapId}/nodes`, { nodes: payload });

      // Refresh roadmap stats
      const detailed = await api.get<{ roadmap: any; nodes: any[]; edges: any[] }>(`/api/roadmaps/${roadmapId}`);
      setActiveRoadmap(detailed.roadmap);
    } catch (err) {
      console.error('Error changing node status:', err);
    }
  };

  // Debounced/Auto-save node positions
  useEffect(() => {
    if (!activeRoadmap || nodes.length === 0) return;

    const savePositions = setTimeout(async () => {
      try {
        const payload = nodes.map((n: any) => ({
          id: n.id,
          node_type: n.type,
          title: n.data.title,
          status: n.data.status,
          solved: n.data.solved,
          total: n.data.total,
          label: n.data.label,
          position_x: n.position.x,
          position_y: n.position.y
        }));

        await api.put(`/api/roadmaps/${activeRoadmap.id}/nodes`, { nodes: payload });
      } catch (err) {
        console.error('Error auto-saving node positions:', err);
      }
    }, 1500);

    return () => clearTimeout(savePositions);
  }, [nodes]);

  // Derive "Up Next" node dynamically
  const upNextNode = useMemo(() => {
    return nodes.find((n: any) => n.data.status === 'in-progress');
  }, [nodes]);

  // Calculate dynamic progress values
  const progressPercentage = useMemo(() => {
    if (!activeRoadmap || activeRoadmap.total_challenges === 0) return 0;
    return Math.round((activeRoadmap.completed_challenges / activeRoadmap.total_challenges) * 100);
  }, [activeRoadmap]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Sparkles className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No roadmaps available</h3>
        <p className="text-slate-500 max-w-sm mb-6">Sign up or complete profile setup to automatically generate your DSA roadmap.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col relative overflow-hidden bg-slate-50 dot-grid">
      {/* Roadmap Stats Overlay */}
      <div className="absolute top-8 right-8 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="glass-card p-6 rounded-2xl border border-white/50 shadow-xl w-80 bg-white/90 backdrop-blur-md">
             {roadmaps.length > 1 && (
               <div className="mb-4">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Active Roadmap</label>
                 <select
                   value={activeRoadmap?.id || ''}
                   onChange={(e) => loadRoadmapDetails(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                 >
                   {roadmaps.map((r: any) => (
                     <option key={r.id} value={r.id}>{r.title}</option>
                   ))}
                 </select>
               </div>
             )}
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-[180px]">{activeRoadmap?.title || 'Roadmap Progress'}</span>
                <span className="text-primary font-bold">{progressPercentage}%</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full ai-gradient animate-pulse" style={{ width: `${progressPercentage}%` }} />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {activeRoadmap?.completed_challenges} / {activeRoadmap?.total_challenges} Challenges Solved
             </span>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3">
         <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-200 hover:scale-105 active:scale-95 transition-all text-slate-400 hover:text-primary">
            <Layout className="w-5 h-5" />
         </button>
         <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-200 hover:scale-105 active:scale-95 transition-all text-slate-400 hover:text-primary">
            <Zap className="w-5 h-5" />
         </button>
         <button className="w-12 h-12 ai-gradient text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all glow-purple">
            <Sparkles className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="transparent" />
          <Controls className="!bg-white !border-slate-200 !shadow-xl !rounded-xl overflow-hidden" />
        </ReactFlow>
      </div>

      {/* Up Next Card Hovering Top Center */}
      {upNextNode && (
        <div className="absolute top-8 left-8 z-10 w-full max-w-lg pointer-events-none">
           <motion.div 
             initial={{ x: -50, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="pointer-events-auto glass-card border-indigo-100 p-5 rounded-2xl shadow-2xl flex items-center gap-5 group hover:border-primary transition-all cursor-pointer glow-indigo bg-white/90 backdrop-blur-md"
           >
              <div className="w-12 h-12 ai-gradient rounded-xl flex items-center justify-center shadow-lg">
                 <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      UP NEXT • {upNextNode.data.label || 'TOPIC'}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">ACTIVE</span>
                 </div>
                 <h3 className="text-base font-bold text-slate-900 line-clamp-1">{upNextNode.data.title}</h3>
              </div>
              <button className="p-2 bg-slate-900 text-white rounded-lg hover:scale-105 transition-transform">
                 <ChevronRight className="w-5 h-5" />
              </button>
           </motion.div>
        </div>
      )}
    </div>
  );
};
