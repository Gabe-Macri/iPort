import React from 'react';
import { Plus, Settings, Search, X, AlertTriangle } from 'lucide-react';
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
        w-full md:w-80 lg:w-[320px] h-full flex flex-col bg-[#0e0e11] border-r border-white/[0.08]
        transition-transform duration-150 ease-out z-10 shrink-0 select-none
        ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
      `}
    >
      {/* Top Window Bar */}
      <div className="h-12 px-3.5 flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-semibold tracking-tight text-zinc-100">
            iPort
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/[0.06]">
            <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {isDemo ? 'demo' : 'relay'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {showFdaWarning && (
            <button
              onClick={onOpenSettings}
              className="p-1 text-amber-400 hover:text-amber-300 rounded hover:bg-white/[0.06] transition-colors"
              title="Full Disk Access Required"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenNewChat}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-white/[0.06] active:scale-95 transition-all"
            title="Compose message"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-white/[0.06] active:scale-95 transition-all"
            title="Settings & API"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-2 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#141417] text-[12px] text-zinc-200 placeholder-zinc-500 pl-8 pr-12 py-1.5 rounded-md border border-white/[0.06] focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <span className="absolute right-2 font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-1 py-0.5 rounded border border-white/[0.06] pointer-events-none">
              ⌘K
            </span>
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
