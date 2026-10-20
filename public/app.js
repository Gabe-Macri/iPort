/**
 * iPort Frontend Client
 * Clean, fast, minimal, zero-dependency iMessage web relay.
 */

(function () {
  'use strict';

  // --- App State ---
  const state = {
    chats: [],
    activeChat: null,
    messages: [],
    serverStatus: null,
    searchQuery: '',
    connected: false,
    audioEnabled: true
  };

  // --- DOM Elements ---
  const appContainer = document.getElementById('appContainer');
  const chatListEl = document.getElementById('chatList');
  const messagesContainer = document.getElementById('messagesContainer');
  const searchInput = document.getElementById('searchInput');
  const messageInput = document.getElementById('messageInput');
  const btnSend = document.getElementById('btnSend');
  const inputArea = document.getElementById('inputArea');
  const chatTitle = document.getElementById('chatTitle');
  const chatSubtitle = document.getElementById('chatSubtitle');
  const headerAvatar = document.getElementById('headerAvatar');
  const serviceBadge = document.getElementById('serviceBadge');
  const relayStatus = document.getElementById('relayStatus');
  const relayStatusText = document.getElementById('relayStatusText');
  const btnBack = document.getElementById('btnBack');
  const diagBanner = document.getElementById('diagBanner');

  // Modals
  const modalSettings = document.getElementById('modalSettings');
  const settingsBody = document.getElementById('settingsBody');
  const btnSettings = document.getElementById('btnSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnDoneSettings = document.getElementById('btnDoneSettings');

  const modalCompose = document.getElementById('modalCompose');
  const btnNewChat = document.getElementById('btnNewChat');
  const btnCloseCompose = document.getElementById('btnCloseCompose');
  const btnCancelCompose = document.getElementById('btnCancelCompose');
  const btnSubmitCompose = document.getElementById('btnSubmitCompose');
  const composeRecipient = document.getElementById('composeRecipient');
  const composeService = document.getElementById('composeService');
  const composeText = document.getElementById('composeText');

  const modalPin = document.getElementById('modalPin');
  const pinInput = document.getElementById('pinInput');
  const pinError = document.getElementById('pinError');
  const btnSubmitPin = document.getElementById('btnSubmitPin');

  const modalLightbox = document.getElementById('modalLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const btnCloseLightbox = document.getElementById('btnCloseLightbox');

  // --- Web Audio Synthesizer (Zero file dependencies) ---
  const audioCtx = window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null;

  function playSound(type) {
    if (!state.audioEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'sent') {
        // Subtle soft swoosh-pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'received') {
        // Apple-style gentle dual chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.07); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // --- Formatting Helpers ---
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    const clean = name.replace(/[^\w\s]/gi, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || name.slice(0, 1).toUpperCase();
  }

  // --- API Client ---
  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (res.status === 401) {
      modalPin.classList.remove('hidden');
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }

    return res.json();
  }

  // --- Status & Diagnostics ---
  async function checkServerStatus() {
    try {
      const data = await api('/api/status');
      state.serverStatus = data;

      if (!data.diagnostics?.fdaGranted && !data.isDemo) {
        diagBanner.classList.remove('hidden');
      } else {
        diagBanner.classList.add('hidden');
      }

      updateStatusBadge(true, data.isDemo ? 'Demo Mode' : 'Connected to Mac');
    } catch (err) {
      updateStatusBadge(false, 'Disconnected');
    }
  }

  function updateStatusBadge(online, text) {
    state.connected = online;
    relayStatus.className = 'status-indicator ' + (online ? 'online' : 'offline');
    relayStatusText.textContent = text;
  }

  // --- Real-Time SSE Stream ---
  function setupSSE() {
    const sse = new EventSource('/api/events');

    sse.onopen = () => {
      updateStatusBadge(true, state.serverStatus?.isDemo ? 'Demo Mode' : 'Connected to Mac');
    };

    sse.onerror = () => {
      updateStatusBadge(false, 'Reconnecting...');
    };

    sse.addEventListener('new_messages', (event) => {
      try {
        const newMsgs = JSON.parse(event.data);
        handleNewMessages(newMsgs);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    });
  }

  function handleNewMessages(messages) {
    if (!messages || messages.length === 0) return;

    let hasSoundPlayed = false;

    for (const msg of messages) {
      // 1. Update snippet in chat list
      const chat = state.chats.find((c) => c.chat_id === msg.chat_id || c.guid === msg.guid);
      if (chat) {
        chat.last_message = {
          text: msg.text,
          date: msg.date,
          is_from_me: msg.is_from_me,
          sender: msg.sender
        };
        // Move chat to top of list
        state.chats = [chat, ...state.chats.filter((c) => c !== chat)];
      }

      // 2. If it belongs to currently open chat, append to messages
      if (state.activeChat && (state.activeChat.chat_id === msg.chat_id || state.activeChat.guid === msg.guid)) {
        // Check if message is already rendered (e.g. optimistic send)
        const existingIdx = state.messages.findIndex((m) => m.id === msg.id || (m.tempId && m.text === msg.text));
        if (existingIdx !== -1) {
          state.messages[existingIdx] = msg;
        } else {
          state.messages.push(msg);
          appendMessageRow(msg);
          scrollToBottom();
        }

        if (!msg.is_from_me && !hasSoundPlayed) {
          playSound('received');
          hasSoundPlayed = true;
        }
      } else if (!msg.is_from_me && !hasSoundPlayed) {
        playSound('received');
        hasSoundPlayed = true;
      }
    }

    renderChatList();
  }

  // --- Load Conversations ---
  async function loadChats() {
    try {
      const data = await api('/api/chats');
      state.chats = data.chats || [];
      renderChatList();
      if (!state.activeChat && state.chats.length > 0 && window.innerWidth > 768) {
        selectChat(state.chats[0]);
      }
    } catch (err) {
      console.warn('Could not load chats:', err.message);
    }
  }

  // --- Render Conversation List ---
  function renderChatList() {
    const q = state.searchQuery.toLowerCase().trim();
    const filtered = state.chats.filter((c) => {
      if (!q) return true;
      const name = (c.display_name || '').toLowerCase();
      const snippet = (c.last_message?.text || '').toLowerCase();
      const id = (c.chat_identifier || '').toLowerCase();
      return name.includes(q) || snippet.includes(q) || id.includes(q);
    });

    if (filtered.length === 0) {
      chatListEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
          ${q ? 'No conversations found.' : 'No messages yet.'}
        </div>
      `;
      return;
    }

    chatListEl.innerHTML = filtered
      .map((c) => {
        const isActive = state.activeChat && state.activeChat.chat_id === c.chat_id;
        const isSms = c.service_name === 'SMS';
        const isGroup = c.is_group;
        const initials = getInitials(c.display_name);
        const timeStr = c.last_message ? formatTime(c.last_message.date) : '';
        const snippet = c.last_message?.text || (c.last_message ? '📷 Media' : 'No messages');

        return `
          <div class="chat-item ${isActive ? 'active' : ''}" data-id="${c.chat_id}">
            <div class="avatar ${isGroup ? 'group' : isSms ? 'sms' : ''}">${initials}</div>
            <div class="chat-meta">
              <div class="chat-meta-top">
                <span class="chat-name">${escapeHtml(c.display_name)}</span>
                <span class="chat-time">${timeStr}</span>
              </div>
              <div class="chat-meta-bottom">
                <span class="chat-snippet">${escapeHtml(snippet)}</span>
                ${c.unread_count > 0 ? '<span class="badge-unread"></span>' : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach click handlers
    chatListEl.querySelectorAll('.chat-item').forEach((el) => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id, 10);
        const chat = state.chats.find((c) => c.chat_id === id);
        if (chat) selectChat(chat);
      });
    });
  }

  // --- Select & Load Chat History ---
  async function selectChat(chat) {
    state.activeChat = chat;
    renderChatList();

    // Mobile slide transition
    appContainer.classList.add('show-chat');

    // Update Header
    headerAvatar.style.display = 'flex';
    headerAvatar.className = 'avatar ' + (chat.is_group ? 'group' : chat.service_name === 'SMS' ? 'sms' : '');
    headerAvatar.textContent = getInitials(chat.display_name);

    chatTitle.textContent = chat.display_name;
    const count = chat.participants?.length || 1;
    chatSubtitle.textContent = chat.is_group ? `${count} participants` : (chat.chat_identifier || '');

    serviceBadge.style.display = 'inline-block';
    serviceBadge.textContent = chat.service_name || 'iMessage';
    serviceBadge.className = 'pill-service ' + (chat.service_name === 'SMS' ? 'sms' : '');

    inputArea.style.display = 'flex';
    messageInput.placeholder = chat.service_name === 'SMS' ? 'Text Message • SMS' : 'iMessage';
    messageInput.focus();

    // Load messages
    messagesContainer.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading conversation...</div>';

    try {
      const data = await api(`/api/chats/${chat.chat_id}/messages`);
      state.messages = data.messages || [];
      renderMessages();
      scrollToBottom(false);
    } catch (err) {
      messagesContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--danger);">Failed to load messages: ${escapeHtml(err.message)}</div>`;
    }
  }

  // --- Render Messages ---
  function renderMessages() {
    if (state.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💭</div>
          <h3>No messages yet</h3>
          <p>Send a message below to start this conversation.</p>
        </div>
      `;
      return;
    }

    messagesContainer.innerHTML = '';
    let lastDate = null;

    for (const msg of state.messages) {
      const msgDate = new Date(msg.date).toDateString();
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = `<span class="date-badge">${formatDateDivider(msg.date)}</span>`;
        messagesContainer.appendChild(divider);
      }
      appendMessageRow(msg);
    }
  }

  function appendMessageRow(msg) {
    const isOutgoing = msg.is_from_me;
    const isSms = (msg.service || state.activeChat?.service_name) === 'SMS';
    const showSender = !isOutgoing && state.activeChat?.is_group && msg.sender;

    const row = document.createElement('div');
    row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'} ${isSms ? 'sms' : ''}`;
    row.dataset.msgId = msg.id;

    let contentHtml = '';

    // Sender label in group chats
    if (showSender) {
      contentHtml += `<div class="sender-label">${escapeHtml(msg.sender)}</div>`;
    }

    // Attachments
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.mime_type && att.mime_type.startsWith('image/')) {
          const src = att.mockUrl || `/api/attachments/${att.id}`;
          contentHtml += `
            <div class="attachment-card">
              <img src="${src}" class="attachment-img" alt="Photo" onclick="window.iPortLightbox('${src}')">
            </div>
          `;
        } else {
          contentHtml += `
            <div class="attachment-card">
              <a href="/api/attachments/${att.id}" target="_blank" class="attachment-file">
                <span>📎</span>
                <span>${escapeHtml(att.transfer_name || 'Attachment')}</span>
              </a>
            </div>
          `;
        }
      }
    }

    // Text Bubble
    if (msg.text) {
      contentHtml += `<div class="bubble">${escapeHtml(msg.text)}</div>`;
    }

    // Reactions (Tapbacks)
    if (msg.reactions && msg.reactions.length > 0) {
      const uniqueEmojis = [...new Set(msg.reactions.map((r) => r.emoji))].join('');
      contentHtml += `<div class="reactions-badge" title="${msg.reactions.map((r) => r.sender + ': ' + r.emoji).join(', ')}">${uniqueEmojis}</div>`;
    }

    // Delivery indicator for latest outgoing message
    if (isOutgoing && !msg.pending) {
      contentHtml += `<div class="delivery-status">Delivered</div>`;
    } else if (isOutgoing && msg.pending) {
      contentHtml += `<div class="delivery-status">Sending...</div>`;
    }

    row.innerHTML = contentHtml;
    messagesContainer.appendChild(row);
  }

  function formatDateDivider(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function scrollToBottom(smooth = true) {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  // --- Send Message ---
  async function handleSend() {
    const text = messageInput.value.trim();
    if (!text || !state.activeChat) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    btnSend.disabled = true;

    // Optimistic UI display
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: tempId,
      tempId,
      chat_id: state.activeChat.chat_id,
      text,
      date: Date.now(),
      is_from_me: true,
      sender: 'me',
      service: state.activeChat.service_name || 'iMessage',
      pending: true,
      reactions: []
    };

    state.messages.push(optimisticMsg);
    appendMessageRow(optimisticMsg);
    scrollToBottom();
    playSound('sent');

    try {
      await api('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          chatId: state.activeChat.chat_id,
          guid: state.activeChat.guid,
          recipient: state.activeChat.chat_identifier,
          text,
          service: state.activeChat.service_name || 'iMessage'
        })
      });

      // Mark delivered
      const row = messagesContainer.querySelector(`[data-msg-id="${tempId}"]`);
      if (row) {
        const statusEl = row.querySelector('.delivery-status');
        if (statusEl) statusEl.textContent = 'Delivered';
      }
    } catch (err) {
      alert('Failed to send message: ' + err.message);
      const row = messagesContainer.querySelector(`[data-msg-id="${tempId}"]`);
      if (row) {
        const statusEl = row.querySelector('.delivery-status');
        if (statusEl) {
          statusEl.textContent = 'Not Delivered';
          statusEl.style.color = 'var(--danger)';
        }
      }
    }
  }

  // --- Compose New Message ---
  async function handleComposeSubmit() {
    const recipient = composeRecipient.value.trim();
    const text = composeText.value.trim();
    const service = composeService.value;

    if (!recipient || !text) {
      alert('Please enter both a recipient and a message.');
      return;
    }

    btnSubmitCompose.disabled = true;
    btnSubmitCompose.textContent = 'Sending...';

    try {
      await api('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({ recipient, text, service })
      });

      modalCompose.classList.add('hidden');
      composeRecipient.value = '';
      composeText.value = '';
      playSound('sent');

      // Reload chats to show newly started conversation
      setTimeout(loadChats, 600);
    } catch (err) {
      alert('Error sending message: ' + err.message);
    } finally {
      btnSubmitCompose.disabled = false;
      btnSubmitCompose.textContent = 'Send Message';
    }
  }

  // --- Diagnostics Modal ---
  async function openDiagnostics() {
    modalSettings.classList.remove('hidden');
    settingsBody.innerHTML = '<p>Running system diagnostics...</p>';

    try {
      const data = await api('/api/status');
      const diag = data.diagnostics || {};
      const isDemo = data.isDemo;

      settingsBody.innerHTML = `
        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px;">Relay Mode</h4>
          <p>${isDemo ? '🧪 <strong>Demo / Simulation Mode</strong> (Active)' : '⚡ <strong>Live Mac iMessage Relay</strong> (Active)'}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px;">Permissions & System Check</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 6px 0;">
              ${diag.fdaGranted ? '✅' : '❌'} <strong>Full Disk Access:</strong> ${diag.fdaGranted ? 'Granted' : 'Denied or Needs Setup'}
            </li>
            <li style="margin: 6px 0;">
              ${diag.messagesAppRunning ? '✅' : '⚪'} <strong>Messages.app:</strong> ${diag.messagesAppRunning ? 'Running' : 'Stopped (launches automatically when sending)'}
            </li>
            <li style="margin: 6px 0;">
              ${diag.applescriptAvailable ? '✅' : '❌'} <strong>AppleScript (Sending):</strong> ${diag.applescriptAvailable ? 'Available' : 'Unavailable'}
            </li>
          </ul>
        </div>

        ${
          !diag.fdaGranted
            ? `
          <div style="background: rgba(255, 159, 10, 0.1); border: 1px solid rgba(255, 159, 10, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <h4 style="color: var(--warning); margin-bottom: 6px;">How to enable Full Disk Access for Live iMessage:</h4>
            <ol style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
              <li>Open <strong>System Settings</strong> on your Mac.</li>
              <li>Go to <strong>Privacy & Security → Full Disk Access</strong>.</li>
              <li>Toggle ON the switch for <strong>Terminal</strong> (or <strong>iTerm</strong> / <strong>Node</strong>).</li>
              <li>Restart iPort in your terminal.</li>
            </ol>
          </div>
        `
            : ''
        }

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px;">Accessing from Non-Apple Devices</h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
            Open your browser on any phone, Android, PC, or tablet connected to the same Wi-Fi network:
          </p>
          <div class="code-box">http://${window.location.hostname}:${window.location.port || '3000'}</div>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
            💡 <strong>For Remote Access Outside Home:</strong> Use <a href="https://tailscale.com" target="_blank" style="color: var(--accent);">Tailscale</a> (recommended, zero configuration) or Cloudflare Tunnel:
          </p>
          <div class="code-box">cloudflared tunnel --url http://localhost:3000</div>
        </div>
      `;
    } catch (err) {
      settingsBody.innerHTML = `<p style="color: var(--danger);">Failed to load diagnostics: ${escapeHtml(err.message)}</p>`;
    }
  }

  // --- PIN Login ---
  async function handlePinSubmit() {
    const pin = pinInput.value.trim();
    if (!pin) return;

    try {
      await api('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });
      modalPin.classList.add('hidden');
      pinError.style.display = 'none';
      loadChats();
    } catch (err) {
      pinError.textContent = 'Incorrect passcode';
      pinError.style.display = 'block';
    }
  }

  // Lightbox helper
  window.iPortLightbox = function (url) {
    lightboxImg.src = url;
    modalLightbox.classList.remove('hidden');
  };

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Event Listeners ---
  messageInput.addEventListener('input', () => {
    btnSend.disabled = !messageInput.value.trim();
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  btnSend.addEventListener('click', handleSend);

  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderChatList();
  });

  btnBack.addEventListener('click', () => {
    appContainer.classList.remove('show-chat');
  });

  // Modal Triggers
  btnNewChat.addEventListener('click', () => {
    modalCompose.classList.remove('hidden');
    composeRecipient.focus();
  });

  btnCloseCompose.addEventListener('click', () => modalCompose.classList.add('hidden'));
  btnCancelCompose.addEventListener('click', () => modalCompose.classList.add('hidden'));
  btnSubmitCompose.addEventListener('click', handleComposeSubmit);

  btnSettings.addEventListener('click', openDiagnostics);
  diagBanner.addEventListener('click', openDiagnostics);
  btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));
  btnDoneSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));

  btnSubmitPin.addEventListener('click', handlePinSubmit);
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePinSubmit();
  });

  btnCloseLightbox.addEventListener('click', () => modalLightbox.classList.add('hidden'));
  modalLightbox.addEventListener('click', (e) => {
    if (e.target === modalLightbox) modalLightbox.classList.add('hidden');
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === 'Escape') {
      modalCompose.classList.add('hidden');
      modalSettings.classList.add('hidden');
      modalLightbox.classList.add('hidden');
    }
  });

  // --- App Initialization ---
  async function init() {
    await checkServerStatus();
    setupSSE();
    await loadChats();
  }

  init();
})();
