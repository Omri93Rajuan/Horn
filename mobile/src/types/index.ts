export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  areaId: string;
  deviceToken?: string;
}

export interface AlertEvent {
  id: string;
  areaId: string;
  triggeredAt: string;
  triggeredByUserId?: string;
}

export type ResponseStatus = 'OK' | 'HELP' | 'PENDING';

export interface Response {
  id: string;
  userId: string;
  eventId: string;
  status: ResponseStatus;
  notes?: string;
  respondedAt: string;
}

export interface EventStatusItem {
  user: User;
  responseStatus: ResponseStatus;
  notes?: string;
  respondedAt?: string;
}

export interface EventStatusResult {
  event: AlertEvent;
  counts: {
    ok: number;
    help: number;
    pending: number;
  };
  list: EventStatusItem[];
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalResponses: number;
  responseRate: number;
}
