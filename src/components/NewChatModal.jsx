import React, { useState } from 'react';
import { X, CornerDownLeft } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#101013] border border-white/[0.08] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#141418]">
          <h3 className="font-mono text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            Compose Message
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* To Field */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
              Recipient
            </label>
            <input
              type="text"
              required
              autoFocus
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+14155551234 or email@icloud.com"
              className="w-full bg-[#16161a] border border-white/[0.06] rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
            />
          </div>

          {/* Service Selector */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
              Network Protocol
            </label>
            <div className="flex bg-[#16161a] p-0.5 rounded-md border border-white/[0.06] text-xs font-mono">
              <button
                type="button"
                onClick={() => setService('iMessage')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  service === 'iMessage'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                iMessage (Apple)
              </button>
              <button
                type="button"
                onClick={() => setService('SMS')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  service === 'SMS'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                SMS (Cellular)
              </button>
            </div>
          </div>

          {/* Message Area */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
              Body
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write message contents..."
              className="w-full bg-[#16161a] border border-white/[0.06] rounded-md p-2.5 text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !recipient.trim() || !text.trim()}
              className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-900 font-mono text-xs font-medium rounded shadow transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Sending...' : 'Send'}</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
