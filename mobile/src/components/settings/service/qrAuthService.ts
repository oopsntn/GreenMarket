import { api } from '../../../config/api';

export const qrAuthService = {
  scan: async (sessionId: string) => {
    const response = await api.post('/auth/qr/scan', { sessionId });
    return response.data;
  },
  authorize: async (sessionId: string) => {
    const response = await api.post('/auth/qr/authorize', { sessionId });
    return response.data;
  },
};
