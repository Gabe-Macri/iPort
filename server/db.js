import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';
import { config } from './config.js';
import { parseAttributedBody } from './typedstream.js';
import { mockChats, mockMessages } from './mockData.js';
import { isChatPinned } from './pinnedStorage.js';

export const dbEvents = new EventEmitter();

let dbInstance = null;
let isDemoMode = false;
let pollTimer = null;
let lastMaxRowId = 0;

const REACTION_MAP = {
  2000: '❤️',
  2001: '👍',
  2002: '👎',
  2003: '😂',
  2004: '‼️',
  2005: '❓'
};

/**
 * Parses read receipt status (Delivered vs Read at timestamp) for outgoing messages.
 */
export function parseReceiptStatus(isFromMe, rawDateDelivered, rawDateRead) {
  if (!isFromMe) {
    return { status: null, delivered_at: null, read_at: null };
  }

  const readAt = rawDateRead && rawDateRead !== '0' && rawDateRead !== 'null' ? appleDateToTimestamp(rawDateRead) : null;
  const deliveredAt = rawDateDelivered && rawDateDelivered !== '0' && rawDateDelivered !== 'null' ? appleDateToTimestamp(rawDateDelivered) : null;

  if (readAt) {
    return { status: 'read', delivered_at: deliveredAt, read_at: readAt };
  }
  if (deliveredAt) {
    return { status: 'delivered', delivered_at: deliveredAt, read_at: null };
  }
  return { status: 'delivered', delivered_at: null, read_at: null };
}

/**
 * Converts Apple epoch (nanoseconds since 2001-01-01) to standard Unix milliseconds.
 * Supports strings, BigInts, and numbers to prevent 64-bit integer overflow.
 */
export function appleDateToTimestamp(appleDate) {
  if (!appleDate) return Date.now();
  try {
    const b = typeof appleDate === 'bigint' ? appleDate : BigInt(appleDate);
    // Nanoseconds (> 1e15)
    if (b > 1000000000000000n) {
      return Number(b / 1000000n) + 978307200000;
    }
    // Seconds (< 1e11)
    if (b < 100000000000n) {
      return Number(b * 1000n) + 978307200000;
    }
    // Microseconds
    return Number(b / 1000n) + 978307200000;
  } catch {
    return Date.now();
  }
}

/**
 * Initializes database connection. Falls back to demo mode if chat.db cannot be opened.
 */
export function initDatabase() {
  if (config.forceDemo) {
    console.log('[DB] Running in Demo Mode (forced by configuration).');
    isDemoMode = true;
    return { isDemo: true };
  }

  try {
    if (!fs.existsSync(config.chatDbPath)) {
      console.warn(`[DB] chat.db not found at "${config.chatDbPath}". Falling back to demo mode.`);
      isDemoMode = true;
      return { isDemo: true, reason: 'not_found' };
    }

    dbInstance = new DatabaseSync(config.chatDbPath, { readOnly: true });

    // Test a basic query
    const row = dbInstance.prepare('SELECT MAX(ROWID) as maxId FROM message').get();
    lastMaxRowId = row && row.maxId ? Number(row.maxId) : 0;
    isDemoMode = false;
    console.log(`[DB] Connected to chat.db successfully! Latest message ROWID: ${lastMaxRowId}`);

    // Start background polling for new incoming / outgoing messages
    startPolling();

    return { isDemo: false, lastMaxRowId };
  } catch (err) {
    console.warn(`[DB] Could not open chat.db (${err.message}). Falling back to Demo Mode.`);
    isDemoMode = true;
    return { isDemo: true, reason: 'permission_denied', error: err.message };
  }
}

export function getIsDemoMode() {
  return isDemoMode;
}

/**
 * Retrieves the conversation list with participant details, last message, and service.
 */
