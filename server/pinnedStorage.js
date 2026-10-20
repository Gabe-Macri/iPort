import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_FILE = path.resolve(__dirname, '..', '.iport_pinned.json');

let pinnedSet = new Set();

// Load pinned chats from disk
export function initPinnedStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
      if (Array.isArray(data)) {
        pinnedSet = new Set(data.map(String));
      }
    } else {
      // Default initial pinned mock identifiers if file doesn't exist
      pinnedSet = new Set(['101', 'chat482910482019', 'alex.miller@example.com']);
      savePinnedStorage();
    }
  } catch (err) {
    console.warn('[Pinned] Warning reading pinned storage:', err.message);
    pinnedSet = new Set(['101']);
  }
}

export function savePinnedStorage() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([...pinnedSet], null, 2), 'utf8');
  } catch (err) {
    console.error('[Pinned] Error saving pinned storage:', err.message);
  }
}

export function isChatPinned(chatId, guid, chatIdentifier) {
  if (chatId != null && pinnedSet.has(String(chatId))) return true;
  if (guid && pinnedSet.has(String(guid))) return true;
  if (chatIdentifier && pinnedSet.has(String(chatIdentifier))) return true;
  return false;
}

export function togglePinChat(key) {
  const strKey = String(key);
  let isPinnedNow = false;
  if (pinnedSet.has(strKey)) {
    pinnedSet.delete(strKey);
    isPinnedNow = false;
  } else {
    pinnedSet.add(strKey);
    isPinnedNow = true;
  }
  savePinnedStorage();
  return { isPinned: isPinnedNow, pinnedList: [...pinnedSet] };
}

export function getPinnedList() {
  return [...pinnedSet];
}

initPinnedStorage();

