import React from 'react';
import { Users, X } from 'lucide-react';
import { getInitials, getAvatarClass } from '../lib/utils';

export function PinnedTray({ pinnedChats, activeChat, onSelectChat, onTogglePin }) {
  if (!pinnedChats || pinnedChats.length === 0) return null;

  return (
    <div className="px-3 pt-1.5 pb-2 border-b border-white/[0.06]">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Pinned
        </span>
        <span className="font-mono text-[10px] text-zinc-600">
          {pinnedChats.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pinnedChats.map((chat) => {
          const isActive = activeChat && activeChat.chat_id === chat.chat_id;
          const isGroup = chat.is_group;
          const initials = getInitials(chat.display_name);
          const avatarClass = getAvatarClass(isGroup);

          return (
            <div
              key={chat.chat_id}
              onClick={() => onSelectChat(chat)}
              className={`
                group flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-md cursor-pointer select-none text-[12px] transition-all border
                ${
                  isActive
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-[#141417] text-zinc-300 border-white/[0.06] hover:bg-zinc-800/80 hover:text-white'
                }
              `}
            >
              {/* Squircle Avatar */}
              <div
                className={`
                  w-4 h-4 rounded-[4px] shrink-0 flex items-center justify-center font-mono text-[9px] font-medium
                  ${avatarClass}
                `}
              >
                {isGroup ? <Users className="w-2.5 h-2.5" /> : initials.slice(0, 1)}
              </div>

              {/* Name */}
              <span className="truncate max-w-[105px] font-medium tracking-tight">
                {chat.display_name}
              </span>

              {/* Unread dot */}
              {chat.unread_count > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}

              {/* Unpin icon */}
              {onTogglePin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(chat);
                  }}
                  className="opacity-0 group-hover:opacity-100 -mr-1 p-0.5 text-zinc-400 hover:text-white transition-opacity"
                  title="Unpin"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
