import React, { useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageRow } from './MessageRow';
import { formatDateDivider } from '../lib/utils';
import { MessageCircle } from 'lucide-react';

export function MessageList({ messages, isGroup, onOpenLightbox }) {
  const parentRef = useRef(null);

  // Group items by date dividers for display
  const items = useMemo(() => {
    const list = [];
    let lastDate = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.date).toDateString();
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        list.push({ type: 'divider', date: msg.date, id: `divider-${msgDate}` });
      }
      list.push({ type: 'message', data: msg, id: `msg-${msg.id || msg.tempId}` });
    }
    return list;
  }, [messages]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10
  });

  // Auto-scroll to bottom on message load or new message
  useEffect(() => {
    if (items.length > 0) {
      virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
    }
  }, [items.length, virtualizer]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
        <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
        <h4 className="text-sm font-semibold text-neutral-300">No messages yet</h4>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs">
          Send a message below to start this conversation.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1 select-text scroll-smooth"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;

          return (
            <div
              key={item.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {item.type === 'divider' ? (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-800/90 border border-neutral-700/50 px-3 py-1 rounded-full shadow-sm">
                    {formatDateDivider(item.date)}
                  </span>
                </div>
              ) : (
                <MessageRow
                  message={item.data}
                  isGroup={isGroup}
                  onOpenLightbox={onOpenLightbox}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

