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

  return (
    <footer className="p-3 bg-neutral-900 border-t border-neutral-800/80 safe-bottom">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full active:scale-95 transition-all shrink-0"
          title="Add Attachment"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Input Box */}
        <div className="flex-1 bg-neutral-800 border border-neutral-700/60 rounded-2xl flex items-center px-3.5 py-1.5 focus-within:border-neutral-500 transition-colors shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSms ? 'Text Message • SMS' : 'iMessage'}
            className="w-full bg-transparent text-[15px] text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none leading-relaxed max-h-[120px]"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim()}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all
            ${
              text.trim()
                ? isSms
                  ? 'bg-emerald-500 text-white active:scale-95'
                  : 'bg-blue-500 text-white active:scale-95'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
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

