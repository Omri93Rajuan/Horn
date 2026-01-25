import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import {RootState} from "../store";
import {
  setEvents,
  setEventStatus,
  clearEventStatus,
} from "../store/dataSlice";
import {alertService} from "../services/alertService";
import {AlertEvent, EventStatusItem} from "../types";
import {borderRadius, colors, fontSize, spacing} from "../utils/theme";

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
      console.error("Error loading events:", error);
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
      dispatch(
        setEventStatus({
          counts: status.counts,
          list: status.list,
        }),
      );
    } catch (error) {
      console.error("Error loading event status:", error);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
    dispatch(clearEventStatus());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
        return colors.success;
      case "HELP":
        return colors.danger;
      case "PENDING":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK":
        return "check-circle";
      case "HELP":
        return "error";
      case "PENDING":
        return "schedule";
      default:
        return "help";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OK":
        return "תקין";
      case "HELP":
        return "עזרה";
      case "PENDING":
        return "ממתין";
      default:
        return status;
    }
  };

  const renderEvent = ({item}: {item: AlertEvent}) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}>
      <View style={styles.eventHeader}>
        <Icon name="event" size={24} color={colors.primary} />
        <Text style={styles.eventTime}>
          {new Date(item.triggeredAt).toLocaleString("he-IL")}
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
            color={colors.textInverse}
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
        <Text
          style={[
            styles.statusText,
            {color: getStatusColor(item.responseStatus)},
          ]}>
          {getStatusText(item.responseStatus)}
        </Text>
        {item.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
        {item.respondedAt && (
          <Text style={styles.respondedTime}>
            {new Date(item.respondedAt).toLocaleTimeString("he-IL")}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
      </View>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-note" size={64} color={colors.border} />
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
              <Icon name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>סטטוס אירוע</Text>
            <View style={{width: 28}} />
          </View>

          {selectedEvent && (
            <View style={styles.modalEventInfo}>
              <Text style={styles.modalEventTime}>
                {new Date(selectedEvent.triggeredAt).toLocaleString("he-IL")}
              </Text>
              <Text style={styles.modalEventArea}>
                אזור: {selectedEvent.areaId}
              </Text>
            </View>
          )}

          {eventStatus && (
            <View style={styles.statsContainer}>
              <View style={[styles.statBox, {backgroundColor: colors.success}]}>
                <Text style={styles.statNumber}>{eventStatus.counts.ok}</Text>
                <Text style={styles.statLabel}>תקין</Text>
              </View>
              <View style={[styles.statBox, {backgroundColor: colors.danger}]}>
                <Text style={styles.statNumber}>{eventStatus.counts.help}</Text>
                <Text style={styles.statLabel}>עזרה</Text>
              </View>
              <View style={[styles.statBox, {backgroundColor: colors.warning}]}>
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
                <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  decorCircleOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primarySoft,
    opacity: 0.12,
    top: -60,
    left: -90,
  },
  decorCircleTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accentSoft,
    opacity: 0.18,
    bottom: -50,
    right: -60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  eventTime: {
    fontSize: fontSize.large,
    fontWeight: "700",
    marginRight: spacing.sm,
    textAlign: "right",
    flex: 1,
    color: colors.text,
  },
  eventArea: {
    fontSize: fontSize.medium,
    color: colors.muted,
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  viewDetailsButton: {
    alignItems: "flex-start",
  },
  viewDetailsText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: fontSize.large,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xxlarge,
    fontWeight: "700",
    color: colors.text,
  },
  modalEventInfo: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  modalEventTime: {
    fontSize: fontSize.large,
    fontWeight: "700",
    textAlign: "right",
    color: colors.text,
  },
  modalEventArea: {
    fontSize: fontSize.medium,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  statsContainer: {
    flexDirection: "row",
    padding: spacing.md,
    justifyContent: "space-around",
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: "center",
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    fontSize: fontSize.xxxlarge,
    fontWeight: "700",
    color: colors.textInverse,
  },
  statLabel: {
    fontSize: fontSize.medium,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  statusList: {
    padding: spacing.md,
  },
  statusItem: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  statusItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  statusItemInfo: {
    flex: 1,
  },
  statusItemName: {
    fontSize: fontSize.large,
    fontWeight: "700",
    textAlign: "right",
    color: colors.text,
  },
  statusItemPhone: {
    fontSize: fontSize.medium,
    color: colors.muted,
    marginTop: 2,
    textAlign: "right",
  },
  statusItemFooter: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  statusText: {
    fontSize: fontSize.medium,
    fontWeight: "700",
  },
  notesText: {
    fontSize: fontSize.small,
    color: colors.muted,
    marginTop: spacing.xs,
    fontStyle: "italic",
    textAlign: "right",
  },
  respondedTime: {
    fontSize: fontSize.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});

export default AlertsScreen;
