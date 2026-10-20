#  iPort

A **clean, fast, and minimal iMessage web relay** that lets you access, view, and send iMessages and SMS from any device without an Apple device (Android phones, Windows PCs, Linux laptops, Chromebooks, etc.), relayed directly through your Mac.

---

## ✨ Features

- **⚡ Fast & Minimal:** Boots in `< 20ms` using Node.js's built-in native SQLite and standard web protocols.
- **📌 Pinned Conversations:** Apple-style circular avatar pins at the top of the conversation list. Pin or unpin any chat with a single click.
- **👁️ Read Receipts:** Full delivered and read status with exact read timestamps (e.g. `"Read 10:42 AM"`), queried directly from macOS `chat.db` `date_read`.
- **📱 True Cross-Device Web Client:** Neat, minimalist Apple-inspired web interface with deep OLED dark mode, mobile drawer navigation, and PWA (install to home screen).
- **🔄 Real-Time Push Sync:** Instant incoming and outgoing message updates powered by Server-Sent Events (SSE).
- **💬 Full Message Support:**
  - Group chats & 1-on-1 conversations
  - iMessage (Blue) and SMS (Green) distinctions
  - Tapbacks & Reactions (❤️, 👍, 👎, 😂, ‼️, ❓)
  - Photos & Attachment previews with interactive lightbox
  - Contact initials avatars & delivery timestamps
- **🔒 Optional PIN Protection:** Protect your personal messages with a private passcode before opening the relay to local or remote networks.
- **🌐 Remote Access Ready:** Access from anywhere outside home via **Tailscale** (recommended zero-config) or **Cloudflare Tunnel**.

---

## Quick Start

### 1. Launch the Server

In your Mac terminal:

```bash
cd ~/iPort
./start.sh
```

Or with `npm`:

```bash
npm start
```

### 2. Open the Web App

