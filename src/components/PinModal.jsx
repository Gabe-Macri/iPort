import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export function PinModal({ isOpen, onSubmitPin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');
    try {
      await onSubmitPin(pin.trim());
    } catch {
      setError('Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#101013] border border-white/[0.08] rounded-xl w-full max-w-xs shadow-2xl p-5 text-center animate-in fade-in duration-150">
        <div className="w-8 h-8 bg-zinc-800 text-zinc-300 rounded-md flex items-center justify-center mx-auto mb-2.5 border border-white/[0.08]">
          <Lock className="w-3.5 h-3.5" />
        </div>

        <h3 className="font-mono text-xs font-semibold text-zinc-100 uppercase tracking-wider mb-1">
          Passcode Required
        </h3>
        <p className="text-[11px] text-zinc-400 mb-3.5">
          Enter passcode to authenticate this session.
        </p>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full bg-[#16161a] border border-white/[0.06] rounded-md px-3 py-1.5 text-center font-mono text-sm text-zinc-100 tracking-widest placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />

          {error && <p className="font-mono text-[10px] text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-900 font-mono text-xs font-medium py-1.5 rounded-md transition-all shadow-sm active:scale-95"
          >
            {loading ? 'Authenticating...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
