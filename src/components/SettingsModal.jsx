import React from 'react';
import { X, CheckCircle2, AlertCircle, Laptop, Wifi, Globe, Terminal } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, diagnostics, isDemo }) {
  if (!isOpen) return null;

  const fdaGranted = diagnostics?.fdaGranted;
  const messagesRunning = diagnostics?.messagesAppRunning;
  const applescriptOk = diagnostics?.applescriptAvailable;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
          <h3 className="font-semibold text-neutral-100 text-base">Server Status & Setup</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Mode Badge */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-800/60 rounded-xl border border-neutral-700/60">
            <div>
              <div className="font-semibold text-neutral-200">Relay Engine</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {isDemo
                  ? 'Demo / Simulation Mode (Mock data)'
                  : 'Live macOS iMessage Relay (Active)'}
              </div>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isDemo
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isDemo ? 'Demo Mode' : 'Live Sync'}
            </span>
          </div>

          {/* Diagnostics Checklist */}
          <div>
            <h4 className="font-semibold text-neutral-300 text-xs uppercase tracking-wider mb-2.5">
              macOS System & Permissions
            </h4>
            <div className="space-y-2 bg-neutral-800/40 p-3 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-neutral-400" />
                  Full Disk Access (chat.db)
                </span>
                <span className="flex items-center gap-1 font-medium">
                  {fdaGranted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Granted</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">Required</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-neutral-400" />
                  AppleScript Dispatcher
                </span>
                <span className="flex items-center gap-1 font-medium">
                  {applescriptOk ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Ready</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">Error</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400" />
                  Messages App
                </span>
                <span className="text-xs text-neutral-400">
                  {messagesRunning ? 'Running' : 'Starts automatically on send'}
                </span>
              </div>
            </div>
          </div>

          {/* FDA Setup instructions if needed */}
          {!fdaGranted && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 space-y-1.5">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                How to enable Full Disk Access:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-amber-200/90 pl-1">
                <li>Open <strong>System Settings</strong> on your Mac.</li>
                <li>Go to <strong>Privacy & Security → Full Disk Access</strong>.</li>
                <li>Toggle ON <strong>Terminal</strong> (or <strong>iTerm</strong> / <strong>Node</strong>).</li>
                <li>Restart iPort in your terminal.</li>
              </ol>
            </div>
          )}

          {/* Accessing Outside Home */}
          <div>
            <h4 className="font-semibold text-neutral-300 text-xs uppercase tracking-wider mb-2.5">
              Access from Non-Apple Devices
            </h4>
            <div className="space-y-3">
              <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2 font-medium text-xs text-neutral-300 mb-1">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  Same Wi-Fi Network
                </div>
                <div className="bg-black/60 px-3 py-1.5 rounded-lg font-mono text-xs text-emerald-400 select-all">
                  http://{window.location.hostname}:{window.location.port || '3000'}
                </div>
              </div>

              <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2 font-medium text-xs text-neutral-300 mb-1">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Anywhere Outside Home (Tailscale or Cloudflare)
                </div>
                <p className="text-xs text-neutral-400 mb-2">
                  Use <strong>Tailscale</strong> (recommended zero-config private mesh) or run a Cloudflare Tunnel:
                </p>
                <div className="bg-black/60 px-3 py-1.5 rounded-lg font-mono text-xs text-neutral-300 select-all">
                  cloudflared tunnel --url http://localhost:3000
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

