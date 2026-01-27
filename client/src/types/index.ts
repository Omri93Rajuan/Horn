export interface PublicUser {
  id: string;
  name: string;
  phone?: string;
  areaId: string;
  deviceToken?: string;
  createdAt?: string;
}

export interface AuthUser extends PublicUser {
  email?: string;
}

export interface AlertEvent {
  id: string;
  areaId: string;
  triggeredAt: string;
  triggeredByUserId?: string;
}

export type ResponseStatus = "OK" | "HELP" | "PENDING";

export interface Response {
  id: string;
  userId: string;
  eventId: string;
  status: ResponseStatus;
  notes?: string;
  respondedAt: string;
}

export interface MyResponse {
  id: string;
  eventId: string;
  status: ResponseStatus;
  notes?: string;
  respondedAt: string;
  event?: AlertEvent;
}

export interface EventStatusItem {
  user: PublicUser;
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