export function getChats(limit = 100) {
  if (isDemoMode) {
    return mockChats;
  }

  try {
    const chatsQuery = `
      SELECT 
        c.ROWID as chat_id,
        c.guid,
        c.chat_identifier,
        c.display_name,
        c.service_name,
        (
          SELECT m.ROWID 
          FROM message m
          JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
          WHERE cmj.chat_id = c.ROWID
            AND (m.associated_message_type IS NULL OR m.associated_message_type = 0)
          ORDER BY m.date DESC LIMIT 1
        ) as last_message_id
      FROM chat c
      ORDER BY COALESCE((
        SELECT m.date
        FROM message m
        WHERE m.ROWID = last_message_id
      ), 0) DESC
      LIMIT ?;
    `;

    const chatRows = dbInstance.prepare(chatsQuery).all(limit);
    const chats = [];

    const handleStmt = dbInstance.prepare(`
      SELECT h.id, h.uncanonicalized_id
      FROM handle h
      JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      WHERE chj.chat_id = ?
    `);

    const msgStmt = dbInstance.prepare(`
      SELECT 
        m.ROWID as message_id,
        m.guid,
        m.text,
        m.attributedBody,
        CAST(m.date AS TEXT) as raw_date,
        CAST(m.date_read AS TEXT) as raw_date_read,
        CAST(m.date_delivered AS TEXT) as raw_date_delivered,
        m.is_from_me,
        m.handle_id,
        h.id as sender,
        m.cache_has_attachments,
        m.service
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE m.ROWID = ?
    `);

    for (const row of chatRows) {
      let participants = handleStmt.all(row.chat_id) || [];
      let lastMessage = null;

      if (row.last_message_id) {
        const msgRow = msgStmt.get(row.last_message_id);
        if (msgRow) {
          const body = msgRow.text || parseAttributedBody(msgRow.attributedBody) || (msgRow.cache_has_attachments ? '📷 Attachment' : '');
          const receipt = parseReceiptStatus(msgRow.is_from_me === 1, msgRow.raw_date_delivered, msgRow.raw_date_read);
          lastMessage = {
            id: msgRow.message_id,
            text: body,
            date: appleDateToTimestamp(msgRow.raw_date),
            is_from_me: msgRow.is_from_me === 1,
            sender: msgRow.sender,
            status: receipt.status,
            read_at: receipt.read_at,
            delivered_at: receipt.delivered_at
          };
        }
      }

      // If no participants found in join table, infer from chat_identifier or guid
      if (participants.length === 0) {
        const inferredId = row.chat_identifier || (row.guid ? row.guid.replace(/^[^;]+;[^;]+;/, '') : '');
        if (inferredId && !inferredId.startsWith('chat')) {
          participants = [{ id: inferredId, uncanonicalized_id: inferredId }];
        }
      }

      const isGroup = participants.length > 1 || (row.guid && row.guid.includes(';+;'));
      let displayName = row.display_name;
      if (!displayName || !displayName.trim()) {
        if (participants.length > 0) {
          displayName = participants.map((p) => p.uncanonicalized_id || p.id).join(', ');
        } else {
          displayName = row.chat_identifier || 'Unknown Chat';
        }
      }

      // Only include chats that have had messages or participants
      if (!lastMessage && participants.length === 0) {
        continue;
      }

      const isPinned = isChatPinned(row.chat_id, row.guid, row.chat_identifier);

      chats.push({
        chat_id: row.chat_id,
        guid: row.guid,
        chat_identifier: row.chat_identifier,
        display_name: displayName,
        service_name: row.service_name || (row.guid && row.guid.startsWith('SMS') ? 'SMS' : 'iMessage'),
        is_group: isGroup,
        is_pinned: isPinned,
        participants,
        last_message: lastMessage,
        unread_count: 0
      });
    }

    return chats;
  } catch (err) {
    console.error('[DB] Error getting chats:', err.message);
    return [];
  }
}

/**
 * Retrieves messages for a specific conversation, including reactions and attachment metadata.
 */
export function getMessages(chatId, limit = 60, beforeId = null) {
  if (isDemoMode) {
    const list = mockMessages[chatId] || [];
    return list;
  }

  try {
    let query = `
      SELECT 
        m.ROWID as id,
        m.guid,
        m.text,
        m.attributedBody,
        CAST(m.date AS TEXT) as raw_date,
        CAST(m.date_read AS TEXT) as raw_date_read,
        CAST(m.date_delivered AS TEXT) as raw_date_delivered,
        m.is_from_me,
        m.handle_id,
        h.id as sender,
        m.cache_has_attachments,
        m.service,
        m.associated_message_guid,
        m.associated_message_type
      FROM message m
      JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE cmj.chat_id = ?
    `;

    const params = [chatId];

    if (beforeId) {
      query += ` AND m.ROWID < ? `;
      params.push(beforeId);
    }

    query += ` ORDER BY m.date DESC LIMIT ? `;
    params.push(limit);

    const rows = dbInstance.prepare(query).all(...params);

    // Also fetch any reactions for messages in this batch
    const messageGuids = rows.map((r) => r.guid).filter(Boolean);
    const reactionsByGuid = {};

    if (messageGuids.length > 0) {
      const placeholders = messageGuids.map(() => '?').join(',');
      const reactionsQuery = `
        SELECT 
          m.ROWID as id,
          m.guid,
          m.associated_message_guid,
          m.associated_message_type,
          m.is_from_me,
          h.id as sender
        FROM message m
        LEFT JOIN handle h ON m.handle_id = h.ROWID
        WHERE m.associated_message_guid IN (${placeholders})
          AND m.associated_message_type BETWEEN 2000 AND 2005
        ORDER BY m.date ASC
      `;
      try {
        const reactionRows = dbInstance.prepare(reactionsQuery).all(...messageGuids);
        for (const r of reactionRows) {
          if (!reactionsByGuid[r.associated_message_guid]) {
            reactionsByGuid[r.associated_message_guid] = [];
          }
          reactionsByGuid[r.associated_message_guid].push({
            type: r.associated_message_type,
            emoji: REACTION_MAP[r.associated_message_type] || '👍',
            sender: r.is_from_me ? 'me' : r.sender,
            is_from_me: r.is_from_me === 1
          });
        }
      } catch (err) {
        // Some older schemas may handle associated_message_guid differently
        console.warn('[DB] Reactions query warning:', err.message);
      }
    }

    // Attachments query helper
    const attachmentStmt = dbInstance.prepare(`
      SELECT 
        a.ROWID as id,
        a.guid,
        a.filename,
        a.mime_type,
        a.transfer_name,
        a.total_bytes
      FROM attachment a
      JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
      WHERE maj.message_id = ?
    `);

    const messages = [];

    for (const r of rows) {
      // Skip pure reaction messages from the main conversation flow
      if (r.associated_message_type && r.associated_message_type >= 2000) {
        continue;
      }

      const body = r.text || parseAttributedBody(r.attributedBody) || '';
      let attachments = [];

      if (r.cache_has_attachments) {
        try {
          const attRows = attachmentStmt.all(r.id);
          attachments = attRows.map((att) => ({
            id: att.id,
            mime_type: att.mime_type,
            transfer_name: att.transfer_name,
            total_bytes: att.total_bytes,
            has_file: Boolean(att.filename)
          }));
        } catch (attErr) {
          console.warn('[DB] Error fetching attachments:', attErr.message);
        }
      }

      const receipt = parseReceiptStatus(r.is_from_me === 1, r.raw_date_delivered, r.raw_date_read);

      messages.push({
        id: r.id,
        guid: r.guid,
        chat_id: chatId,
        text: body,
        date: appleDateToTimestamp(r.raw_date),
        is_from_me: r.is_from_me === 1,
        sender: r.sender,
        service: r.service || 'iMessage',
        status: receipt.status,
        read_at: receipt.read_at,
        delivered_at: receipt.delivered_at,
        attachments,
        reactions: reactionsByGuid[r.guid] || []
      });
    }

    // Reverse to chronological order (oldest first, newest last)
    return messages.reverse();
  } catch (err) {
    console.error('[DB] Error getting messages for chat:', chatId, err.message);
    return [];
  }
}

