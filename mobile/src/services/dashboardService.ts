import api from './api';
import {EventStatusResult} from '../types';

export const dashboardService = {
  // Get event status (who responded, counts)
  getEventStatus: async (eventId: string): Promise<EventStatusResult> => {
    const response = await api.get(`/dashboard/event/${eventId}`);
    return response.data.result || response.data;
  },

  // Get recent events
  getRecentEvents: async () => {
    const response = await api.get('/alerts');
    return response.data.events || response.data;
  },
};
