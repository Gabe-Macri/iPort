import React, { useMemo } from 'react';
import { formatTime, getInitials, getAvatarGradient } from '../lib/utils';
import { Users, MessageSquare, Pin, PinOff } from 'lucide-react';
import { PinnedTray } from './PinnedTray';

export function ChatList({
  chats,
  activeChat,
  onSelectChat,
  onTogglePin,
  searchQuery
}) {
  const isSearching = Boolean(searchQuery && searchQuery.trim());

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!isSearching) return chats;
    const q = searchQuery.toLowerCase().trim();
    return chats.filter((c) => {
      const name = (c.display_name || '').toLowerCase();
      const snippet = (c.last_message?.text || '').toLowerCase();
      const id = (c.chat_identifier || '').toLowerCase();
      return name.includes(q) || snippet.includes(q) || id.includes(q);
    });
  }, [chats, searchQuery, isSearching]);

  // Split into pinned and unpinned when not actively searching
  const { pinnedChats, unpinnedChats } = useMemo(() => {
    if (isSearching) {
      return { pinnedChats: [], unpinnedChats: filteredChats };
    }
    const pinned = filteredChats.filter((c) => c.is_pinned);
    const unpinned = filteredChats.filter((c) => !c.is_pinned);
    return { pinnedChats: pinned, unpinnedChats: unpinned };
  }, [filteredChats, isSearching]);

  if (filteredChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-xs px-4 text-center">
        <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
        <p>{isSearching ? 'No conversations found.' : 'No messages yet.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Pinned Conversations Tray (Apple-style circles) */}
      {!isSearching && pinnedChats.length > 0 && (
        <PinnedTray
          pinnedChats={pinnedChats}
          activeChat={activeChat}
          onSelectChat={onSelectChat}
          onTogglePin={onTogglePin}
        />
      )}

      {/* Standard Conversation Rows */}
      <div className="divide-y divide-neutral-800/40">
        {unpinnedChats.map((chat) => {
          const isActive = activeChat && activeChat.chat_id === chat.chat_id;
          const isSms = chat.service_name === 'SMS';
          const isGroup = chat.is_group;
          const initials = getInitials(chat.display_name);
          const timeStr = chat.last_message ? formatTime(chat.last_message.date) : '';
          const gradient = getAvatarGradient(isGroup, isSms);

          let snippet = chat.last_message?.text || (chat.last_message ? '📷 Attachment' : 'No messages');
          if (chat.last_message?.is_from_me) {
            snippet = `You: ${snippet}`;
          }

          return (
            <div
              key={chat.chat_id}
              onClick={() => onSelectChat(chat)}
              className={`
                group flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors relative
                ${isActive ? 'bg-neutral-800/90' : 'hover:bg-neutral-800/40'}
              `}
            >
              {/* Avatar */}
              <div
                className={`
                  w-11 h-11 rounded-full shrink-0 flex items-center justify-center font-semibold text-white text-sm shadow-sm
                  bg-gradient-to-tr ${gradient}
                `}
              >
                {isGroup ? <Users className="w-5 h-5 text-white/90" /> : initials}
              </div>

              {/* Chat Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="font-semibold text-sm text-neutral-100 truncate tracking-tight">
                    {chat.display_name}
                  </span>
                  <span className="text-[11px] text-neutral-400 shrink-0 ml-2 font-medium">
                    {timeStr}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-neutral-400 truncate max-w-[200px]">
                    {snippet}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Read receipt indicator if read */}
                    {chat.last_message?.is_from_me && chat.last_message?.status === 'read' && (
                      <span className="text-[10px] font-semibold text-blue-400 tracking-tight">
                        Read
                      </span>
                    )}

                    {isSms && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase">
                        SMS
                      </span>
                    )}

                    {chat.unread_count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                    )}

                    {/* Pin button on row hover */}
                    {onTogglePin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(chat);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white rounded transition-opacity"
                        title={chat.is_pinned ? 'Unpin chat' : 'Pin chat to top'}
                      >
                        {chat.is_pinned ? (
                          <PinOff className="w-3.5 h-3.5" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
