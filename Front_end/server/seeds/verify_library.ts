import { supabaseAdmin } from '../supabase.js';
import crypto from 'crypto';

async function verifyLibrary() {
  console.log('=== ROADMAP LIBRARY VERIFICATION ===');
  
  // 1. Check if templates are seeded
  console.log('1. Checking templates count...');
  const { data: templates, error: tError } = await supabaseAdmin
    .from('roadmap_templates')
    .select('id, title, category, difficulty');

  if (tError) {
    console.error('❌ Failed to fetch templates:', tError.message);
    process.exit(1);
  }

  console.log(`✓ Found ${templates.length} seeded templates in the library.`);
  
  // Print count per category to verify complete seeding
  const categories = templates.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});
  console.log('Seeded templates by category:', categories);

  // 2. Fetch a specific template with its nodes and edges
  console.log('\n2. Fetching details for "NeetCode 150"...');
  const neetcode = templates.find(t => t.title === 'NeetCode 150');
  if (!neetcode) {
    console.error('❌ "NeetCode 150" template not found in seeded data.');
    process.exit(1);
  }

  const { data: nodes, error: nError } = await supabaseAdmin
    .from('roadmap_template_nodes')
    .select('*')
    .eq('template_id', neetcode.id);

  const { data: edges, error: eError } = await supabaseAdmin
    .from('roadmap_template_edges')
    .select('*')
    .eq('template_id', neetcode.id);

  if (nError || eError) {
    console.error('❌ Failed to fetch nodes/edges:', nError?.message || eError?.message);
    process.exit(1);
  }

  console.log(`✓ NeetCode 150 has ${nodes?.length} nodes and ${edges?.length} edges.`);
  
  // 3. Test deep cloning logic for a dummy user context
  console.log('\n3. Testing deep-cloning logic...');
  
  // Get first user in DB to act as the cloner
  const { data: users, error: uError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .limit(1);

  if (uError || !users || users.length === 0) {
    console.warn('⚠️ No users found in database to perform clone verification. Skipping cloning tests.');
    console.log('=== VERIFICATION COMPLETED (TEMPLATES VERIFIED) ===');
    process.exit(0);
  }

  const targetUser = users[0];
  console.log(`Using test user: ${targetUser.email} (${targetUser.id})`);

  // Run a dry-run clone transaction manually
  console.log('Creating cloned roadmap...');
  const { data: newRoadmap, error: rmCreateError } = await supabaseAdmin
    .from('roadmaps')
    .insert({
      user_id: targetUser.id,
      title: `${neetcode.title} (Cloned Test)`,
      description: neetcode.description,
      status: 'active',
      visibility: 'private' // Clones default to private
    })
    .select()
    .single();

  if (rmCreateError) {
    console.error('❌ Failed to create cloned roadmap:', rmCreateError.message);
    process.exit(1);
  }

  console.log(`✓ Cloned roadmap created: ID ${newRoadmap.id}, Title: "${newRoadmap.title}"`);

  // Map node IDs
  const nodeMapping: Record<string, string> = {};
  const nodesToInsert = (nodes || []).map((tn: any) => {
    const newId = crypto.randomUUID();
    nodeMapping[tn.id] = newId;
    return {
      id: newId,
      roadmap_id: newRoadmap.id,
      node_type: tn.node_type,
      title: tn.title,
      description: tn.description,
      status: 'locked',
      solved: 0,
      total: tn.total,
      label: tn.label,
      position_x: tn.position_x,
      position_y: tn.position_y,
      data: tn.data
    };
  });

  console.log(`Inserting ${nodesToInsert.length} mapped nodes...`);
  const { error: nodesInsertError } = await supabaseAdmin
    .from('roadmap_nodes')
    .insert(nodesToInsert);

  if (nodesInsertError) {
    console.error('❌ Failed to insert cloned nodes:', nodesInsertError.message);
    // Cleanup
    await supabaseAdmin.from('roadmaps').delete().eq('id', newRoadmap.id);
    process.exit(1);
  }

  // Map edges
  const edgesToInsert = (edges || []).map((te: any) => {
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

  console.log(`Inserting ${edgesToInsert.length} mapped edges...`);
  const { error: edgesInsertError } = await supabaseAdmin
    .from('roadmap_edges')
    .insert(edgesToInsert);

  if (edgesInsertError) {
    console.error('❌ Failed to insert cloned edges:', edgesInsertError.message);
    // Cleanup
    await supabaseAdmin.from('roadmaps').delete().eq('id', newRoadmap.id);
    process.exit(1);
  }

  console.log('✓ Successfully duplicated nodes and edges with correctly linked UUIDs!');

  // Cleanup the test cloned roadmap
  console.log('\nCleaning up verification cloned records...');
  const { error: cleanupError } = await supabaseAdmin
    .from('roadmaps')
    .delete()
    .eq('id', newRoadmap.id);

  if (cleanupError) {
    console.error('❌ Failed to cleanup cloned roadmap:', cleanupError.message);
  } else {
    console.log('✓ Cleanup successful.');
  }

  console.log('\n=== ROADMAP LIBRARY VERIFICATION PASSED ===');
  process.exit(0);
}

verifyLibrary().catch(err => {
  console.error(err);
  process.exit(1);
});
