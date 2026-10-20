import React from 'react';
import { Users, PinOff } from 'lucide-react';
import { getInitials, getAvatarGradient } from '../lib/utils';

export function PinnedTray({ pinnedChats, activeChat, onSelectChat, onTogglePin }) {
  if (!pinnedChats || pinnedChats.length === 0) return null;

  return (
    <div className="px-3 pt-1 pb-3 border-b border-neutral-800/60">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {pinnedChats.map((chat) => {
          const isActive = activeChat && activeChat.chat_id === chat.chat_id;
          const isGroup = chat.is_group;
          const isSms = chat.service_name === 'SMS';
          const gradient = getAvatarGradient(isGroup, isSms);
          const initials = getInitials(chat.display_name);

          return (
            <div
              key={chat.chat_id}
              className="group relative flex flex-col items-center cursor-pointer select-none"
              onClick={() => onSelectChat(chat)}
            >
              {/* Avatar Bubble */}
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center font-semibold text-white text-base shadow-md
                  bg-gradient-to-tr ${gradient} transition-transform duration-150 group-active:scale-95 relative
                  ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-900' : 'hover:opacity-90'}
                `}
              >
                {isGroup ? <Users className="w-6 h-6 text-white/90" /> : initials}

                {/* Unread indicator */}
                {chat.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-neutral-900 shadow" />
                )}

                {/* Unpin button on hover */}
                {onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(chat);
                    }}
                    className="absolute -bottom-1 -right-1 p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-full shadow border border-neutral-700/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Unpin conversation"
                  >
                    <PinOff className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Chat Name */}
              <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white truncate max-w-[76px] mt-1.5 text-center tracking-tight">
                {chat.display_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

