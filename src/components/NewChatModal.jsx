import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="h-14 px-5 flex items-center justify-between border-b border-neutral-800">
          <h3 className="font-semibold text-neutral-100 text-base">New Message</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              To: (Phone Number or Apple ID)
            </label>
            <input
              type="text"
              required
              autoFocus
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+1 (555) 123-4567 or user@icloud.com"
              className="w-full bg-neutral-800 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Service
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="iMessage">iMessage (Blue)</option>
              <option value="SMS">SMS (Green)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Message
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-neutral-800 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !recipient.trim() || !text.trim()}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

