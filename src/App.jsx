import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { NewChatModal } from './components/NewChatModal';
import { SettingsModal } from './components/SettingsModal';
import { PinModal } from './components/PinModal';
import { LightboxModal } from './components/LightboxModal';
import { useSSE } from './hooks/useSSE';
import { useAudio } from './hooks/useAudio';
import { api } from './lib/api';

export function App() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Modals
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const { playSound } = useAudio();

  // Load server status & diagnostics
  const loadStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setDiagnostics(data.diagnostics);
      setIsDemo(Boolean(data.isDemo));
      setIsPinRequired(Boolean(data.authRequired && !localStorage.getItem('iport_token')));
    } catch (err) {
      if (err.status === 401) {
        setIsPinRequired(true);
      }
    }
  }, []);

  // Load conversations
  const loadChats = useCallback(async () => {
    try {
      const data = await api.getChats();
      const chatList = data.chats || [];
      setChats(chatList);

      // On desktop, auto-select first conversation if none selected
      if (!activeChat && chatList.length > 0 && window.innerWidth >= 768) {
        setActiveChat(chatList[0]);
      }
    } catch (err) {
      if (err.status === 401) {
        setIsPinRequired(true);
      }
    }
  }, [activeChat]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    api
      .getMessages(activeChat.chat_id)
      .then((data) => {
        if (isSubscribed) {
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        if (err.status === 401) setIsPinRequired(true);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeChat]);

  // Handle incoming real-time messages from SSE
  const handleNewMessages = useCallback(
    (newMsgs) => {
      if (!newMsgs || newMsgs.length === 0) return;

      let playedSound = false;

      setChats((prevChats) => {
        let updated = [...prevChats];

        for (const msg of newMsgs) {
          const chatIdx = updated.findIndex(
            (c) => c.chat_id === msg.chat_id || c.guid === msg.guid
          );

          if (chatIdx !== -1) {
            const chat = {
              ...updated[chatIdx],
              last_message: {
                text: msg.text,
                date: msg.date,
                is_from_me: msg.is_from_me,
                sender: msg.sender
              }
            };
            // Move to top
            updated = [chat, ...updated.filter((_, idx) => idx !== chatIdx)];
          }

          // If message belongs to active chat, append to messages
          if (
            activeChat &&
            (activeChat.chat_id === msg.chat_id || activeChat.guid === msg.guid)
          ) {
            setMessages((prevMsgs) => {
              const exists = prevMsgs.some(
                (m) => m.id === msg.id || (m.tempId && m.text === msg.text)
              );
              if (exists) {
                return prevMsgs.map((m) =>
                  m.id === msg.id || (m.tempId && m.text === msg.text) ? msg : m
                );
              }
              return [...prevMsgs, msg];
            });
          }

          // Audio notification for incoming texts
          if (!msg.is_from_me && !playedSound) {
            playSound('received');
            playedSound = true;
          }
        }

        return updated;
      });
    },
    [activeChat, playSound]
  );

  // Handle real-time read receipt updates
  const handleMessageReceipt = useCallback((receipt) => {
    if (!receipt) return;
    setMessages((prevMsgs) =>
      prevMsgs.map((m) =>
        m.id === receipt.id || (receipt.guid && m.guid === receipt.guid)
          ? {
              ...m,
              status: receipt.status || 'read',
              read_at: receipt.read_at || Date.now()
            }
          : m
      )
    );

    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.chat_id === receipt.chat_id && c.last_message?.id === receipt.id) {
          return {
            ...c,
            last_message: {
              ...c.last_message,
              status: receipt.status || 'read',
              read_at: receipt.read_at || Date.now()
            }
          };
        }
        return c;
      })
    );
  }, []);

  // Handle real-time pin updates
  const handlePinnedUpdate = useCallback((payload) => {
    if (!payload?.pinnedList) return;
    const pinnedSet = new Set(payload.pinnedList.map(String));
    setChats((prev) =>
      prev.map((c) => ({
        ...c,
        is_pinned:
          pinnedSet.has(String(c.chat_id)) ||
          (c.guid && pinnedSet.has(String(c.guid))) ||
          (c.chat_identifier && pinnedSet.has(String(c.chat_identifier)))
      }))
    );
  }, []);

  const { status: sseStatus } = useSSE({
    onNewMessages: handleNewMessages,
    onMessageReceipt: handleMessageReceipt,
    onPinnedUpdate: handlePinnedUpdate
  });

  // Toggle pin conversation
  const handleTogglePin = useCallback(
    async (chat) => {
      if (!chat) return;
      const targetId = chat.chat_id || chat.guid || chat.chat_identifier;

      setChats((prev) =>
        prev.map((c) =>
          c.chat_id === chat.chat_id ? { ...c, is_pinned: !c.is_pinned } : c
        )
      );
      if (activeChat && activeChat.chat_id === chat.chat_id) {
        setActiveChat((prev) => (prev ? { ...prev, is_pinned: !prev.is_pinned } : prev));
      }

      try {
        await api.togglePinChat(targetId);
      } catch (err) {
        console.error('Failed to toggle pin:', err);
        loadChats();
      }
    },
    [activeChat, loadChats]
  );

  // Send message handler with optimistic UI
  const handleSendMessage = useCallback(
    async (text) => {
      if (!activeChat || !text.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        tempId,
        chat_id: activeChat.chat_id,
        text,
        date: Date.now(),
        is_from_me: true,
        sender: 'me',
        service: activeChat.service_name || 'iMessage',
        pending: true,
        reactions: []
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      playSound('sent');

      try {
        await api.sendMessage({
          chatId: activeChat.chat_id,
          guid: activeChat.guid,
          recipient: activeChat.chat_identifier,
          text,
          service: activeChat.service_name || 'iMessage'
        });

        // Mark as confirmed
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, pending: false } : m))
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, error: true } : m))
        );
        alert(`Failed to send message: ${err.message}`);
      }
    },
    [activeChat, playSound]
  );

  // Send new conversation handler
  const handleStartChat = useCallback(
    async ({ recipient, text, service }) => {
      playSound('sent');
      await api.sendMessage({ recipient, text, service });
      setTimeout(loadChats, 500);
    },
    [playSound, loadChats]
  );

  // PIN Unlock
  const handleUnlockPin = useCallback(
    async (pin) => {
      await api.login(pin);
      localStorage.setItem('iport_token', pin);
      setIsPinRequired(false);
      loadStatus();
      loadChats();
    },
    [loadStatus, loadChats]
  );

  const handleSelectChat = useCallback((chat) => {
    setActiveChat(chat);
    setIsMobileChatOpen(true);
  }, []);

  const handleBackToSidebar = useCallback(() => {
    setIsMobileChatOpen(false);
  }, []);

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadStatus();
    loadChats();
  }, [loadStatus, loadChats]);

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-black text-neutral-100 font-sans">
      {/* Sidebar (Conversations) */}
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onTogglePin={handleTogglePin}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        diagnostics={diagnostics}
        isDemo={isDemo}
        isMobileChatOpen={isMobileChatOpen}
      />

      {/* Main Chat View */}
      <ChatView
        activeChat={activeChat}
        messages={messages}
        connectionStatus={sseStatus}
        onBack={handleBackToSidebar}
        onTogglePin={handleTogglePin}
        onSendMessage={handleSendMessage}
        onOpenLightbox={(src) => setLightboxSrc(src)}
      />

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStartChat={handleStartChat}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        diagnostics={diagnostics}
        isDemo={isDemo}
      />

      <PinModal
        isOpen={isPinRequired}
        onSubmitPin={handleUnlockPin}
      />

      <LightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

