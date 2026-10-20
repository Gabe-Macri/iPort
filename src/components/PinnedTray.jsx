import React from 'react';
import { Users, PinOff } from 'lucide-react';
import { getInitials, getAvatarClass } from '../lib/utils';

export function PinnedTray({ pinnedChats, activeChat, onSelectChat, onTogglePin }) {
  if (!pinnedChats || pinnedChats.length === 0) return null;

  return (
    <div className="px-3 pt-2 pb-3.5 border-b border-white/[0.06]">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {pinnedChats.map((chat) => {
          const isActive = activeChat && activeChat.chat_id === chat.chat_id;
          const isGroup = chat.is_group;
          const initials = getInitials(chat.display_name);
          const avatarClass = getAvatarClass(isGroup);

          return (
            <div
              key={chat.chat_id}
              className="group relative flex flex-col items-center cursor-pointer select-none"
              onClick={() => onSelectChat(chat)}
            >
              {/* Avatar Circle */}
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center font-medium text-[15px] shadow-sm
                  border border-white/[0.08] transition-transform duration-100 group-active:scale-95 relative
                  ${avatarClass}
                  ${isActive ? 'ring-2 ring-[#007aff] ring-offset-2 ring-offset-[#161618]' : 'hover:border-white/20'}
                `}
              >
                {isGroup ? <Users className="w-5 h-5 text-neutral-300" /> : initials}

                {/* Unread indicator dot */}
                {chat.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#007aff] ring-2 ring-[#161618]" />
                )}

                {/* Subtle unpin action */}
                {onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(chat);
                    }}
                    className="absolute -bottom-1 -right-1 p-1 bg-[#202022] hover:bg-[#2c2c2e] text-neutral-400 hover:text-white rounded-full shadow border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Unpin conversation"
                  >
                    <PinOff className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Name Label */}
              <span className="text-[11px] text-neutral-300 group-hover:text-white truncate max-w-[72px] mt-1 text-center font-normal tracking-tight">
                {chat.display_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
