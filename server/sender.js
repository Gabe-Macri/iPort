import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

const execAsync = promisify(exec);

/**
 * Ensures Messages.app is running in the background.
 */
export async function ensureMessagesRunning() {
  try {
    await execAsync('open -g -a Messages');
  } catch (err) {
    console.warn('[Sender] Warning starting Messages.app:', err.message);
  }
}

/**
 * Executes an AppleScript with arguments safely passed via argv (no string interpolation vulnerabilities).
 */
function runOsascript(script, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('osascript', ['-e', script, '--', ...args]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`osascript failed (code ${code}): ${stderr.trim() || stdout.trim()}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Sends a message via AppleScript.
 * @param {Object} options
 * @param {string} [options.guid] - e.g. "iMessage;-;+15551234567"
 * @param {string} [options.recipient] - phone number or email e.g. "+15551234567"
 * @param {string} options.text - text message content
 * @param {string} [options.service] - "iMessage" or "SMS"
 */
export async function sendMessage({ guid, recipient, text, service = 'iMessage' }) {
  if (!text || !text.trim()) {
    throw new Error('Message text cannot be empty');
  }

  await ensureMessagesRunning();

  // If we have a chat guid, attempt to send directly to that chat
  if (guid) {
    const scriptChat = `
on run argv
  set targetGuid to item 1 of argv
  set msgText to item 2 of argv
  tell application "Messages"
    set targetChat to chat id targetGuid
    send msgText to targetChat
  end tell
end run
`;
    try {
      await runOsascript(scriptChat, [guid, text]);
      return { success: true, method: 'chatGuid', guid };
    } catch (err) {
      console.warn(`[Sender] Chat GUID send failed (${err.message}), attempting recipient fallback...`);
    }
  }

  // Fallback or direct send to recipient handle (phone number or email)
  const targetRecipient = recipient || (guid ? guid.replace(/^[^;]+;[^;]+;/, '') : null);
  if (!targetRecipient) {
    throw new Error('No valid recipient or chat GUID provided');
  }

  const scriptRecipient = `
on run argv
  set targetRecipient to item 1 of argv
  set msgText to item 2 of argv
  set sType to item 3 of argv
  tell application "Messages"
    try
      set targetAccount to 1st account whose service type = iMessage
      if sType is "SMS" then
        set targetAccount to 1st account whose service type = SMS
      end if
      set targetBuddy to participant targetRecipient of targetAccount
      send msgText to targetBuddy
    on error errMsg
      -- Fallback to default buddy search
      set targetBuddy to buddy targetRecipient of (1st service)
      send msgText to targetBuddy
    end try
  end tell
end run
`;

  await runOsascript(scriptRecipient, [targetRecipient, text, service]);
  return { success: true, method: 'recipient', recipient: targetRecipient };
}

/**
 * Sends an attachment (file on disk) to a chat or recipient.
 */
export async function sendAttachment({ guid, recipient, filePath }) {
  await ensureMessagesRunning();

  if (guid) {
    const script = `
on run argv
  set targetGuid to item 1 of argv
  set fPath to item 2 of argv
  tell application "Messages"
    set targetChat to chat id targetGuid
    send (POSIX file fPath) to targetChat
  end tell
end run
`;
    try {
      await runOsascript(script, [guid, filePath]);
      return { success: true, guid };
    } catch (err) {
      console.warn('[Sender] Error sending file to chat GUID:', err.message);
    }
  }

  const targetRecipient = recipient || (guid ? guid.replace(/^[^;]+;[^;]+;/, '') : null);
  const scriptRecipient = `
on run argv
  set targetRecipient to item 1 of argv
  set fPath to item 2 of argv
  tell application "Messages"
    set targetAccount to 1st account whose service type = iMessage
    set targetBuddy to participant targetRecipient of targetAccount
    send (POSIX file fPath) to targetBuddy
  end tell
end run
`;
  await runOsascript(scriptRecipient, [targetRecipient, filePath]);
  return { success: true, recipient: targetRecipient };
}