- **On your Mac:** Open [http://localhost:3000](http://localhost:3000)
- **On any phone, Android, or PC on the same Wi-Fi:** Open the **Network URL** displayed in your terminal (e.g., `http://192.168.1.50:3000`).

---

##  Permissions: Enabling Full Disk Access (macOS)

macOS protects your `~/Library/Messages/chat.db` database with Transparency, Consent, and Control (TCC). To let iPort read live conversations, your terminal needs Full Disk Access:

1. Open **System Settings** on your Mac.
2. Navigate to **Privacy & Security** → **Full Disk Access**.
3. Toggle the switch **ON** for your terminal app (e.g., **Terminal**, **iTerm**, or **VS Code**).
4. Restart `./start.sh`.

> **Note:** If Full Disk Access has not been granted yet, iPort automatically runs in **Demo & Simulation Mode** so you can immediately explore the UI, send test messages, view group chats, and check responsiveness while setting up permissions.

---

## Remote Access (Access Outside Home Wi-Fi)

You can easily access your iMessage relay when you are away from home on mobile data or other Wi-Fi networks:

### Option A: Tailscale (Recommended & Most Secure)
1. Install [Tailscale](https://tailscale.com) on your Mac and on your phone / PC.
2. Connect both to your Tailscale network.
3. Open `http://<your-mac-tailscale-name>:3000` from any device anywhere in the world. No port forwarding or public exposure needed.

### Option B: Cloudflare Tunnel (Zero Port-Forwarding Web URL)
1. Install `cloudflared`:
   ```bash
   brew install cloudflared
   ```
2. Run a temporary tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Open the generated `https://xxxx.trycloudflare.com` URL on any device.

---

##  Configuration (.env)

Create a `.env` file to customize settings:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `IPORT_PORT` | `3000` | Port for the web server |
| `IPORT_HOST` | `0.0.0.0` | IP binding (`0.0.0.0` listens on all network interfaces) |
| `IPORT_PIN` | `""` | Optional PIN passcode to lock the web interface |
| `IPORT_POLL_INTERVAL` | `500` | SQLite check interval in milliseconds for new messages |
| `IPORT_DEMO` | `false` | Set to `true` to force demo simulation mode |

---

## 🛠️ Architecture

```
iPort/
├── src/                  # Production React 19 Component Architecture
│   ├── main.jsx          # React DOM entry point
│   ├── App.jsx           # State orchestrator, optimistic UI, SSE real-time sync
│   ├── index.css         # Tailwind directives & Apple design system
│   ├── components/
│   │   ├── Sidebar.jsx       # Header, new chat trigger, search, settings
│   │   ├── ChatList.jsx      # Filtered conversations list with avatars & unread dots
│   │   ├── ChatView.jsx      # Conversation thread header, scroller, input bar
│   │   ├── MessageList.jsx   # TanStack Virtual 60fps virtualization scroller
│   │   ├── MessageRow.jsx    # iMessage/SMS bubbles, photos, Tapback reactions
│   │   ├── MessageInput.jsx  # Auto-expanding composer & attachment button
│   │   ├── NewChatModal.jsx  # Compose modal for new recipient
│   │   ├── SettingsModal.jsx # Live FDA permissions, network and remote access guide
│   │   ├── PinModal.jsx      # PIN authentication lockscreen
│   │   └── LightboxModal.jsx # Full-resolution photo viewer
│   ├── hooks/
│   │   ├── useSSE.js         # Auto-reconnecting Server-Sent Events hook
│   │   └── useAudio.js       # Zero-asset Web Audio Apple synthesizer
│   └── lib/
│       ├── api.js            # Unified typed API client
│       └── utils.js          # Timestamp formatting & avatar helpers
├── dist/                 # Optimized, minified production build (auto-served)
├── server/               # Fast, minimal Node.js backend (< 20ms startup)
│   ├── index.js          # HTTP + SSE server & static file host (prefers dist/)
│   ├── config.js         # Configuration loader & environment variables
│   ├── db.js             # SQLite engine (node:sqlite) for reading chat.db & WAL polling
│   ├── typedstream.js    # NSAttributedString / typedstream binary decoder for rich text
│   ├── sender.js         # AppleScript (osascript) message dispatcher with argv safety
│   ├── diagnostics.js    # TCC / Full Disk Access & system permission auditor
│   └── mockData.js       # Demo data fallback with simulated replies
├── public/               # Static assets (PWA manifest, favicon)
├── vite.config.js        # Vite build & development proxy configuration
├── tailwind.config.js    # Tailwind configuration
└── start.sh              # Quick starter with environment diagnostics
```

---

## 💻 Single-Command Startup & Development

- **🚀 Unified Production Mode (Default - One Command, Port 3000):**
  ```bash
  ./start.sh
  ```
  *(or `npm start`)*
  - Automatically compiles the optimized React 19 production bundle into `dist/`.
  - Automatically launches the backend server on `http://localhost:3000`.
  - Serves both the web client and backend API seamlessly on a single port with gzip compression and immutable asset caching.
  - Zero extra terminal windows or separate steps needed.

- **⚡ Unified Development Mode (One Command with Live HMR):**
  ```bash
  ./start.sh dev
  ```
  *(or `npm run dev`)*
  - Concurrently runs the backend API server on port 3000 AND the Vite live HMR client on port 5173 in a single terminal.
  - A single `Ctrl+C` cleanly terminates both processes.

- **📦 Manual Rebuild (Optional):**
  ```bash
  npm run build
  ```

- **Reading Messages:** Reads directly from `~/Library/Messages/chat.db` in read-only mode (`{ readOnly: true }`), ensuring no locks or interference with the native Messages app.
- **Rich Text Extraction:** Uses `server/typedstream.js` to parse serialized Apple `NSAttributedString` typedstream binary blobs from modern macOS versions where `text` is NULL.
- **Sending Messages:** Passes sanitized parameters through AppleScript via `osascript` argv tokens to communicate directly with macOS Messages service.
- **Real-Time Delivery:** Server-Sent Events push new messages to the web client within milliseconds of insertion into the SQLite Write-Ahead Log.
