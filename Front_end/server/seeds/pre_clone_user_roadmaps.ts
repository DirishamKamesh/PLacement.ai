import { supabaseAdmin } from '../supabase.js';
import crypto from 'crypto';

async function preCloneRoadmaps() {
  console.log('=== PRE-CLONING ROADMAPS FOR TEST USER ===');
  
  const testUserId = '20b76241-c17b-40f2-be65-7e66d6de8f1b';
  
  // Verify test user exists
  const { data: user, error: uError } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', testUserId)
    .maybeSingle();
    
  if (uError || !user) {
    console.error('❌ Test user does not exist in the database. Please run create_test_user first.');
    process.exit(1);
  }
  
  console.log(`Targeting test user profile: ${user.email} (${testUserId})`);

  // Target templates to pre-clone
  const targetTemplateIds = [
    '22222222-2222-2222-2222-222222222222', // 90-Day DSA Challenge
    'f0000000-0000-0000-0000-000000000004', // React
    'b0000000-0000-0000-0000-000000000003', // PostgreSQL
    'a0000000-0000-0000-0000-000000000003', // Generative AI
    '11111111-1111-1111-1111-111111111111'  // CSE Placement Preparation
  ];

  for (const templateId of targetTemplateIds) {
    // 1. Fetch template metadata
    const { data: template, error: tError } = await supabaseAdmin
      .from('roadmap_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (tError || !template) {
      console.warn(`⚠️ Template ${templateId} not found in database. Skipping...`);
      continue;
    }

    // Check if this template is already cloned for the test user (by checking title match in user's roadmaps)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('roadmaps')
      .select('id')
      .eq('user_id', testUserId)
      .eq('title', template.title)
      .maybeSingle();

    if (checkError) {
      console.error(`Error checking active roadmaps for template "${template.title}":`, checkError.message);
      continue;
    }

    if (existing) {
      console.log(`✓ Roadmap "${template.title}" is already pre-cloned for this user.`);
      continue;
    }

    console.log(`Cloning "${template.title}"...`);

    // Fetch nodes & edges
    const { data: tempNodes } = await supabaseAdmin
      .from('roadmap_template_nodes')
      .select('*')
      .eq('template_id', templateId);

    const { data: tempEdges } = await supabaseAdmin
      .from('roadmap_template_edges')
      .select('*')
      .eq('template_id', templateId);

    if (!tempNodes || tempNodes.length === 0) {
      console.warn(`- Template "${template.title}" has no nodes. Skipping clone.`);
      continue;
    }

    // 2. Create the personal user roadmap
    const totalChallenges = tempNodes.reduce((sum, n) => sum + (n.total || 0), 0);
    const { data: newRoadmap, error: rmError } = await supabaseAdmin
      .from('roadmaps')
      .insert({
        user_id: testUserId,
        title: template.title,
        description: template.description,
        status: 'active',
        visibility: 'private',
        total_challenges: totalChallenges,
        completed_challenges: 0
      })
      .select()
      .single();

    if (rmError) {
      console.error(`- Error creating roadmap for "${template.title}":`, rmError.message);
      continue;
    }

    // 3. Duplicate nodes and translate IDs
    const nodeMapping: Record<string, string> = {};
    const nodesToInsert = tempNodes.map((tn: any, idx: number) => {
      const newId = crypto.randomUUID();
      nodeMapping[tn.id] = newId;
      
      // Make the first node 'in-progress' and others 'locked' to make it look realistic!
      const status = idx === 0 ? 'in-progress' : 'locked';
      const solved = idx === 0 ? Math.round(tn.total / 2) : 0;
      
      return {
        id: newId,
        roadmap_id: newRoadmap.id,
        node_type: tn.node_type,
        title: tn.title,
        description: tn.description,
        status: status,
        solved: solved,
        total: tn.total,
        label: tn.label,
        position_x: tn.position_x,
        position_y: tn.position_y,
        data: tn.data || {}
      };
    });

    const { error: nodesError } = await supabaseAdmin
      .from('roadmap_nodes')
      .insert(nodesToInsert);

    if (nodesError) {
      console.error(`- Error inserting nodes for "${template.title}":`, nodesError.message);
      // rollback
      await supabaseAdmin.from('roadmaps').delete().eq('id', newRoadmap.id);
      continue;
    }

    // Update the completed challenges to match the pre-solved count of the first node
    const completedChallenges = nodesToInsert.reduce((sum, n) => sum + n.solved, 0);
    await supabaseAdmin
      .from('roadmaps')
      .update({ completed_challenges: completedChallenges })
      .eq('id', newRoadmap.id);

    // 4. Duplicate edges linking mapped node IDs
    if (tempEdges && tempEdges.length > 0) {
      const edgesToInsert = tempEdges.map((te: any) => {
        const sourceId = nodeMapping[te.source_node_id] || te.source_node_id;
        const targetId = nodeMapping[te.target_node_id] || te.target_node_id;
        return {
          roadmap_id: newRoadmap.id,
          source_node_id: sourceId,
          target_node_id: targetId,
          animated: te.animated,
          style: te.style || {}
        };
      });

      const { error: edgesError } = await supabaseAdmin
        .from('roadmap_edges')
        .insert(edgesToInsert);

      if (edgesError) {
        console.error(`- Error inserting edges for "${template.title}":`, edgesError.message);
      }
    }

    // 5. Update stats: increment template clone count
    await supabaseAdmin
      .from('roadmap_templates')
      .update({ clones_count: (template.clones_count || 0) + 1 })
      .eq('id', templateId);

    // 6. Save cloning event history link
    await supabaseAdmin
      .from('roadmap_clones')
      .insert({
        template_id: templateId,
        user_id: testUserId,
        cloned_roadmap_id: newRoadmap.id
      });

    console.log(`✓ successfully pre-cloned "${template.title}"`);
  }
  
  console.log('\n=== PRE-CLONING COMPLETED ===');
  process.exit(0);
}

preCloneRoadmaps().catch(err => {
  console.error(err);
  process.exit(1);
});
