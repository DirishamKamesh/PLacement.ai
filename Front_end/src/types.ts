export type View = 
  | 'landing' 
  | 'dashboard' 
  | 'roadmap' 
  | 'workspace' 
  | 'resume-lab' 
  | 'analytics' 
  | 'operations' 
  | 'attendance'
  | 'profile'
  | 'admin';

export interface User {
  name: string;
  avatar?: string;
  role: 'student' | 'admin';
  streak: number;
}

export interface RoadmapNode {
  id: string;
  type: 'topic' | 'challenge' | 'project' | 'milestone';
  title: string;
  status: 'locked' | 'in-progress' | 'completed';
  progress: number;
  tags: string[];
}
