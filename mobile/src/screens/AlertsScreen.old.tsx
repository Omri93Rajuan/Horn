import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '../store';
import {setAlerts} from '../store/dataSlice';
import {alertService} from '../services/alertService';
import {Alert} from '../store/dataSlice';

const AlertsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const {alerts} = useSelector((state: RootState) => state.data);

  const loadAlerts = async () => {
    try {
      const data = await alertService.getAlerts();
      dispatch(setAlerts(data));
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '#F44336';
      case 'HIGH':
        return '#FF9800';
      case 'MEDIUM':
        return '#FFC107';
      case 'LOW':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'קריטי';
      case 'HIGH':
        return 'גבוה';
      case 'MEDIUM':
        return 'בינוני';
      case 'LOW':
        return 'נמוך';
      default:
        return severity;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'פעיל';
      case 'INVESTIGATING':
        return 'בטיפול';
      case 'RESOLVED':
        return 'טופל';
      default:
        return status;
    }
  };

  const renderAlert = ({item}: {item: Alert}) => (
    <TouchableOpacity style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View
          style={[
            styles.severityBadge,
            {backgroundColor: getSeverityColor(item.severity)},
          ]}>
          <Text style={styles.severityText}>
            {getSeverityText(item.severity)}
          </Text>
        </View>
        <Icon name="notifications" size={24} color={getSeverityColor(item.severity)} />
      </View>

      <Text style={styles.alertTitle}>{item.title}</Text>
      <Text style={styles.alertDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.alertFooter}>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleString('he-IL')}
        </Text>
      </View>
    </TouchableOpacity>
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
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={64} color="#ccc" />
            <Text style={styles.emptyText}>אין התרעות להצגה</Text>
          </View>
        }
      />
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
  alertCard: {
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
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'right',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'right',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  statusText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
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
});

export default AlertsScreen;
