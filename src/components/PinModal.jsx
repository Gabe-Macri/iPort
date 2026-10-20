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
      setError('Incorrect passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xs shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-semibold text-neutral-100 text-lg mb-1">Enter Passcode</h3>
        <p className="text-xs text-neutral-400 mb-4">
          This iPort relay is secured. Enter your PIN to view and send messages.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Passcode or PIN"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-center text-sm text-neutral-100 tracking-widest placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-xl transition-all shadow-sm"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

