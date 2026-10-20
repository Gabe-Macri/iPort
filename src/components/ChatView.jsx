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
      <main className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#0c0c0e] text-zinc-600 font-mono text-xs select-none">
        <span>No conversation selected</span>
      </main>
    );
  }

  const isGroup = Boolean(activeChat.is_group);
  const initials = getInitials(activeChat.display_name);
  const avatarClass = getAvatarClass(isGroup);

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0c0c0e] relative min-w-0">
      {/* Chat Header */}
      <header className="h-12 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#0e0e11]/90 backdrop-blur-md shrink-0 z-10 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="md:hidden -ml-1 p-1 text-zinc-400 hover:text-white flex items-center gap-0.5 text-xs font-mono active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            <span>List</span>
          </button>

          {/* Squircle Avatar */}
          <div
            className={`
              w-6 h-6 rounded-md shrink-0 flex items-center justify-center font-mono text-[10px] font-semibold
              ${avatarClass}
            `}
          >
            {isGroup ? <Users className="w-3 h-3 text-zinc-300" /> : initials}
          </div>

          {/* Contact Details */}
          <div className="min-w-0">
            <h2 className="text-[13px] font-medium text-zinc-100 truncate tracking-tight leading-tight">
              {activeChat.display_name}
            </h2>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 leading-tight">
              <span className="truncate">
                {isGroup
                  ? `${activeChat.participants?.length || 1} participants`
                  : activeChat.chat_identifier || ''}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="uppercase text-[9px] text-zinc-400">
                {activeChat.service_name || 'iMessage'}
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
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
              }`}
              title={activeChat.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
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
