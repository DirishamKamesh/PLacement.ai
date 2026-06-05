// Use native global fetch

async function testTemplatesEndpoint() {
  console.log('Testing GET /api/roadmaps/templates...');
  
  // Use the mock token for our test user
  const mockToken = 'mock-token-20b76241-c17b-40f2-be65-7e66d6de8f1b';
  
  try {
    const res = await fetch('http://localhost:3000/api/roadmaps/templates', {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });

    console.log(`Response Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body: ${text.substring(0, 300)}`);
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testTemplatesEndpoint().catch(console.error);
