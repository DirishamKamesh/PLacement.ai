import { supabaseAdmin } from '../supabase.js';

async function createTestUser() {
  const email = 'testuser@example.com';
  const password = 'Password123!';
  const fullName = 'Test User';
  const role = 'student';

  console.log(`Creating test user with email: ${email}...`);

  // Check if user already exists in auth
  const { data: listUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing auth users:', listError.message);
    process.exit(1);
  }

  let authUser = listUsers.users.find(u => u.email === email);
  let userId = '';

  if (authUser) {
    console.log(`User already exists in Supabase Auth. ID: ${authUser.id}`);
    userId = authUser.id;
  } else {
    // Create auth user
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error('Error creating auth user:', createError.message);
      process.exit(1);
    }

    if (!createData.user) {
      console.error('Failed to create auth user: user is null');
      process.exit(1);
    }

    console.log(`✓ Auth user created successfully. ID: ${createData.user.id}`);
    userId = createData.user.id;
  }

  // Check if profile exists in users table
  const { data: profile, error: pError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (pError) {
    console.error('Error checking profile:', pError.message);
    process.exit(1);
  }

  if (profile) {
    console.log('Profile already exists in "users" table.');
  } else {
    // Insert into users table
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role,
        skills: ['JavaScript', 'React', 'Node.js'],
        social_links: { github: 'https://github.com/testuser' },
        streak: 5
      });

    if (insertError) {
      console.error('Error inserting user profile:', insertError.message);
      process.exit(1);
    }

    console.log('✓ Profile inserted successfully into "users" table.');
  }

  console.log('\n=== Test User Credentials ===');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('=============================\n');
  process.exit(0);
}

createTestUser().catch(err => {
  console.error(err);
  process.exit(1);
});
