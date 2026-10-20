import React from 'react';
import { ChevronLeft, Users, Pin, PinOff } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { getInitials, getAvatarClass } from '../lib/utils';

export function ChatView({
  activeChat,
  messages,
  connectionStatus,
  onBack,
  onTogglePin,
  onSendMessage,
  onSendAttachment,
  onOpenLightbox
}) {
  if (!activeChat) {
    return (
      <main className="flex-1 hidden md:flex items-center justify-center bg-black text-neutral-600 text-[13.5px] select-none">
        No Conversation Selected
      </main>
    );
  }

  const isGroup = Boolean(activeChat.is_group);
  const initials = getInitials(activeChat.display_name);
  const avatarClass = getAvatarClass(isGroup);

  return (
    <main className="flex-1 flex flex-col h-full bg-black relative min-w-0">
      {/* Chat Header */}
      <header className="h-[52px] px-4 flex items-center justify-between border-b border-white/[0.06] bg-[#161618]/90 backdrop-blur-xl shrink-0 z-10 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="md:hidden -ml-1.5 p-1 text-[#007aff] hover:opacity-80 flex items-center gap-0.5 text-[14px] font-normal active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            <span>Messages</span>
          </button>

          {/* Small Avatar */}
          <div
            className={`
              w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-medium text-[11px]
              border border-white/[0.08] ${avatarClass}
            `}
          >
            {isGroup ? <Users className="w-3.5 h-3.5 text-neutral-300" /> : initials}
          </div>

          {/* Contact Details */}
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-semibold text-neutral-100 truncate tracking-tight leading-tight">
              {activeChat.display_name}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-normal leading-tight">
              <span className="truncate">
                {isGroup
                  ? `${activeChat.participants?.length || 1} people`
                  : activeChat.chat_identifier || ''}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(activeChat)}
              className={`p-1.5 rounded-md transition-colors ${
                activeChat.is_pinned
                  ? 'text-[#007aff] hover:bg-white/[0.06]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title={activeChat.is_pinned ? 'Unpin' : 'Pin to top'}
            >
              {activeChat.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </header>

      {/* Messages Virtualized Scroll Area */}
      <MessageList
        messages={messages}
        isGroup={isGroup}
        onOpenLightbox={onOpenLightbox}
      />

      {/* Message Composer Footer */}
      <MessageInput
        service={activeChat.service_name}
        onSendMessage={onSendMessage}
        onSendAttachment={onSendAttachment}
      />
    </main>
  );
}
