import React from 'react';
import { SquarePen, Settings, Search, X, AlertTriangle } from 'lucide-react';
import { ChatList } from './ChatList';

export function Sidebar({
  chats,
  activeChat,
  onSelectChat,
  onTogglePin,
  searchQuery,
  onSearchChange,
  onOpenNewChat,
  onOpenSettings,
  diagnostics,
  isDemo,
  isMobileChatOpen
}) {
  const showFdaWarning = diagnostics && !diagnostics.fdaGranted && !isDemo;

  return (
    <aside
      className={`
        w-full md:w-80 lg:w-96 h-full flex flex-col bg-neutral-900 border-r border-neutral-800/80
        transition-transform duration-200 ease-out z-10 shrink-0
        ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
      `}
    >
      {/* Sidebar Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-800/80 glass-header">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="iPort" className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-lg tracking-tight text-white">iPort</span>
          {isDemo && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Demo
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNewChat}
            className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 rounded-full transition-all"
            title="New Message"
          >
            <SquarePen className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 rounded-full transition-all"
            title="Settings & Diagnostics"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Disk Access Warning Banner */}
      {showFdaWarning && (
        <button
          onClick={onOpenSettings}
          className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-2.5 text-xs flex items-center justify-between hover:bg-amber-500/20 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Full Disk Access Needed</span>
          </div>
          <span className="font-semibold underline">Setup &rarr;</span>
        </button>
      )}

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-neutral-800/90 text-sm text-neutral-100 placeholder-neutral-400 pl-9 pr-8 py-2 rounded-xl border border-neutral-700/60 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList
          chats={chats}
          activeChat={activeChat}
          onSelectChat={onSelectChat}
          onTogglePin={onTogglePin}
          searchQuery={searchQuery}
        />
      </div>
    </aside>
  );
}

