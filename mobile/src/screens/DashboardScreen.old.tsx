import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store';
import {setStats} from '../store/dataSlice';
import {dashboardService} from '../services/dashboardService';

const DashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const {stats} = useSelector((state: RootState) => state.data);
  const {user} = useSelector((state: RootState) => state.auth);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getStats();
      dispatch(setStats(data));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          שלום, {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.subText}>סקירה כללית של המערכת</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalAlerts || 0}</Text>
          <Text style={styles.statLabel}>סה"כ התרעות</Text>
        </View>

        <View style={[styles.statCard, styles.activeCard]}>
          <Text style={[styles.statNumber, styles.whiteText]}>
            {stats?.activeAlerts || 0}
          </Text>
          <Text style={[styles.statLabel, styles.whiteText]}>
            התרעות פעילות
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.resolvedAlerts || 0}</Text>
          <Text style={styles.statLabel}>התרעות שטופלו</Text>
        </View>

        <View style={[styles.statCard, styles.rateCard]}>
          <Text style={[styles.statNumber, styles.whiteText]}>
            {stats?.responseRate || 0}%
          </Text>
          <Text style={[styles.statLabel, styles.whiteText]}>אחוז תגובה</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>פעילות אחרונה</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>
            טען את הדף כדי לראות פעילות עדכנית
          </Text>
        </View>
      </View>
    </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    margin: '1%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeCard: {
    backgroundColor: '#FF5722',
  },
  rateCard: {
    backgroundColor: '#4CAF50',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  whiteText: {
    color: '#fff',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
