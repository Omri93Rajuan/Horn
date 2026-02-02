export type UserRole = "USER" | "COMMANDER";

export interface PublicUser {
  id: string;
  name: string;
  phone?: string;
  areaId: string;
  role?: UserRole;
  commanderAreas?: string[];
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

export interface CommanderAreaStats {
  areaId: string;
  totalEvents: number;
  last30Days: number;
  lastEventAt?: string;
}

export interface CommanderOverview {
  areas: CommanderAreaStats[];
  totalEvents: number;
  totalLast30Days: number;
}

export interface CommanderActiveEvent extends AlertEvent {
  totalUsers: number;
  responded: number;
  pending: number;
  ok: number;
  help: number;
  isComplete: boolean;
  isOverdue: boolean;
}

export interface CommanderActiveArea {
  areaId: string;
  events: CommanderActiveEvent[];
  totalUsers: number;
  responded: number;
  pending: number;
  ok: number;
  help: number;
  isComplete: boolean;
  isOverdue: boolean;
}

export interface CommanderActiveSummary {
  windowMinutes: number;
  areas: CommanderActiveArea[];
  totals: {
    totalUsers: number;
    responded: number;
    pending: number;
    ok: number;
    help: number;
    activeAreas: number;
  };
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalResponses: number;
  responseRate: number;
}
