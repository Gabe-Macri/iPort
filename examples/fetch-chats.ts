/**
 * Example: Fetching conversations and paginated messages with typed models
 *
 * Run with:
 *   npx tsx examples/fetch-chats.ts
 */
import { createIPortClient } from '../sdk';

async function main() {
  const client = createIPortClient({
    baseUrl: 'http://localhost:3000'
  });

  // 1. Fetch server health and permissions
  const status = await client.getStatus();
  console.log(`Server: ${status.service} v${status.version} (${status.mode} mode)`);
  console.log(`Full Disk Access: ${status.diagnostics.fdaGranted ? 'Granted' : 'Demo/Not Granted'}`);

  // 2. Fetch conversations
  const { chats, pinned } = await client.getChats();
  console.log(`\nFound ${chats.length} conversations (${pinned.length} pinned):`);

  for (const chat of chats.slice(0, 5)) {
    console.log(`- [${chat.service_name}] ${chat.display_name} (ID: ${chat.chat_id})`);
    if (chat.last_message) {
      console.log(`    Last: "${chat.last_message.text}"`);
    }
  }

  // 3. Fetch messages for the first conversation
  if (chats.length > 0) {
    const firstChat = chats[0];
    const { messages } = await client.getMessages(firstChat.chat_id, { limit: 5 });
    console.log(`\nLast 5 messages for "${firstChat.display_name}":`);
    for (const m of messages) {
      const sender = m.is_from_me ? 'You' : m.sender || 'Other';
      console.log(`  ${sender}: ${m.text}`);
    }
  }
}

main().catch(console.error);

