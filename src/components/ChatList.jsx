import React, { useMemo } from 'react';
import { formatTime, getInitials, getAvatarClass } from '../lib/utils';
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

  // Split into pinned and unpinned when not searching
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
      <div className="flex flex-col items-center justify-center h-40 text-zinc-500 text-xs px-4 text-center">
        <MessageSquare className="w-5 h-5 mb-2 opacity-40" />
        <p className="text-zinc-500 font-mono text-[11px]">{isSearching ? 'No results found' : 'No conversations'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Pinned Tray */}
      {!isSearching && pinnedChats.length > 0 && (
        <PinnedTray
          pinnedChats={pinnedChats}
          activeChat={activeChat}
          onSelectChat={onSelectChat}
          onTogglePin={onTogglePin}
        />
      )}

      {/* Conversation List */}
      <div className="px-2 pt-1.5 space-y-0.5">
        {unpinnedChats.map((chat) => {
          const isActive = activeChat && activeChat.chat_id === chat.chat_id;
          const isGroup = chat.is_group;
          const initials = getInitials(chat.display_name);
          const avatarClass = getAvatarClass(isGroup);
          const timeStr = chat.last_message ? formatTime(chat.last_message.date) : '';

          let snippet = chat.last_message?.text || (chat.last_message ? 'Attachment' : 'No messages');
          if (chat.last_message?.is_from_me) {
            snippet = `You: ${snippet}`;
          }

          return (
            <div
              key={chat.chat_id}
              onClick={() => onSelectChat(chat)}
              className={`
                group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors relative
                ${
                  isActive
                    ? 'bg-zinc-800/90 text-white border-l-2 border-blue-500 pl-2'
                    : 'hover:bg-zinc-900/80 text-zinc-300'
                }
              `}
            >
              {/* Squircle Avatar */}
              <div
                className={`
                  w-7 h-7 rounded-md shrink-0 flex items-center justify-center font-mono text-[10px] font-semibold
                  ${avatarClass}
                `}
              >
                {isGroup ? <Users className="w-3.5 h-3.5 text-zinc-300" /> : initials}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="font-medium text-[13px] text-zinc-100 truncate tracking-tight">
                    {chat.display_name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 shrink-0 ml-1.5 font-normal">
                    {timeStr}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11.5px] text-zinc-400 truncate max-w-[180px] leading-tight font-normal">
                    {snippet}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Read receipt text in list if read */}
                    {chat.last_message?.is_from_me && chat.last_message?.status === 'read' && (
                      <span className="font-mono text-[9px] text-zinc-500">
                        Read
                      </span>
                    )}

                    {/* Unread indicator */}
                    {chat.unread_count > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}

                    {/* Pin Action on Hover */}
                    {onTogglePin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(chat);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-white rounded transition-opacity"
                        title={chat.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        {chat.is_pinned ? (
                          <PinOff className="w-3 h-3" />
                        ) : (
                          <Pin className="w-3 h-3" />
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
