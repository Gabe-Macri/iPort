import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, CornerDownLeft } from 'lucide-react';

export function MessageInput({ service, onSendMessage, onSendAttachment }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const isSms = service === 'SMS';

  // Auto-resize textarea as text grows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0] && onSendAttachment) {
      onSendAttachment(files[0]);
    }
  };

  const canSend = Boolean(text.trim());

  return (
    <footer className="p-3 bg-[#0e0e11] border-t border-white/[0.08] safe-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full">
        {/* Hidden File Input for Attachment */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        {/* Professional Composer Box */}
        <div className="bg-[#131316] border border-white/[0.08] rounded-lg focus-within:border-zinc-500 transition-colors shadow-sm overflow-hidden flex flex-col">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSms ? 'Send text message (SMS)...' : 'Send message (iMessage)...'}
            className="w-full bg-transparent text-[13.5px] text-zinc-100 placeholder-zinc-500 px-3 pt-2.5 pb-2 focus:outline-none resize-none leading-relaxed max-h-[140px]"
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-white/[0.04] bg-[#111113]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/[0.06] transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              <span
                className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                  isSms
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                }`}
              >
                {isSms ? 'SMS' : 'iMessage'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-600 hidden sm:inline select-none">
                ↵ to send
              </span>
              <button
                type="submit"
                disabled={!canSend}
                className={`
                  px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-all
                  ${
                    canSend
                      ? 'bg-zinc-100 hover:bg-white text-zinc-900 active:scale-95 shadow-sm'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }
                `}
              >
                <span>Send</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </footer>
  );
}
