export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "עכשיו";
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `לפני ${minutes} דקות`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `לפני ${hours} שעות`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  return `לפני ${days} ימים`;
};

export const formatEventLabel = (dateString: string, action: string): string => {
  return `${action} • ${formatDate(dateString)}`;
};

export const isEventActive = (dateString: string, windowMinutes = 10): boolean => {
  const triggeredAt = new Date(dateString).getTime();
  const now = Date.now();
  return now - triggeredAt <= windowMinutes * 60 * 1000;
};

export const formatAreaName = (areaId: string): string => {
  const areaLabels: Record<string, string> = {
    "jerusalem": "ירושלים והסביבה",
    "gush-dan": "גוש דן",
    "hashfela": "השפלה",
    "hasharon": "השרון",
    "shomron": "השומרון",
    "lakhish": "לכיש",
    "otef-aza": "עוטף עזה",
    "negev": "הנגב",
    "galil-elyon": "גליל עליון",
    "galil-tahton": "גליל תחתון",
    "haifa-krayot": "חיפה והקריות",
    "emek-yizrael": "עמק יזרעאל",
    "arava": "הערבה",
    "eilat": "אילת",
  };

  if (areaLabels[areaId]) {
    return areaLabels[areaId];
  }

  const match = areaId.match(/area-(\d+)/);
  if (match) {
    return `גזרה ${match[1]}`;
  }
  return areaId;
};

export const formatStatus = (status: string): string => {
  if (status === "ALL") return tStatic("status.ALL");
  if (status === "OK") return tStatic("status.OK");
  if (status === "HELP") return tStatic("status.HELP");
  if (status === "PENDING") return tStatic("status.PENDING");
  return status;
};
import { tStatic } from "../i18n";
