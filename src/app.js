const SUPABASE_URL = 'https://lzhtzpjxqmitjqxbuqtg.supabase.co'
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
const onlineCount = document.getElementById('online-count')

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

// --- Load past messages ---
async function loadMessages() {
  const { data, error } = await client
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) { console.error('Load error:', error); return }

  data.forEach(msg => appendMessage(msg, msg.username === username))
}

loadMessages()

// --- Realtime: listen for new messages ---
client
  .channel('public:messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      const msg = payload.new

      const optimistic = chatWindow.querySelector('[data-id^="optimistic-"]')
      if (optimistic && msg.username === username) {
        optimistic.dataset.id = msg.id
        return
      }

      appendMessage(msg, msg.username === username)
    }
  )
  .subscribe()

// --- Realtime: typing indicators via Presence ---
const room = client.channel('room:typing', {
  config: { presence: { key: username } }
})

let typingTimeout

messageInput.addEventListener('input', () => {
  room.track({ typing: true })
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    room.track({ typing: false })
  }, 2000)
})

room.on('presence', { event: 'sync' }, () => {
  const state = room.presenceState()

  const typers = Object.keys(state).filter(key => {
    if (key === username) return false
    const presences = state[key]
    return presences.some(p => p.typing === true)
  })

  if (typers.length === 0) {
    typingIndicator.textContent = ''
  } else if (typers.length === 1) {
    typingIndicator.textContent = `${typers[0]} is typing...`
  } else {
    typingIndicator.textContent = `${typers.slice(0, -1).join(', ')} and ${typers.slice(-1)} are typing...`
  }

  onlineCount.textContent = `${Object.keys(state).length} online`
})

room.subscribe()