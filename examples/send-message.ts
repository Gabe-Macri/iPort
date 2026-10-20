/**
 * Example: Sending an iMessage or SMS using the iPort TypeScript SDK
 *
 * Run with:
 *   npx tsx examples/send-message.ts
 */
import { createIPortClient } from '../sdk';

async function main() {
  const client = createIPortClient({
    baseUrl: 'http://localhost:3000',
    // pin: '1234' // Optional if IPORT_PIN is configured
  });

  console.log('Sending message via iPort relay...');

  try {
    const res = await client.sendText('+14155552671', 'Hello from TypeScript SDK!', 'iMessage');
    console.log('Message sent successfully:', res);
  } catch (err: any) {
    console.error('Failed to send message:', err.message);
  }
}

main();

