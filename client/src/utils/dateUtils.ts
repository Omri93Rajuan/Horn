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
  // Convert area-1, area-2, etc. to "גזרה 1", "גזרה 2"
  const match = areaId.match(/area-(\d+)/);
  if (match) {
    return `גזרה ${match[1]}`;
  }
  return areaId;
};

export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'OK': 'בסדר',
    'HELP': 'עזרה',
    'PENDING': 'ממתין'
  };
  return statusMap[status] || status;
};