/**
 * Retrieves attachment metadata and file path.
 */
export function getAttachmentInfo(attachmentId) {
  if (isDemoMode) {
    return {
      id: attachmentId,
      filename: null,
      mime_type: 'image/svg+xml',
      transfer_name: 'demo.svg'
    };
  }

  try {
    const row = dbInstance
      .prepare('SELECT ROWID as id, guid, filename, mime_type, transfer_name, total_bytes FROM attachment WHERE ROWID = ?')
      .get(attachmentId);
    return row || null;
  } catch (err) {
    console.error('[DB] Error fetching attachment:', err.message);
    return null;
  }
}

/**
 * Background polling for new messages.
 */
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(() => {
    if (!dbInstance || isDemoMode) return;

    try {
      const maxRow = dbInstance.prepare('SELECT MAX(ROWID) as maxId FROM message').get();
      if (!maxRow || !maxRow.maxId) return;

      const currentMaxId = Number(maxRow.maxId);
      if (currentMaxId > lastMaxRowId) {
        // Query new messages
        const query = `
          SELECT 
            m.ROWID as id,
            m.guid,
            cmj.chat_id,
            m.text,
            m.attributedBody,
            CAST(m.date AS TEXT) as raw_date,
            CAST(m.date_read AS TEXT) as raw_date_read,
            CAST(m.date_delivered AS TEXT) as raw_date_delivered,
            m.is_from_me,
            m.handle_id,
            h.id as sender,
            m.cache_has_attachments,
            m.service,
            m.associated_message_guid,
            m.associated_message_type
          FROM message m
          LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
          LEFT JOIN handle h ON m.handle_id = h.ROWID
          WHERE m.ROWID > ?
          ORDER BY m.ROWID ASC
        `;

        const newRows = dbInstance.prepare(query).all(lastMaxRowId);
        lastMaxRowId = currentMaxId;

        const processed = [];
        for (const r of newRows) {
          const body = r.text || parseAttributedBody(r.attributedBody) || '';
          const receipt = parseReceiptStatus(r.is_from_me === 1, r.raw_date_delivered, r.raw_date_read);
          processed.push({
            id: r.id,
            guid: r.guid,
            chat_id: r.chat_id,
            text: body,
            date: appleDateToTimestamp(r.raw_date),
            is_from_me: r.is_from_me === 1,
            sender: r.sender,
            service: r.service || 'iMessage',
            status: receipt.status,
            read_at: receipt.read_at,
            delivered_at: receipt.delivered_at,
            associated_message_guid: r.associated_message_guid,
            associated_message_type: r.associated_message_type,
            is_reaction: Boolean(r.associated_message_type && r.associated_message_type >= 2000)
          });
        }

        if (processed.length > 0) {
          dbEvents.emit('new_messages', processed);
        }
      }
    } catch (err) {
      // Silence occasional lock contention while iMessage writes WAL
      if (!err.message.includes('busy')) {
        console.warn('[DB] Polling warning:', err.message);
      }
    }
  }, config.pollIntervalMs);
}
