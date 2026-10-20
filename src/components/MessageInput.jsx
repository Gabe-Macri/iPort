import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus } from 'lucide-react';

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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
    <footer className="p-3 bg-[#161618] border-t border-white/[0.06] safe-bottom">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
        {/* Hidden File Input for Attachment */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-8 h-8 rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0 mb-0.5 active:scale-95"
          title="Add Attachment"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Input Capsule */}
        <div className="flex-1 bg-[#1c1c1e] border border-white/[0.08] rounded-[20px] flex items-end px-3.5 py-1.5 focus-within:border-white/20 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSms ? 'Text Message' : 'iMessage'}
            className="w-full bg-transparent text-[15px] text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed max-h-[120px] py-0.5"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all
            ${
              canSend
                ? isSms
                  ? 'bg-[#34c759] text-white active:scale-95 shadow-sm'
                  : 'bg-[#007aff] text-white active:scale-95 shadow-sm'
                : 'bg-[#242426] text-neutral-600 cursor-not-allowed opacity-50'
            }
          `}
          title="Send"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </footer>
  );
}

