class NotificationService {
  configure = async () => {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  localNotification = (title: string, message: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
  };

  cancelAllNotifications = () => {
    return;
  };
}

export default new NotificationService();
