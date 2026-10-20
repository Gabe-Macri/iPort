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
      <div className="flex flex-col items-center justify-center h-40 text-neutral-500 text-xs px-4 text-center">
        <MessageSquare className="w-6 h-6 mb-2 opacity-30" />
        <p className="text-neutral-500">{isSearching ? 'No results found.' : 'No conversations.'}</p>
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
                group flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer transition-colors relative
                ${isActive ? 'bg-[#2c2c2e]' : 'hover:bg-[#202022] active:bg-[#262628]'}
              `}
            >
              {/* Avatar */}
              <div
                className={`
                  w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-medium text-xs
                  border border-white/[0.06] ${avatarClass}
                `}
              >
                {isGroup ? <Users className="w-4 h-4 text-neutral-300" /> : initials}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="font-semibold text-[13.5px] text-neutral-100 truncate tracking-tight">
                    {chat.display_name}
                  </span>
                  <span className="text-[11px] text-neutral-500 shrink-0 ml-2 font-normal">
                    {timeStr}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[12.5px] text-neutral-400 truncate max-w-[200px] leading-tight font-normal">
                    {snippet}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Read receipt text in list if read */}
                    {chat.last_message?.is_from_me && chat.last_message?.status === 'read' && (
                      <span className="text-[10px] text-neutral-500 font-normal">
                        Read
                      </span>
                    )}

                    {/* Unread indicator */}
                    {chat.unread_count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#007aff]" />
                    )}

                    {/* Pin Action on Hover */}
                    {onTogglePin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(chat);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white rounded transition-opacity"
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
