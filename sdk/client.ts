import type {
  ServerStatus,
  GetChatsResponse,
  GetMessagesOptions,
  GetMessagesResponse,
  SendMessageOptions,
  SendMessageResponse,
  TogglePinResponse,
  AuthResponse,
  SSESubscriptionHandlers,
  IPortClientConfig,
  ServiceType
} from './types';

/**
 * Clean, lightweight TypeScript API client for iPort.
 * Works seamlessly in Browser and Node.js environments.
 */
export class IPortClient {
  private baseUrl: string;
  private token: string;
  private customFetch: typeof fetch;
  private customHeaders: Record<string, string>;

  constructor(config: IPortClientConfig = {}) {
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    } else if (typeof window !== 'undefined' && window.location) {
      this.baseUrl = '';
    } else {
      this.baseUrl = 'http://localhost:3000';
    }

    // Initialize token from config or browser storage
    if (config.token) {
      this.token = config.token;
    } else if (config.pin) {
      this.token = config.pin;
    } else if (typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('iport_token') || '';
    } else {
      this.token = '';
    }

    this.customFetch = config.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (null as any));
    this.customHeaders = config.headers || {};
  }

  /**
   * Set or update authorization token / PIN.
   */
  public setToken(token: string): void {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('iport_token', token);
    }
  }

  /**
   * Clear authorization token.
   */
  public clearToken(): void {
    this.token = '';
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('iport_token');
    }
  }

  /**
   * Perform an authenticated JSON request.
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.customFetch) {
      throw new Error('Global fetch is not available in this environment. Please pass custom fetch implementation in config.');
    }

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.customHeaders,
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await this.customFetch(url, {
      ...options,
      headers
    });

    if (res.status === 401) {
      const err = new Error('Unauthorized: PIN passcode required') as any;
      err.status = 401;
      throw err;
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData?.error) message = errorData.error;
      } catch {
        message = res.statusText || message;
      }
      const err = new Error(message) as any;
      err.status = res.status;
      throw err;
    }

    return res.json() as Promise<T>;
  }

  /**
   * Get server status, diagnostics, and relay mode.
   */
  public async getStatus(): Promise<ServerStatus> {
    return this.request<ServerStatus>('/api/status');
  }

  /**
   * Authenticate with a PIN passcode.
   */
  public async login(pin: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
    if (data.success) {
      this.setToken(pin);
    }
    return data;
  }

  /**
   * Fetch recent conversations along with pinned metadata.
   */
  public async getChats(): Promise<GetChatsResponse> {
    return this.request<GetChatsResponse>('/api/chats');
  }

  /**
   * Fetch message history for a specific conversation.
   */
  public async getMessages(
    chatId: string | number,
    options: GetMessagesOptions = {}
  ): Promise<GetMessagesResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.before) params.set('before', String(options.before));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<GetMessagesResponse>(
      `/api/chats/${encodeURIComponent(chatId)}/messages${qs}`
    );
  }

  /**
   * Send an outbound message (iMessage or SMS) via macOS relay.
   */
  public async sendMessage(options: SendMessageOptions): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  /**
   * Convenience shortcut to send a text message directly to a recipient.
   */
  public async sendText(
    recipient: string,
    text: string,
    service: ServiceType = 'iMessage'
  ): Promise<SendMessageResponse> {
    return this.sendMessage({ recipient, text, service });
  }

  /**
   * Toggle pinned state for a conversation.
   */
  public async togglePinChat(chatId: string | number): Promise<TogglePinResponse> {
    return this.request<TogglePinResponse>(
      `/api/chats/${encodeURIComponent(chatId)}/pin`,
      { method: 'POST' }
    );
  }

  /**
   * Generate URL to stream an attachment file.
   */
  public getAttachmentUrl(attachmentId: number | string): string {
    return `${this.baseUrl}/api/attachments/${encodeURIComponent(attachmentId)}`;
  }

  /**
   * Subscribe to real-time events via Server-Sent Events (SSE).
   * Returns an unsubscribe function.
   */
  public subscribe(handlers: SSESubscriptionHandlers): () => void {
    const sseUrl = `${this.baseUrl}/api/events`;

    // 1. Browser EventSource
    if (typeof EventSource !== 'undefined') {
      const es = new EventSource(sseUrl);

      es.onopen = () => {
        handlers.onOpen?.();
      };

      es.onerror = (err) => {
        handlers.onError?.(err);
      };

      es.addEventListener('new_messages', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          handlers.onNewMessages?.(parsed);
        } catch (e) {
          console.error('[iPort SDK] SSE parse error (new_messages):', e);
        }
      });

      es.addEventListener('message_receipt', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          handlers.onReceipt?.(parsed);
        } catch (e) {
          console.error('[iPort SDK] SSE parse error (message_receipt):', e);
        }
      });

      es.addEventListener('pinned_update', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          handlers.onPinnedUpdate?.(parsed);
        } catch (e) {
          console.error('[iPort SDK] SSE parse error (pinned_update):', e);
        }
      });

      return () => {
        es.close();
      };
    }

    // 2. Node.js ReadableStream SSE Reader fallback
    let isAborted = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    const startStream = async () => {
      try {
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          ...this.customHeaders
        };
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await this.customFetch(sseUrl, {
          headers,
          signal: controller?.signal
        });

        if (!res.ok) {
          throw new Error(`SSE stream connection failed: ${res.statusText}`);
        }

        handlers.onOpen?.();

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (!isAborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const chunk of parts) {
            const lines = chunk.split('\n');
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                dataStr = line.replace('data:', '').trim();
              }
            }

            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (eventType === 'new_messages') {
                  handlers.onNewMessages?.(parsed);
                } else if (eventType === 'message_receipt') {
                  handlers.onReceipt?.(parsed);
                } else if (eventType === 'pinned_update') {
                  handlers.onPinnedUpdate?.(parsed);
                }
              } catch (e) {
                // Ignore parse errors on ping
              }
            }
          }
        }
      } catch (err: any) {
        if (!isAborted) {
          handlers.onError?.(err);
        }
      }
    };

    startStream();

    return () => {
      isAborted = true;
      controller?.abort();
    };
  }
}

/**
 * Factory helper to instantiate a typed iPort client.
 */
export function createIPortClient(config?: IPortClientConfig): IPortClient {
  return new IPortClient(config);
}

