import { tStatic } from "../i18n";

const LOCALE_STORAGE_KEY = "horn-locale";

function getLocaleTag() {
  try {
    const locale = localStorage.getItem(LOCALE_STORAGE_KEY) === "en" ? "en" : "he";
    return locale === "en" ? "en-US" : "he-IL";
  } catch {
    return "he-IL";
  }
}

function isEnglishLocale() {
  return getLocaleTag().startsWith("en");
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(getLocaleTag(), {
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
  const en = isEnglishLocale();

  if (diffInSeconds < 60) {
    return en ? "just now" : "עכשיו";
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return en ? `${minutes} minutes ago` : `לפני ${minutes} דקות`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return en ? `${hours} hours ago` : `לפני ${hours} שעות`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  return en ? `${days} days ago` : `לפני ${days} ימים`;
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
  const translated = tStatic(`area.${areaId}`);
  if (translated !== `area.${areaId}`) {
    return translated;
  }

  const match = areaId.match(/area-(\d+)/);
  if (match) {
    return `${tStatic("area.generic")} ${match[1]}`;
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
