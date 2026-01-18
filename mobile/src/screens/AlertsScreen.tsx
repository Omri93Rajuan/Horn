import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '../store';
import {setEvents, setEventStatus, clearEventStatus} from '../store/dataSlice';
import {alertService} from '../services/alertService';
import {AlertEvent, EventStatusItem} from '../types';

const AlertsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AlertEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const dispatch = useDispatch();
  const {events, eventStatus} = useSelector((state: RootState) => state.data);

  const loadEvents = async () => {
    try {
      const data = await alertService.getEvents();
      dispatch(setEvents(data));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleEventPress = async (event: AlertEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
    
    try {
      const status = await alertService.getEventStatus(event.id);
      dispatch(setEventStatus({
        counts: status.counts,
        list: status.list,
      }));
    } catch (error) {
      console.error('Error loading event status:', error);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
    dispatch(clearEventStatus());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return '#4CAF50';
      case 'HELP':
        return '#F44336';
      case 'PENDING':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return 'check-circle';
      case 'HELP':
        return 'error';
      case 'PENDING':
        return 'schedule';
      default:
        return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OK':
        return 'תקין';
      case 'HELP':
        return 'עזרה';
      case 'PENDING':
        return 'ממתין';
      default:
        return status;
    }
  };

  const renderEvent = ({item}: {item: AlertEvent}) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}>
      <View style={styles.eventHeader}>
        <Icon name="event" size={24} color="#2196F3" />
        <Text style={styles.eventTime}>
          {new Date(item.triggeredAt).toLocaleString('he-IL')}
        </Text>
      </View>
      <Text style={styles.eventArea}>אזור: {item.areaId}</Text>
      <View style={styles.viewDetailsButton}>
        <Text style={styles.viewDetailsText}>צפה בפירוט →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStatusItem = ({item}: {item: EventStatusItem}) => (
    <View style={styles.statusItem}>
      <View style={styles.statusItemHeader}>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.responseStatus)},
          ]}>
          <Icon
            name={getStatusIcon(item.responseStatus)}
            size={16}
            color="#fff"
          />
        </View>
        <View style={styles.statusItemInfo}>
          <Text style={styles.statusItemName}>{item.user.name}</Text>
          {item.user.phone && (
            <Text style={styles.statusItemPhone}>{item.user.phone}</Text>
          )}
        </View>
      </View>
      <View style={styles.statusItemFooter}>
        <Text style={[styles.statusText, {color: getStatusColor(item.responseStatus)}]}>
          {getStatusText(item.responseStatus)}
        </Text>
        {item.respondedAt && (
          <Text style={styles.respondedTime}>
            {new Date(item.respondedAt).toLocaleTimeString('he-IL')}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-note" size={64} color="#ccc" />
            <Text style={styles.emptyText}>אין אירועים להצגה</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>סטטוס אירוע</Text>
            <View style={{width: 28}} />
          </View>

          {selectedEvent && (
            <View style={styles.modalEventInfo}>
              <Text style={styles.modalEventTime}>
                {new Date(selectedEvent.triggeredAt).toLocaleString('he-IL')}
              </Text>
              <Text style={styles.modalEventArea}>
                אזור: {selectedEvent.areaId}
              </Text>
            </View>
          )}

          {eventStatus && (
            <View style={styles.statsContainer}>
              <View style={[styles.statBox, {backgroundColor: '#4CAF50'}]}>
                <Text style={styles.statNumber}>{eventStatus.counts.ok}</Text>
                <Text style={styles.statLabel}>תקין</Text>
              </View>
              <View style={[styles.statBox, {backgroundColor: '#F44336'}]}>
                <Text style={styles.statNumber}>{eventStatus.counts.help}</Text>
                <Text style={styles.statLabel}>עזרה</Text>
              </View>
              <View style={[styles.statBox, {backgroundColor: '#FFC107'}]}>
                <Text style={styles.statNumber}>
                  {eventStatus.counts.pending}
                </Text>
                <Text style={styles.statLabel}>ממתינים</Text>
              </View>
            </View>
          )}

          <FlatList
            data={eventStatus?.list || []}
            renderItem={renderStatusItem}
            keyExtractor={(item, index) => `${item.user.id}-${index}`}
            contentContainerStyle={styles.statusList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.emptyText}>טוען נתונים...</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTime: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    textAlign: 'right',
    flex: 1,
  },
  eventArea: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 10,
  },
  viewDetailsButton: {
    alignItems: 'flex-start',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalEventInfo: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  modalEventTime: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  modalEventArea: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-around',
  },
  statBox: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  statusList: {
    padding: 15,
  },
  statusItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statusItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statusItemInfo: {
    flex: 1,
  },
  statusItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statusItemPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  statusItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  respondedTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default AlertsScreen;
