import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '../store';
import {addEvent, setCurrentEvent} from '../store/dataSlice';
import {alertService} from '../services/alertService';
import {NavigationProp} from '@react-navigation/native';

type Props = {
  navigation: NavigationProp<any>;
};

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {currentEvent} = useSelector((state: RootState) => state.data);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleTriggerEvent = async () => {
    if (!user?.areaId) {
      Alert.alert('שגיאה', 'לא נמצא קוד אזור למשתמש');
      return;
    }

    Alert.alert(
      'הקפצת אירוע',
      'האם אתה בטוח שברצונך להקפיץ אירוע לכל המשתמשים באזור?',
      [
        {text: 'ביטול', style: 'cancel'},
        {
          text: 'הקפץ',
          style: 'destructive',
          onPress: async () => {
            setTriggering(true);
            try {
              const event = await alertService.triggerEvent(user.areaId);
              dispatch(addEvent(event));
              dispatch(setCurrentEvent(event));
              Alert.alert('הצלחה', 'האירוע הופץ בהצלחה לכל המשתמשים');
              
              // Navigate to event status
              navigation.navigate('Alerts');
            } catch (error: any) {
              Alert.alert(
                'שגיאה',
                error.response?.data?.message || 'אירעה שגיאה בהקפצת האירוע',
              );
            } finally {
              setTriggering(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>שלום, {user?.name}</Text>
        <Text style={styles.subText}>אזור: {user?.areaId}</Text>
        {user?.phone && (
          <Text style={styles.subText}>טלפון: {user.phone}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>פעולות מהירות</Text>
        
        <TouchableOpacity
          style={[styles.triggerButton, triggering && styles.buttonDisabled]}
          onPress={handleTriggerEvent}
          disabled={triggering}>
          <Icon name="notifications-active" size={32} color="#fff" />
          <View style={styles.triggerButtonText}>
            {triggering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.triggerTitle}>הקפץ אירוע</Text>
                <Text style={styles.triggerSubtitle}>
                  שלח התראה לכל המשתמשים באזור
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {currentEvent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אירוע פעיל</Text>
          <TouchableOpacity
            style={styles.activeEventCard}
            onPress={() => navigation.navigate('Alerts')}>
            <View style={styles.activeEventHeader}>
              <Icon name="event" size={24} color="#FF5722" />
              <Text style={styles.activeEventTitle}>אירוע מתחולל כעת</Text>
            </View>
            <Text style={styles.activeEventTime}>
              {new Date(currentEvent.triggeredAt).toLocaleString('he-IL')}
            </Text>
            <View style={styles.viewStatusButton}>
              <Text style={styles.viewStatusText}>צפה בסטטוס →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ניווט</Text>
        
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Alerts')}>
          <Icon name="notifications" size={24} color="#2196F3" />
          <Text style={styles.navText}>אירועים והיסטוריה</Text>
          <Icon name="chevron-left" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Responses')}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
          <Text style={styles.navText}>התגובות שלי</Text>
          <Icon name="chevron-left" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Profile')}>
          <Icon name="person" size={24} color="#666" />
          <Text style={styles.navText}>פרופיל והגדרות</Text>
          <Icon name="chevron-left" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  subText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
    textAlign: 'right',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
  },
  triggerButton: {
    backgroundColor: '#FF5722',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  triggerButtonText: {
    flex: 1,
    marginRight: 15,
  },
  triggerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  triggerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
    textAlign: 'right',
  },
  activeEventCard: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  activeEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
    marginRight: 10,
  },
  activeEventTime: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 10,
  },
  viewStatusButton: {
    alignItems: 'flex-start',
  },
  viewStatusText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  navCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navText: {
    flex: 1,
    fontSize: 16,
    marginRight: 15,
    textAlign: 'right',
  },
});

export default DashboardScreen;
