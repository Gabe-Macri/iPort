/**
 * Type definitions for iPort API and data structures.
 */

export type ServiceType = 'iMessage' | 'SMS';

export type ReceiptStatus = 'sent' | 'delivered' | 'read';

export interface Participant {
  id: string;
  name: string;
}

export interface TapbackReaction {
  type: number;
  emoji: string;
  sender: string;
}

export interface Attachment {
  id: number;
  guid?: string;
  mime_type?: string | null;
  transfer_name?: string | null;
  total_bytes?: number | null;
  mockUrl?: string;
}

export interface LastMessage {
  id?: number;
  text: string | null;
  date: number;
  is_from_me: boolean | number;
  sender: string | null;
  status?: ReceiptStatus | null;
  read_at?: number | null;
  delivered_at?: number | null;
}

export interface Chat {
  chat_id: number | string;
  guid: string;
  chat_identifier: string;
  display_name: string;
  service_name: ServiceType;
  is_group: boolean;
  is_pinned?: boolean;
  participants?: Participant[];
  last_message?: LastMessage | null;
  unread_count?: number;
}

export interface Message {
  id: number | string;
  tempId?: string;
  guid?: string;
  chat_id: number | string;
  text: string | null;
  date: number;
  is_from_me: boolean | number;
  sender: string | null;
  service: ServiceType;
  status?: ReceiptStatus | null;
  read_at?: number | null;
  delivered_at?: number | null;
  reactions?: TapbackReaction[];
  attachments?: Attachment[];
  pending?: boolean;
  error?: boolean;
}

export interface SystemDiagnostics {
  fdaGranted: boolean;
  chatDbReadable: boolean;
  messagesAppRunning: boolean;
  applescriptAvailable: boolean;
  nodeVersion: string;
  platform: string;
  osRelease: string;
  arch: string;
  chatCount: number;
  messageCount: number;
}

export interface ServerStatus {
  status: 'ok' | 'error';
  service: string;
  version: string;
  mode: 'api' | 'full';
  isDemo: boolean;
  authRequired: boolean;
  diagnostics: SystemDiagnostics;
}

export interface SendMessageOptions {
  /** Recipient phone number (E.164 e.g. +14155552671) or Apple ID email */
  recipient?: string;
  /** Internal chat_id if sending to an existing conversation */
  chatId?: number | string;
  /** Chat GUID (e.g. iMessage;-;+14155552671 or iMessage;+;chat12345) */
  guid?: string;
  /** Text content of the message */
  text: string;
  /** Service to send through ('iMessage' or 'SMS'). Defaults to 'iMessage'. */
  service?: ServiceType;
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  result?: any;
  demo?: boolean;
  error?: string;
}

export interface GetChatsResponse {
  chats: Chat[];
  pinned: string[];
}

export interface GetMessagesOptions {
  /** Maximum number of messages to fetch (default: 60) */
  limit?: number;
  /** Fetch messages with timestamps earlier than this date in milliseconds */
  before?: number | null;
}

export interface GetMessagesResponse {
  chatId: string | number;
  messages: Message[];
}

export interface TogglePinResponse {
  success: boolean;
  isPinned: boolean;
  pinnedList: string[];
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface SSEEventMap {
  new_messages: Message[];
  message_receipt: {
    id: number | string;
    guid?: string;
    chat_id: number | string;
    status: ReceiptStatus;
    read_at?: number | null;
    delivered_at?: number | null;
  };
  pinned_update: {
    success: boolean;
    isPinned?: boolean;
    pinnedList: string[];
  };
}

export interface SSESubscriptionHandlers {
  onNewMessages?: (messages: Message[]) => void;
  onReceipt?: (receipt: SSEEventMap['message_receipt']) => void;
  onPinnedUpdate?: (update: SSEEventMap['pinned_update']) => void;
  onError?: (err: any) => void;
  onOpen?: () => void;
}

export interface IPortClientConfig {
  /** Base URL for iPort server (e.g. 'http://localhost:3000'). Defaults to current origin in browser or 'http://localhost:3000' in Node. */
  baseUrl?: string;
  /** Security PIN or Passcode if required */
  pin?: string;
  /** Auth token (Bearer token) */
  token?: string;
  /** Custom fetch implementation (useful for Node.js environments or testing) */
  fetch?: typeof fetch;
  /** Additional custom headers to include with requests */
  headers?: Record<string, string>;
}

