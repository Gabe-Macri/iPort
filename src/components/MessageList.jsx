import React, { useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageRow } from './MessageRow';
import { formatDateDivider } from '../lib/utils';

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
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-600 font-mono text-xs select-none">
        No messages in this conversation
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
                <div className="font-mono text-[10px] text-zinc-600 text-center select-none py-2.5 uppercase tracking-wider">
                  {formatDateDivider(item.date)}
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

