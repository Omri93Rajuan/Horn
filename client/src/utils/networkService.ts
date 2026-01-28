let isOnline = navigator.onLine;
let hasShownOfflineAlert = false;

export const initNetworkMonitoring = () => {
  const handleOffline = () => {
    isOnline = false;
    if (!hasShownOfflineAlert) {
      hasShownOfflineAlert = true;
      alert(
        "אין חיבור לאינטרנט. חלק מהפונקציות עלולות לא לעבוד.",
      );
    }
  };

  const handleOnline = () => {
    isOnline = true;
    hasShownOfflineAlert = false;
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);
};

export const checkConnection = async (): Promise<boolean> => {
  return Promise.resolve(navigator.onLine);
};

export const getConnectionInfo = async () => {
  return Promise.resolve({ isOnline, userAgent: navigator.userAgent });
};
