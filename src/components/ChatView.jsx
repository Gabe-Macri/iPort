import React from 'react';
import { ChevronLeft, Users, MessageSquare, Pin, PinOff } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { getInitials, getAvatarGradient } from '../lib/utils';

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
      <main className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-black text-neutral-500 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-200">Welcome to iPort</h3>
        <p className="text-sm text-neutral-400 mt-1 max-w-sm">
          Select a conversation from the sidebar to view messages, or compose a new text.
        </p>
      </main>
    );
  }

  const isGroup = Boolean(activeChat.is_group);
  const isSms = activeChat.service_name === 'SMS';
  const gradient = getAvatarGradient(isGroup, isSms);
  const initials = getInitials(activeChat.display_name);

  return (
    <main className="flex-1 flex flex-col h-full bg-black relative min-w-0">
      {/* Chat Header */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-800/80 glass-header shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="md:hidden -ml-2 p-1.5 text-blue-500 hover:text-blue-400 flex items-center gap-0.5 text-sm font-medium active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span>Back</span>
          </button>

          {/* Avatar */}
          <div
            className={`
              w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-semibold text-white text-xs shadow-sm
              bg-gradient-to-tr ${gradient}
            `}
          >
            {isGroup ? <Users className="w-4 h-4 text-white/90" /> : initials}
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-100 truncate tracking-tight">
              {activeChat.display_name}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="truncate">
                {isGroup
                  ? `${activeChat.participants?.length || 1} people`
                  : activeChat.chat_identifier || 'iMessage'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Service Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(activeChat)}
              className={`p-1.5 rounded-full transition-colors ${
                activeChat.is_pinned
                  ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={activeChat.is_pinned ? 'Unpin conversation' : 'Pin conversation to top'}
            >
              {activeChat.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          <span
            className={`
              text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
              ${
                isSms
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }
            `}
          >
            {isSms ? 'SMS' : 'iMessage'}
          </span>
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

