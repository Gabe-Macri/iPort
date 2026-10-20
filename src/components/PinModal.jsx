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
      setError('Incorrect passcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-xs shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-10 h-10 bg-[#2c2c2e] text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/[0.08]">
          <Lock className="w-4 h-4" />
        </div>

        <h3 className="font-semibold text-white text-[16px] mb-1 tracking-tight">Enter Passcode</h3>
        <p className="text-[12px] text-neutral-400 mb-4">
          Enter your passcode to unlock iPort.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Passcode"
            className="w-full bg-[#252528] border border-white/[0.08] rounded-xl px-3.5 py-2 text-center text-[15px] text-white tracking-widest placeholder-neutral-500 focus:outline-none focus:border-white/20 transition-colors"
          />

          {error && <p className="text-[12px] text-rose-400 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full bg-[#007aff] hover:bg-[#0071e3] disabled:opacity-40 text-white font-medium text-[13px] py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

