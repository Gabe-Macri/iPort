import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const execAsync = promisify(exec);

export async function runDiagnostics() {
  const result = {
    platform: process.platform,
    isMac: process.platform === 'darwin',
    dbExists: false,
    fdaGranted: false,
    messagesAppRunning: false,
    applescriptAvailable: false,
    canReadDb: false,
    dbStats: { messageCount: 0, chatCount: 0 },
    error: null,
    help: null
  };

  if (!result.isMac) {
    result.error = 'iPort requires macOS to interface directly with iMessage.';
    return result;
  }

  // 1. Check if chat.db exists
  try {
    result.dbExists = fs.existsSync(config.chatDbPath);
  } catch (err) {
    result.dbExists = false;
    result.error = err.message;
  }

  // 2. Check if we have Full Disk Access to open chat.db
  try {
    const testDb = new DatabaseSync(config.chatDbPath, { readOnly: true });
    const msgCountRow = testDb.prepare('SELECT count(*) as count FROM message').get();
    const chatCountRow = testDb.prepare('SELECT count(*) as count FROM chat').get();
    result.canReadDb = true;
    result.fdaGranted = true;
    result.dbStats = {
      messageCount: msgCountRow ? msgCountRow.count : 0,
      chatCount: chatCountRow ? chatCountRow.count : 0
    };
    testDb.close();
  } catch (err) {
    result.canReadDb = false;
    result.fdaGranted = false;
    result.error = err.message;
    result.help = {
      title: 'Full Disk Access Required',
      steps: [
        'Open macOS System Settings.',
        'Navigate to Privacy & Security → Full Disk Access.',
        'Find your Terminal, iTerm, or the application running iPort and toggle the switch ON.',
        'If running from terminal, you can also add Terminal or Node (/usr/local/bin/node or $(which node)).',
        'Restart iPort after granting access.'
      ]
    };
  }

  // 3. Check if Messages.app is running
  try {
    const { stdout } = await execAsync(
      `osascript -e 'tell application "System Events" to (name of processes) contains "Messages"'`,
      { timeout: 3000 }
    );
    result.messagesAppRunning = stdout.trim() === 'true';
    result.applescriptAvailable = true;
  } catch (err) {
    result.messagesAppRunning = false;
    result.applescriptAvailable = false;
  }

  return result;
}
