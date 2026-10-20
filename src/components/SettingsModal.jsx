import React from 'react';
import { X, Check, AlertTriangle, Laptop, Terminal, MessageSquare, Wifi, Globe } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, diagnostics, isDemo }) {
  if (!isOpen) return null;

  const fdaGranted = diagnostics?.fdaGranted;
  const messagesRunning = diagnostics?.messagesAppRunning;
  const applescriptOk = diagnostics?.applescriptAvailable;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <h3 className="font-semibold text-white text-[15px] tracking-tight">Settings</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-neutral-400 hover:text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5 text-[13px]">
          {/* Service Mode */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-1.5">
              Service
            </div>
            <div className="bg-[#252528] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Relay Mode</div>
                  <div className="text-[11px] text-neutral-400">
                    {isDemo
                      ? 'Simulated environment'
                      : 'Live macOS Messages database'}
                  </div>
                </div>
                <span className="text-[12px] font-medium text-neutral-300">
                  {isDemo ? 'Demo Mode' : 'Live Sync'}
                </span>
              </div>
            </div>
          </div>

          {/* System Permissions */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-1.5">
              Permissions & Status
            </div>
            <div className="bg-[#252528] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.06]">
              {/* Full Disk Access */}
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-neutral-200">
                  <Laptop className="w-4 h-4 text-neutral-400" />
                  <span>Full Disk Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {fdaGranted ? (
                    <span className="text-[12px] text-neutral-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-[#34c759]" />
                      Granted
                    </span>
                  ) : (
                    <span className="text-[12px] text-amber-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Required
                    </span>
                  )}
                </div>
              </div>

              {/* AppleScript */}
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-neutral-200">
                  <Terminal className="w-4 h-4 text-neutral-400" />
                  <span>AppleScript Sender</span>
                </div>
                <span className="text-[12px] text-neutral-300 flex items-center gap-1">
                  {applescriptOk ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#34c759]" />
                      Available
                    </>
                  ) : (
                    <span className="text-rose-400">Unavailable</span>
                  )}
                </span>
              </div>

              {/* Messages App */}
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-neutral-200">
                  <MessageSquare className="w-4 h-4 text-neutral-400" />
                  <span>Messages App</span>
                </div>
                <span className="text-[12px] text-neutral-400">
                  {messagesRunning ? 'Running' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Full Disk Access Setup Steps if needed */}
          {!fdaGranted && (
            <div className="bg-[#252528] border border-amber-500/20 rounded-xl p-3.5 text-[12px] text-neutral-300 space-y-1.5">
              <div className="font-medium text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Enable Full Disk Access on this Mac
              </div>
              <ol className="list-decimal list-inside space-y-1 text-neutral-400 pl-1 leading-relaxed">
                <li>Open <strong>System Settings</strong> on your Mac.</li>
                <li>Navigate to <strong>Privacy & Security → Full Disk Access</strong>.</li>
                <li>Allow <strong>Terminal</strong> (or <strong>iTerm</strong> / <strong>Node</strong>).</li>
                <li>Restart iPort in your terminal.</li>
              </ol>
            </div>
          )}

          {/* Remote Access */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-1.5">
              Network Access
            </div>
            <div className="bg-[#252528] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.06]">
              {/* Local Network */}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-200 font-medium">
                  <Wifi className="w-4 h-4 text-neutral-400" />
                  <span>Local Network</span>
                </div>
                <div className="bg-[#18181a] px-3 py-1.5 rounded-lg font-mono text-[11.5px] text-neutral-300 select-all border border-white/[0.04]">
                  http://{window.location.hostname}:{window.location.port || '3000'}
                </div>
              </div>

              {/* Remote / Tailscale */}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-200 font-medium">
                  <Globe className="w-4 h-4 text-neutral-400" />
                  <span>Outside Home Network</span>
                </div>
                <p className="text-[11.5px] text-neutral-400">
                  Use <strong>Tailscale</strong> (recommended) or a Cloudflare Tunnel:
                </p>
                <div className="bg-[#18181a] px-3 py-1.5 rounded-lg font-mono text-[11.5px] text-neutral-300 select-all border border-white/[0.04]">
                  cloudflared tunnel --url http://localhost:3000
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#007aff] hover:bg-[#0071e3] text-white font-medium text-[13px] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

