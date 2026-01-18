export type User = {
  id: string;
  name: string;
  areaId: string;
  deviceToken: string;
  createdAt: string;
};

export type AlertEvent = {
  id: string;
  areaId: string;
  triggeredAt: string;
};

export type ResponseStatus = "OK" | "HELP";

export type Response = {
  id: string;
  userId: string;
  eventId: string;
  status: ResponseStatus;
  respondedAt: string;
};
