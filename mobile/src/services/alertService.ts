import api from './api';
import {AlertEvent, EventStatusResult} from '../types';

export const alertService = {
  // Trigger new event (for commanders)
  triggerEvent: async (areaId: string): Promise<AlertEvent> => {
    const response = await api.post('/alerts/trigger', {areaId});
    return response.data.event;
  },

  // Get all events (history)
  getEvents: async (): Promise<AlertEvent[]> => {
    const response = await api.get('/alerts');
    return response.data.events || [];
  },

  // Get specific event status (who responded, who didn't)
  getEventStatus: async (eventId: string): Promise<EventStatusResult> => {
    const response = await api.get(`/dashboard/event/${eventId}`);
    return response.data.result || response.data;
  },
};
