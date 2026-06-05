import { supabaseAdmin } from '../supabase.js';

async function checkTables() {
  console.log('Checking database connection & tables...');
  
  // Try querying roadmap_templates
  const { data, error } = await supabaseAdmin
    .from('roadmap_templates')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === 'P0001' || error.message.includes('does not exist')) {
      console.log('❌ Table "roadmap_templates" does NOT exist yet. Migration needs to be applied.');
    } else {
      console.error('❌ Connection error:', error.message, error.code);
    }
    process.exit(1);
  } else {
    console.log('✓ Table "roadmap_templates" exists. Direct seeding can proceed!');
    process.exit(0);
  }
}

checkTables().catch(err => {
  console.error(err);
  process.exit(1);
});
