import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';

let isOnline = true;
let hasShownOfflineAlert = false;

// Monitor network connection
export const initNetworkMonitoring = () => {
  NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? false;

    if (!isOnline && !hasShownOfflineAlert) {
      hasShownOfflineAlert = true;
      Alert.alert(
        'אין חיבור לאינטרנט',
        'נראה שאין לך חיבור אינטרנט. חלק מהפונקציות עלולות לא לעבוד.',
        [
          {
            text: 'אישור',
            onPress: () => {
              hasShownOfflineAlert = false;
            },
          },
        ],
      );
    } else if (isOnline && wasOnline === false) {
      hasShownOfflineAlert = false;
    }
  });
};

export const checkConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

export const getConnectionInfo = async () => {
  return await NetInfo.fetch();
};
