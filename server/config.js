import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// Try loading .env if it exists
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('[Config] Could not parse .env:', err.message);
  }
}

export const config = {
  port: parseInt(process.env.IPORT_PORT || process.env.PORT || '3000', 10),
  host: process.env.IPORT_HOST || '0.0.0.0',
  pin: process.env.IPORT_PIN || process.env.IPORT_PASSWORD || '',
  chatDbPath: process.env.IPORT_DB_PATH || path.join(os.homedir(), 'Library', 'Messages', 'chat.db'),
  attachmentsPath: process.env.IPORT_ATTACHMENTS_PATH || path.join(os.homedir(), 'Library', 'Messages', 'Attachments'),
  pollIntervalMs: parseInt(process.env.IPORT_POLL_INTERVAL || '500', 10),
  forceDemo: process.env.IPORT_DEMO === 'true' || process.env.IPORT_DEMO === '1'
};
