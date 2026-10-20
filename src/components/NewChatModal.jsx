import React, { useState } from 'react';
import { X, ArrowUp } from 'lucide-react';

export function NewChatModal({ isOpen, onClose, onStartChat }) {
  const [recipient, setRecipient] = useState('');
  const [service, setService] = useState('iMessage');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient.trim() || !text.trim()) return;

    setLoading(true);
    try {
      await onStartChat({ recipient: recipient.trim(), service, text: text.trim() });
      setRecipient('');
      setText('');
      onClose();
    } catch (err) {
      alert(`Failed to send: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isSms = service === 'SMS';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/[0.06]">
          <h3 className="font-semibold text-white text-[15px] tracking-tight">New Message</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-neutral-400 hover:text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* To Field */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#252528] border border-white/[0.06] rounded-xl focus-within:border-white/20 transition-colors">
            <span className="text-[13px] font-medium text-neutral-400 select-none">To:</span>
            <input
              type="text"
              required
              autoFocus
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Phone number or Apple ID"
              className="flex-1 bg-transparent text-[13.5px] text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* Service Segmented Switch */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Send with
            </span>
            <div className="flex bg-[#252528] p-0.5 rounded-lg border border-white/[0.06] text-[12px]">
              <button
                type="button"
                onClick={() => setService('iMessage')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  service === 'iMessage'
                    ? 'bg-[#007aff] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                iMessage
              </button>
              <button
                type="button"
                onClick={() => setService('SMS')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  service === 'SMS'
                    ? 'bg-[#34c759] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                SMS
              </button>
            </div>
          </div>

          {/* Message Area */}
          <div>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isSms ? 'Text Message' : 'iMessage'}
              className="w-full bg-[#252528] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !recipient.trim() || !text.trim()}
              className={`
                flex items-center gap-1.5 font-medium text-[13px] px-4 py-1.5 rounded-lg transition-all shadow-sm
                ${
                  isSms
                    ? 'bg-[#34c759] hover:bg-[#30b753] text-white'
                    : 'bg-[#007aff] hover:bg-[#0071e3] text-white'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              <span>{loading ? 'Sending...' : 'Send'}</span>
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

