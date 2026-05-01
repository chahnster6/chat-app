const SUPABASE_URL = 'https://chat-app.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aHR6cGp4cW1pdGpxeGJ1cXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTQ4NzAsImV4cCI6MjA5MzIzMDg3MH0.3usYeJpMJfTeAgGkz7LGwpQv9RnlsvRAGyetFdJaBkU'

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// --- Username ---
const adjectives = ['Swift', 'Quiet', 'Bold', 'Calm', 'Witty', 'Clever', 'Brave']
const nouns = ['Otter', 'Falcon', 'Panda', 'Tiger', 'Wolf', 'Fox', 'Bear']
const random = arr => arr[Math.floor(Math.random() * arr.length)]
const username = `${random(adjectives)}${random(nouns)}${Math.floor(Math.random() * 99)}`

// --- DOM refs ---
const chatWindow = document.getElementById('chat-window')
const messageInput = document.getElementById('message-input')
const sendBtn = document.getElementById('send-btn')
const typingIndicator = document.getElementById('typing-indicator')
const usernameDisplay = document.getElementById('username-display')

// Show username in header
usernameDisplay.textContent = username

// --- Send message ---
async function sendMessage() {
  const content = messageInput.value.trim()
  if (!content) return

  messageInput.value = ''

  // Optimistic UI — show instantly before Supabase confirms
  appendMessage({ username, content, id: 'optimistic-' + Date.now() }, true)

  const { error } = await client
    .from('messages')
    .insert({ username, content })

  if (error) console.error('Send error:', error)
}

// --- Render a message bubble ---
function appendMessage(msg, isMine) {
  const div = document.createElement('div')
  div.classList.add('message', isMine ? 'mine' : 'theirs')
  div.dataset.id = msg.id

  if (!isMine) {
    const sender = document.createElement('div')
    sender.classList.add('sender')
    sender.textContent = msg.username
    div.appendChild(sender)
  }

  const text = document.createElement('div')
  text.textContent = msg.content
  div.appendChild(text)

  chatWindow.appendChild(div)
  chatWindow.scrollTop = chatWindow.scrollHeight
}

// --- Event listeners ---
sendBtn.addEventListener('click', sendMessage)

messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage()
})