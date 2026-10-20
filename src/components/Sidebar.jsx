import React from 'react';
import { SquarePen, Settings, Search, X, AlertCircle } from 'lucide-react';
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
        w-full md:w-80 lg:w-[340px] h-full flex flex-col bg-[#161618] border-r border-white/[0.07]
        transition-transform duration-200 ease-out z-10 shrink-0 select-none
        ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
      `}
    >
      {/* Top Window Bar */}
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h1 className="text-[19px] font-bold tracking-tight text-white">Messages</h1>
        </div>

        <div className="flex items-center gap-1">
          {showFdaWarning && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-amber-400 hover:text-amber-300 rounded-md hover:bg-white/[0.06] transition-colors"
              title="Full Disk Access Required"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenNewChat}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] active:scale-95 transition-all"
            title="New Message"
          >
            <SquarePen className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] active:scale-95 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#202022] text-[13px] text-neutral-100 placeholder-neutral-500 pl-8 pr-7 py-1.5 rounded-lg border border-white/[0.04] focus:outline-none focus:bg-[#28282a] focus:border-white/10 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-neutral-500 hover:text-neutral-300 p-0.5"
            >
              <X className="w-3 h-3" />
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
