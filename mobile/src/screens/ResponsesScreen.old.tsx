import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '../store';
import {setResponses} from '../store/dataSlice';
import {responseService} from '../services/responseService';
import {Response} from '../store/dataSlice';

const ResponsesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const {responses} = useSelector((state: RootState) => state.data);

  const loadResponses = async () => {
    try {
      const data = await responseService.getResponses();
      dispatch(setResponses(data));
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadResponses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadResponses();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return '#FFC107';
      case 'RESPONDING':
        return '#2196F3';
      case 'RESOLVED':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return 'התקבל';
      case 'RESPONDING':
        return 'בטיפול';
      case 'RESOLVED':
        return 'טופל';
      default:
        return status;
    }
  };

  const renderResponse = ({item}: {item: Response}) => (
    <View style={styles.responseCard}>
      <View style={styles.responseHeader}>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.status)},
          ]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        <Icon name="check-circle" size={24} color={getStatusColor(item.status)} />
      </View>

      <Text style={styles.alertIdText}>התרעה: {item.alertId.substring(0, 8)}</Text>

      {item.notes && (
        <Text style={styles.notesText} numberOfLines={3}>
          הערות: {item.notes}
        </Text>
      )}

      <Text style={styles.timeText}>
        {new Date(item.createdAt).toLocaleString('he-IL')}
      </Text>
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
        data={responses}
        renderItem={renderResponse}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment-turned-in" size={64} color="#ccc" />
            <Text style={styles.emptyText}>אין תגובות להצגה</Text>
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
  responseCard: {
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
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertIdText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'right',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
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

export default ResponsesScreen;
