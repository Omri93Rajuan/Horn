import React, {useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import {NavigationProp} from "@react-navigation/native";
import {RootState} from "../store";
import {addEvent, setCurrentEvent} from "../store/dataSlice";
import {alertService} from "../services/alertService";
import {borderRadius, colors, fontSize, spacing} from "../utils/theme";

type Props = {
  navigation: NavigationProp<any>;
};

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const [refreshing, setRefreshing] = useState(false);
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
      Alert.alert("שגיאה", "לא נמצא קוד אזור למשתמש");
      return;
    }

    Alert.alert(
      "הקפצת אירוע",
      "האם אתה בטוח שברצונך להקפיץ אירוע לכל המשתמשים באזור?",
      [
        {text: "ביטול", style: "cancel"},
        {
          text: "הקפץ",
          style: "destructive",
          onPress: async () => {
            setTriggering(true);
            try {
              const event = await alertService.triggerEvent(user.areaId);
              dispatch(addEvent(event));
              dispatch(setCurrentEvent(event));
              Alert.alert("הצלחה", "האירוע הופץ בהצלחה לכל המשתמשים");

              navigation.navigate("Alerts");
            } catch (error: any) {
              Alert.alert(
                "שגיאה",
                error.response?.data?.message || "אירעה שגיאה בהקפצת האירוע",
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }>
      <View style={styles.header}>
        <View style={styles.headerDecorOne} />
        <View style={styles.headerDecorTwo} />
        <Text style={styles.welcomeText}>שלום, {user?.name}</Text>
        <Text style={styles.subText}>אזור: {user?.areaId}</Text>
        {user?.phone && <Text style={styles.subText}>טלפון: {user.phone}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>פעולות מהירות</Text>

        <TouchableOpacity
          style={[styles.triggerButton, triggering && styles.buttonDisabled]}
          onPress={handleTriggerEvent}
          disabled={triggering}>
          <Icon name="notifications-active" size={32} color={colors.textInverse} />
          <View style={styles.triggerButtonText}>
            {triggering ? (
              <ActivityIndicator color={colors.textInverse} />
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
            onPress={() => navigation.navigate("Alerts")}>
            <View style={styles.activeEventHeader}>
              <Icon name="event" size={24} color={colors.accent} />
              <Text style={styles.activeEventTitle}>אירוע מתחולל כעת</Text>
            </View>
            <Text style={styles.activeEventTime}>
              {new Date(currentEvent.triggeredAt).toLocaleString("he-IL")}
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
          onPress={() => navigation.navigate("Alerts")}>
          <Icon name="notifications" size={24} color={colors.primary} />
          <Text style={styles.navText}>אירועים והיסטוריה</Text>
          <Icon name="chevron-left" size={24} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate("Responses")}>
          <Icon name="check-circle" size={24} color={colors.success} />
          <Text style={styles.navText}>התגובות שלי</Text>
          <Icon name="chevron-left" size={24} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate("Profile")}>
          <Icon name="person" size={24} color={colors.muted} />
          <Text style={styles.navText}>פרופיל והגדרות</Text>
          <Icon name="chevron-left" size={24} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderBottomLeftRadius: borderRadius.large,
    borderBottomRightRadius: borderRadius.large,
    overflow: "hidden",
  },
  headerDecorOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primarySoft,
    opacity: 0.4,
    top: -60,
    left: -40,
  },
  headerDecorTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.accentSoft,
    opacity: 0.35,
    bottom: -50,
    right: -30,
  },
  welcomeText: {
    fontSize: fontSize.xxlarge,
    fontWeight: "700",
    color: colors.textInverse,
    textAlign: "right",
  },
  subText: {
    fontSize: fontSize.medium,
    color: colors.textInverse,
    opacity: 0.9,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "right",
    color: colors.text,
  },
  triggerButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  triggerButtonText: {
    flex: 1,
    marginRight: spacing.md,
  },
  triggerTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: "700",
    color: colors.textInverse,
    textAlign: "right",
  },
  triggerSubtitle: {
    fontSize: fontSize.medium,
    color: colors.textInverse,
    opacity: 0.9,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  activeEventCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  activeEventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  activeEventTitle: {
    fontSize: fontSize.large,
    fontWeight: "700",
    color: colors.accent,
    marginRight: spacing.sm,
  },
  activeEventTime: {
    fontSize: fontSize.medium,
    color: colors.muted,
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  viewStatusButton: {
    alignItems: "flex-start",
  },
  viewStatusText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: "700",
  },
  navCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  navText: {
    flex: 1,
    fontSize: fontSize.large,
    marginRight: spacing.sm,
    textAlign: "right",
    color: colors.text,
  },
});

export default DashboardScreen;
