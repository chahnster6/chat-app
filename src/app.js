const SUPABASE_URL = 'https://chat-app.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aHR6cGp4cW1pdGpxeGJ1cXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTQ4NzAsImV4cCI6MjA5MzIzMDg3MH0.3usYeJpMJfTeAgGkz7LGwpQv9RnlsvRAGyetFdJaBkU'

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await client.from('messages').select('*')
  console.log('data:', data, 'error:', error)
}

test()