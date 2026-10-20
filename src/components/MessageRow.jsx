import React, { memo } from 'react';
import { Paperclip } from 'lucide-react';
import { formatTime } from '../lib/utils';

export const MessageRow = memo(function MessageRow({ message, isGroup, onOpenLightbox }) {
  const isOutgoing = Boolean(message.is_from_me);
  const isSms = message.service === 'SMS';
  const showSender = !isOutgoing && isGroup && message.sender;

  return (
    <div
      className={`
        flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] mb-2 relative group
        ${isOutgoing ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}
      `}
    >
      {/* Group Chat Sender Name */}
      {showSender && (
        <span className="font-mono text-[10px] text-zinc-500 mb-0.5 ml-1 font-medium tracking-tight">
          {message.sender}
        </span>
      )}

      {/* Bubble Container */}
      <div className="relative">
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-1.5 mb-1.5">
            {message.attachments.map((att) => {
              const isImage = att.mime_type && att.mime_type.startsWith('image/');
              const src = att.mockUrl || `/api/attachments/${att.id}`;

              if (isImage) {
                return (
                  <div
                    key={att.id}
                    onClick={() => onOpenLightbox(src)}
                    className="rounded-lg overflow-hidden cursor-pointer shadow border border-white/[0.08] hover:opacity-95 transition-opacity max-w-[320px]"
                  >
                    <img
                      src={src}
                      alt={att.transfer_name || 'Attachment'}
                      className="w-full max-h-72 object-cover"
                      loading="lazy"
                    />
                  </div>
                );
              }

              return (
                <a
                  key={att.id}
                  href={`/api/attachments/${att.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#18181b] hover:bg-zinc-800 border border-white/[0.08] px-3 py-2 rounded-lg text-xs text-zinc-200 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[200px] font-mono text-[11px]">
                    {att.transfer_name || 'File Attachment'}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {/* Text Message Bubble */}
        {message.text && (
          <div
            className={`
              px-3 py-2 text-[13.5px] leading-relaxed break-words shadow-sm
              ${
                isOutgoing
                  ? isSms
                    ? 'bubble-outgoing-sms'
                    : 'bubble-outgoing-imessage'
                  : 'bubble-incoming'
              }
            `}
          >
            {message.text}
          </div>
        )}

        {/* Tapbacks (Reactions) Badge */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`
              absolute -top-2 flex items-center gap-0.5 bg-[#202024] border border-white/[0.1] rounded px-1.5 py-0.5 text-xs shadow-sm z-10
              ${isOutgoing ? '-left-2' : '-right-2'}
            `}
            title={message.reactions.map((r) => `${r.sender}: ${r.emoji}`).join(', ')}
          >
            {[...new Set(message.reactions.map((r) => r.emoji))].join('')}
          </div>
        )}
      </div>

      {/* Delivery / Read Status Indicator */}
      {isOutgoing && (
        <span className="font-mono text-[9px] text-zinc-500 mt-1 mr-1 select-none flex items-center gap-1 tracking-tight">
          {message.pending ? (
            'sending...'
          ) : message.status === 'read' && message.read_at ? (
            <>
              <span>read</span>
              <span className="text-zinc-600">{formatTime(message.read_at)}</span>
            </>
          ) : (
            'delivered'
          )}
        </span>
      )}
    </div>
  );
});
