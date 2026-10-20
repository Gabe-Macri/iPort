/**
 * Frontend typed API helper instance using the iPort TypeScript SDK
 */
import { createIPortClient, type SendMessageOptions } from '../../sdk';

export * from '../../sdk';

export const client = createIPortClient();

export const api = {
  getStatus: () => client.getStatus(),
  login: (pin: string) => client.login(pin),
  getChats: () => client.getChats(),
  getMessages: (chatId: string | number, limit = 60, before: number | null = null) =>
    client.getMessages(chatId, { limit, before }),
  sendMessage: (options: SendMessageOptions) => client.sendMessage(options),
  togglePinChat: (chatId: string | number) => client.togglePinChat(chatId),
  client
};

export default api;

