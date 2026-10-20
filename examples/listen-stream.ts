/**
 * Example: Subscribing to real-time events (incoming messages & read receipts)
 *
 * Run with:
 *   npx tsx examples/listen-stream.ts
 */
import { createIPortClient, type Message } from '../sdk';

const client = createIPortClient({
  baseUrl: 'http://localhost:3000'
});

console.log('Connecting to iPort real-time event stream...');

const unsubscribe = client.subscribe({
  onOpen: () => {
    console.log('✓ Connected to live iMessage event stream');
  },
  onNewMessages: (messages: Message[]) => {
    for (const msg of messages) {
      const sender = msg.is_from_me ? 'Me' : msg.sender || 'Unknown';
      console.log(`\n[${msg.service}] ${sender}: ${msg.text}`);
    }
  },
  onReceipt: (receipt) => {
    console.log(`[Receipt] Message #${receipt.id} -> ${receipt.status}`);
  },
  onError: (err) => {
    console.error('SSE Error:', err.message || err);
  }
});

// Clean exit on Ctrl+C
process.on('SIGINT', () => {
  console.log('\nClosing SSE subscription...');
  unsubscribe();
  process.exit(0);
});

