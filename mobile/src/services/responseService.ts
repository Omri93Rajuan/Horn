import api from './api';
import {Response} from '../types';

export const responseService = {
  // Submit response to event
  submitResponse: async (data: {
    eventId: string;
    status: 'OK' | 'HELP';
    notes?: string;
  }): Promise<Response> => {
    const response = await api.post('/responses', data);
    return response.data;
  },

  // Get my responses history
  getMyResponses: async (): Promise<Response[]> => {
    const response = await api.get('/responses/my');
    return response.data;
  },
};
