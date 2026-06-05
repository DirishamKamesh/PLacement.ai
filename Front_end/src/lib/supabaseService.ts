import { supabase } from './supabase';

/**
 * Helper to get current user session or throw if unauthorized
 */
async function requireAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Not authenticated');
  return session;
}

/**
 * =======================
 * USERS / PROFILE
 * =======================
 */
export const UserService = {
  async fetchProfile() {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) throw error;
    return { user: data };
  },

  async updateProfile(updates: any) {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single();
    if (error) throw error;
    return { user: data };
  }
};

/**
 * =======================
 * ROADMAPS
 * =======================
 */
export const RoadmapService = {
  async fetchRoadmaps() {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { roadmaps: data || [] };
  },

  async fetchRoadmap(id: string) {
    const session = await requireAuth();
    const [roadmapRes, nodesRes, edgesRes] = await Promise.all([
      supabase.from('roadmaps').select('*').eq('id', id).eq('user_id', session.user.id).single(),
      supabase.from('roadmap_nodes').select('*').eq('roadmap_id', id).order('created_at', { ascending: true }),
      supabase.from('roadmap_edges').select('*').eq('roadmap_id', id)
    ]);

    if (roadmapRes.error) throw roadmapRes.error;
    
    return {
      roadmap: roadmapRes.data,
      nodes: nodesRes.data || [],
      edges: edgesRes.data || []
    };
  },

  async createRoadmap(roadmapData: any) {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('roadmaps')
      .insert({
        user_id: session.user.id,
        title: roadmapData.title,
        description: roadmapData.description || '',
        status: 'active',
        total_challenges: 0,
        completed_challenges: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return { roadmap: data };
  },

  async updateRoadmap(id: string, updates: any) {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('roadmaps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();
    if (error) throw error;
    return { roadmap: data };
  },

  async deleteRoadmap(id: string) {
    const session = await requireAuth();
    const { error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) throw error;
    return { success: true };
  },

  async batchUpdateNodes(id: string, nodes: any[]) {
    const session = await requireAuth();
    // In Supabase, upsert is array-friendly
    const nodesWithMeta = nodes.map(n => ({
      ...n,
      roadmap_id: id,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('roadmap_nodes')
      .upsert(nodesWithMeta)
      .select();
    if (error) throw error;

    // Recalculate totals
    const { data: allNodes } = await supabase
      .from('roadmap_nodes')
      .select('total, solved')
      .eq('roadmap_id', id);

    if (allNodes) {
      const total = allNodes.reduce((sum, n) => sum + (n.total || 0), 0);
      const completed = allNodes.reduce((sum, n) => sum + (n.solved || 0), 0);
      await supabase
        .from('roadmaps')
        .update({ total_challenges: total, completed_challenges: completed, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id);
    }
    return { nodes: data };
  },

  async batchUpdateEdges(id: string, edges: any[]) {
    const session = await requireAuth();
    // Delete existing edges
    await supabase.from('roadmap_edges').delete().eq('roadmap_id', id);
    
    if (!edges || edges.length === 0) return { edges: [] };

    const edgesWithMeta = edges.map(e => ({
      ...e,
      roadmap_id: id,
    }));
    
    const { data, error } = await supabase
      .from('roadmap_edges')
      .insert(edgesWithMeta)
      .select();
    if (error) throw error;
    return { edges: data };
  }
};

/**
 * =======================
 * TEMPLATES
 * =======================
 */
export const TemplateService = {
  async fetchTemplates(filters: any = {}) {
    const session = await requireAuth();
    
    let query = supabase.from('roadmap_templates').select('*').eq('is_public', true);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);

    const [templatesRes, likesRes, bookmarksRes] = await Promise.all([
      query.order('likes_count', { ascending: false }),
      supabase.from('roadmap_likes').select('template_id').eq('user_id', session.user.id),
      supabase.from('roadmap_bookmarks').select('template_id').eq('user_id', session.user.id)
    ]);

    if (templatesRes.error) throw templatesRes.error;

    const likedIds = new Set((likesRes.data || []).map(l => l.template_id));
    const bookmarkedIds = new Set((bookmarksRes.data || []).map(b => b.template_id));

    const enriched = (templatesRes.data || []).map(t => ({
      ...t,
      liked: likedIds.has(t.id),
      bookmarked: bookmarkedIds.has(t.id)
    }));

    return { templates: enriched };
  },

  async fetchTemplate(id: string) {
    const [templateRes, nodesRes, edgesRes] = await Promise.all([
      supabase.from('roadmap_templates').select('*').eq('id', id).single(),
      supabase.from('roadmap_template_nodes').select('*').eq('template_id', id),
      supabase.from('roadmap_template_edges').select('*').eq('template_id', id)
    ]);
    if (templateRes.error) throw templateRes.error;
    
    return {
      template: templateRes.data,
      nodes: nodesRes.data || [],
      edges: edgesRes.data || []
    };
  },

  async toggleLike(id: string) {
    await requireAuth();
    const { data, error } = await supabase.rpc('toggle_template_like', { p_template_id: id });
    if (error) throw error;
    return data;
  },

  async toggleBookmark(id: string) {
    const session = await requireAuth();
    const { data: existing } = await supabase
      .from('roadmap_bookmarks')
      .select('*')
      .eq('template_id', id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('roadmap_bookmarks').delete().eq('template_id', id).eq('user_id', session.user.id);
      return { bookmarked: false };
    } else {
      await supabase.from('roadmap_bookmarks').insert({ template_id: id, user_id: session.user.id });
      return { bookmarked: true };
    }
  },

  async cloneTemplate(id: string) {
    const session = await requireAuth();
    
    // 1. Fetch template data
    const { template, nodes: tempNodes, edges: tempEdges } = await this.fetchTemplate(id);

    // 2. Create roadmap
    const { data: newRoadmap, error: rmError } = await supabase
      .from('roadmaps')
      .insert({
        user_id: session.user.id,
        title: template.title,
        description: template.description || '',
        status: 'active'
      })
      .select()
      .single();
    if (rmError) throw rmError;

    // 3. Remap nodes
    const nodeMapping: Record<string, string> = {};
    const nodesToInsert = tempNodes.map(tn => {
      const newId = crypto.randomUUID();
      nodeMapping[tn.id] = newId;
      return {
        id: newId,
        roadmap_id: newRoadmap.id,
        node_type: tn.node_type,
        title: tn.title,
        description: tn.description || '',
        status: 'locked',
        solved: 0,
        total: tn.total,
        label: tn.label,
        position_x: tn.position_x,
        position_y: tn.position_y,
        data: tn.data
      };
    });

    if (nodesToInsert.length > 0) {
      const { error: nodeErr } = await supabase.from('roadmap_nodes').insert(nodesToInsert);
      if (nodeErr) throw nodeErr;
    }

    // 4. Remap edges
    const edgesToInsert = tempEdges.map(te => {
      const sourceId = nodeMapping[te.source_node_id] || te.source_node_id;
      const targetId = nodeMapping[te.target_node_id] || te.target_node_id;
      return {
        roadmap_id: newRoadmap.id,
        source_node_id: sourceId,
        target_node_id: targetId,
        animated: te.animated,
        style: te.style
      };
    });

    if (edgesToInsert.length > 0) {
      const { error: edgeErr } = await supabase.from('roadmap_edges').insert(edgesToInsert);
      if (edgeErr) throw edgeErr;
    }

    // 5. Update stats & history
    await supabase.rpc('increment_template_clone_count', { p_template_id: id });
    await supabase.from('roadmap_clones').insert({
      template_id: id,
      user_id: session.user.id,
      cloned_roadmap_id: newRoadmap.id
    });

    return { cloned_roadmap: newRoadmap };
  }
};

/**
 * =======================
 * ATTENDANCE
 * =======================
 */
export const AttendanceService = {
  async fetchAttendance(month?: number, year?: number) {
    const session = await requireAuth();
    let query = supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('attendance_date', { ascending: false });

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = Number(month) === 12 ? 1 : Number(month) + 1;
      const endYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      query = query.gte('attendance_date', startDate).lt('attendance_date', endDate);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Compute stats
    const allRecords = records || [];
    const presentDays = allRecords.filter(r => r.status === 'present').length;
    const lateDays = allRecords.filter(r => r.status === 'late').length;
    const absentDays = allRecords.filter(r => r.status === 'absent').length;
    const totalDays = allRecords.length;
    const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : '0.0';

    const timesInMinutes = allRecords
      .filter(r => r.check_in_time && r.status !== 'absent')
      .map(r => {
        const [h, m] = r.check_in_time.split(':').map(Number);
        return h * 60 + m;
      });
    
    const avgMinutes = timesInMinutes.length > 0
      ? Math.round(timesInMinutes.reduce((a, b) => a + b, 0) / timesInMinutes.length)
      : 0;
    const avgHour = Math.floor(avgMinutes / 60);
    const avgMin = avgMinutes % 60;
    const avgArrival = timesInMinutes.length > 0
      ? `${String(avgHour % 12 || 12).padStart(2, '0')}:${String(avgMin).padStart(2, '0')} ${avgHour >= 12 ? 'PM' : 'AM'}`
      : 'N/A';

    let streak = 0;
    const sorted = [...allRecords].sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
    for (const record of sorted) {
      if (record.status === 'present' || record.status === 'late') streak++;
      else break;
    }

    return {
      records: allRecords,
      stats: {
        attendance_rate: `${attendanceRate}%`,
        present_days: presentDays,
        late_days: lateDays,
        absent_days: absentDays,
        avg_arrival: avgArrival,
        streak,
      }
    };
  },

  async checkin(location: string, mode: string) {
    const session = await requireAuth();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('attendance_date', dateStr)
      .maybeSingle();

    if (existing) throw new Error('Already checked in today');

    const [hours, minutes] = timeStr.split(':').map(Number);
    const status = (hours < 9 || (hours === 9 && minutes <= 15)) ? 'present' : 'late';

    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: session.user.id,
        attendance_date: dateStr,
        status,
        check_in_time: timeStr,
        location: location || 'Unknown',
        mode: mode || 'manual',
      })
      .select()
      .single();

    if (error) throw error;
    return { record: data };
  }
};

/**
 * =======================
 * RESUMES
 * =======================
 */
export const ResumeService = {
  async fetchResumes() {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { resumes: data || [] };
  },

  async uploadResume(file: File, targetRole: string) {
    const session = await requireAuth();
    if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed');

    const fileName = `${session.user.id}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, { contentType: 'application/pdf', upsert: false });
    
    if (uploadError) throw new Error('Failed to upload file to storage');

    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);

    const { data, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: session.user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        target_role: targetRole || 'Software Engineer',
      })
      .select()
      .single();

    if (dbError) throw new Error('Failed to save resume record');
    return { resume: data };
  },

  async deleteResume(id: string) {
    const session = await requireAuth();
    const { data: resume } = await supabase
      .from('resumes')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (!resume) throw new Error('Resume not found');

    if (resume.file_url) {
      const pathMatch = resume.file_url.match(/resumes\/(.+)$/);
      if (pathMatch) await supabase.storage.from('resumes').remove([pathMatch[1]]);
    }

    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async analyzeResume(id: string, targetRole: string) {
    const session = await requireAuth();
    const response = await fetch('/.netlify/functions/analyze-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ resume_id: id, target_role: targetRole })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to analyze resume');
    return data;
  }
};

/**
 * =======================
 * CHAT
 * =======================
 */
export const ChatService = {
  async fetchConversations() {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('id, context, created_at, updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return { conversations: data || [] };
  },

  async createConversation(context: string) {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: session.user.id,
        context: context || 'global',
        messages: [],
      })
      .select()
      .single();
    if (error) throw error;
    return { conversation: data };
  },

  async saveConversation(id: string, messages: any[]) {
    const session = await requireAuth();
    const { data, error } = await supabase
      .from('chat_conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();
    if (error) throw error;
    return { conversation: data };
  },

  async sendChatMessage(message: string, history: any[], context: string) {
    const session = await requireAuth();
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ message, history, context })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI chat failed');
    return data;
  }
};
