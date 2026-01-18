import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {Platform} from 'react-native';

class NotificationService {
  configure = () => {
    PushNotification.configure({
      onRegister: token => {
        console.log('TOKEN:', token);
      },

      onNotification: notification => {
        console.log('NOTIFICATION:', notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    PushNotification.createChannel(
      {
        channelId: 'horn-alerts',
        channelName: 'Horn Alerts',
        channelDescription: 'Alert notifications from Horn system',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`Channel created: ${created}`),
    );
  };

  localNotification = (title: string, message: string) => {
    PushNotification.localNotification({
      channelId: 'horn-alerts',
      title,
      message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
    });
  };

  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };
}

export default new NotificationService();
