import { useEffect } from 'react';
import { api } from '../services/api';

export function useIpcEvent(channel, handler) {
  useEffect(() => api.on(channel, handler), [channel, handler]);
}
