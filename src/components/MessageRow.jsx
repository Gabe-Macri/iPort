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
        flex flex-col max-w-[78%] sm:max-w-[70%] md:max-w-[65%] mb-2 relative group
        ${isOutgoing ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}
      `}
    >
      {/* Group Chat Sender Name */}
      {showSender && (
        <span className="text-[11px] font-medium text-neutral-400 mb-1 ml-3 tracking-tight">
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
                    className="rounded-2xl overflow-hidden cursor-pointer shadow-md border border-neutral-700/50 hover:opacity-95 transition-opacity max-w-[280px]"
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
                  className="flex items-center gap-2 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 px-3 py-2 rounded-xl text-xs text-neutral-200 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate max-w-[180px] font-medium">
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
              px-3.5 py-2 rounded-[18px] text-[15px] leading-relaxed break-words shadow-sm
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
              absolute -top-2.5 flex items-center gap-0.5 bg-neutral-800/95 border border-neutral-700/80 rounded-full px-1.5 py-0.5 text-xs shadow-md backdrop-blur-sm z-10
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
        <span className="text-[10px] text-neutral-400 mt-1 mr-1 font-medium select-none flex items-center gap-1 tracking-tight">
          {message.pending ? (
            'Sending...'
          ) : message.status === 'read' && message.read_at ? (
            <>
              <span>Read</span>
              <span className="text-neutral-500 font-normal">{formatTime(message.read_at)}</span>
            </>
          ) : (
            'Delivered'
          )}
        </span>
      )}
    </div>
  );
});
