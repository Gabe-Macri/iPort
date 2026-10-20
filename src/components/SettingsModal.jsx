import React from 'react';
import { X, Check, AlertTriangle, Laptop, Terminal, MessageSquare, Wifi, Globe, Server, Code } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, diagnostics, isDemo }) {
  if (!isOpen) return null;

  const fdaGranted = diagnostics?.fdaGranted;
  const messagesRunning = diagnostics?.messagesAppRunning;
  const applescriptOk = diagnostics?.applescriptAvailable;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#101013] border border-white/[0.08] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-in fade-in duration-150">
        {/* Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#141418] shrink-0">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-400" />
            <h3 className="font-mono text-xs font-semibold text-zinc-100 uppercase tracking-wider">
              System Settings & API Engine
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-[12.5px]">
          {/* Deployment Mode Card */}
          <div>
            <div className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
              <Code className="w-3 h-3" />
              <span>Deployment Modes</span>
            </div>
            <div className="bg-[#16161a] border border-white/[0.06] rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-zinc-200">Current Deployment Mode</div>
                  <div className="text-[11px] text-zinc-400">
                    Full-Stack: Serving Web App and REST API simultaneously
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                  Web + API
                </span>
              </div>

              <div className="border-t border-white/[0.04] pt-2 text-[11px] text-zinc-400 space-y-1.5">
                <div className="text-zinc-300 font-medium">CLI Deployment Commands:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10.5px]">
                  <div className="bg-[#0e0e11] p-2 rounded border border-white/[0.04]">
                    <div className="text-zinc-400 font-semibold mb-0.5">Strict Headless API:</div>
                    <code className="text-emerald-400 select-all">./start.sh api</code>
                  </div>
                  <div className="bg-[#0e0e11] p-2 rounded border border-white/[0.04]">
                    <div className="text-zinc-400 font-semibold mb-0.5">Full-Stack (Both):</div>
                    <code className="text-blue-400 select-all">./start.sh full</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System & Permissions */}
          <div>
            <div className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
              <Laptop className="w-3 h-3" />
              <span>macOS Host Permissions</span>
            </div>
            <div className="bg-[#16161a] border border-white/[0.06] rounded-lg divide-y divide-white/[0.04]">
              {/* Full Disk Access */}
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-zinc-300">Full Disk Access (chat.db)</span>
                {fdaGranted ? (
                  <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Granted
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Required
                  </span>
                )}
              </div>

              {/* AppleScript */}
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-zinc-300">AppleScript Sender</span>
                <span className="font-mono text-[11px]">
                  {applescriptOk ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Available
                    </span>
                  ) : (
                    <span className="text-rose-400">Unavailable</span>
                  )}
                </span>
              </div>

              {/* Messages App */}
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-zinc-300">Messages App State</span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {messagesRunning ? 'Running' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* FDA Setup steps if needed */}
          {!fdaGranted && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-zinc-300 space-y-1">
              <div className="font-medium text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Enable Full Disk Access for your Terminal:</span>
              </div>
              <ol className="list-decimal list-inside text-zinc-400 text-[11px] space-y-0.5 pl-1 leading-relaxed">
                <li>Open <strong>System Settings → Privacy & Security → Full Disk Access</strong>.</li>
                <li>Allow <strong>Terminal</strong> (or iTerm / VS Code).</li>
                <li>Restart iPort in your terminal.</li>
              </ol>
            </div>
          )}

          {/* Network Access */}
          <div>
            <div className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <span>Network Endpoints</span>
            </div>
            <div className="bg-[#16161a] border border-white/[0.06] rounded-lg p-3 space-y-2.5">
              <div>
                <div className="text-zinc-400 text-[11px] mb-1">Local Network URL:</div>
                <div className="bg-[#0e0e11] px-2.5 py-1 rounded font-mono text-[11px] text-zinc-200 select-all border border-white/[0.04]">
                  http://{window.location.hostname}:{window.location.port || '3000'}
                </div>
              </div>

              <div>
                <div className="text-zinc-400 text-[11px] mb-1">Remote Access (Tailscale / Cloudflare):</div>
                <div className="bg-[#0e0e11] px-2.5 py-1 rounded font-mono text-[11px] text-zinc-400 select-all border border-white/[0.04]">
                  cloudflared tunnel --url http://localhost:3000
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#141418] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-200 hover:bg-white text-zinc-900 font-mono text-xs font-medium rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
