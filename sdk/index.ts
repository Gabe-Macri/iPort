/**
 * iPort TypeScript SDK & API Helpers
 */

export * from './types';
export * from './client';

// Default export is the client factory
import { createIPortClient, IPortClient } from './client';
export default createIPortClient;
export { createIPortClient, IPortClient };

