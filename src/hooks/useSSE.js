import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage real-time Server-Sent Events (SSE) connection with auto-reconnect.
 */
export function useSSE({ onNewMessages, onMessageReceipt, onPinnedUpdate } = {}) {
  const [status, setStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource('/api/events');
    eventSourceRef.current = sse;

    sse.onopen = () => {
      setStatus('connected');
    };

    sse.onerror = () => {
      setStatus('disconnected');
      sse.close();

      // Exponential reconnect backoff
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        setStatus('connecting');
        connect();
      }, 3000);
    };

    sse.addEventListener('new_messages', (event) => {
      try {
        const messages = JSON.parse(event.data);
        if (Array.isArray(messages) && onNewMessages) {
          onNewMessages(messages);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse message event:', err);
      }
    });

    sse.addEventListener('message_receipt', (event) => {
      try {
        const receipt = JSON.parse(event.data);
        if (onMessageReceipt) {
          onMessageReceipt(receipt);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse receipt event:', err);
      }
    });

    sse.addEventListener('pinned_update', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onPinnedUpdate) {
          onPinnedUpdate(payload);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse pinned update event:', err);
      }
    });
  }, [onNewMessages, onMessageReceipt, onPinnedUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [connect]);

  return { status, reconnect: connect };
}

