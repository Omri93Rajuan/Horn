import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '../store';
import {addResponse} from '../store/dataSlice';
import {responseService} from '../services/responseService';
import {borderRadius, colors, fontSize, spacing} from '../utils/theme';

const ResponsesScreen = () => {
  const [responseType, setResponseType] = useState<'OK' | 'HELP' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const {currentEvent} = useSelector((state: RootState) => state.data);

  const handleSubmitResponse = async () => {
    if (!currentEvent) {
      Alert.alert('אין אירוע פעיל', 'אין אירוע פעיל כרגע לדיווח');
      return;
    }

    if (!responseType) {
      Alert.alert('בחר סטטוס', 'נא לבחור האם הכל תקין או נדרשת עזרה');
      return;
    }

    setSubmitting(true);

    try {
      const response = await responseService.submitResponse({
        eventId: currentEvent.id,
        status: responseType,
        notes: notes.trim() || undefined,
      });

      dispatch(addResponse(response));
      Alert.alert('הצלחה', 'התגובה נשלחה בהצלחה');
      setResponseType(null);
      setNotes('');
    } catch (error: any) {
      Alert.alert(
        'שגיאה',
        error.response?.data?.message || 'אירעה שגיאה בשליחת התגובה',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentEvent) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="event-busy" size={64} color={colors.border} />
        <Text style={styles.emptyText}>אין אירוע פעיל כרגע</Text>
        <Text style={styles.emptySubtext}>
          כשיהיה אירוע פעיל, תוכל לדווח כאן
        </Text>
      </View>
    );
  }

  const isOkSelected = responseType === 'OK';
  const isHelpSelected = responseType === 'HELP';

  return (
    <View style={styles.container}>
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Icon name="notifications-active" size={32} color={colors.accent} />
          <Text style={styles.eventTitle}>אירוע פעיל</Text>
        </View>
        <Text style={styles.eventTime}>
          {new Date(currentEvent.triggeredAt).toLocaleString('he-IL')}
        </Text>
        <Text style={styles.eventArea}>אזור: {currentEvent.areaId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>דווח על מצבך</Text>
        <Text style={styles.sectionSubtitle}>
          בחר את הסטטוס המתאים למצבך הנוכחי
        </Text>

        <View style={styles.responseButtons}>
          <TouchableOpacity
            style={[
              styles.responseButton,
              styles.okButton,
              isOkSelected && styles.selectedOk,
            ]}
            onPress={() => setResponseType('OK')}>
            <Icon
              name="check-circle"
              size={48}
              color={isOkSelected ? colors.textInverse : colors.success}
            />
            <Text
              style={[
                styles.responseButtonText,
                isOkSelected && styles.selectedButtonText,
              ]}>
              הכל תקין
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.responseButton,
              styles.helpButton,
              isHelpSelected && styles.selectedHelp,
            ]}
            onPress={() => setResponseType('HELP')}>
            <Icon
              name="error"
              size={48}
              color={isHelpSelected ? colors.textInverse : colors.danger}
            />
            <Text
              style={[
                styles.responseButtonText,
                isHelpSelected && styles.selectedButtonText,
              ]}>
              זקוק לעזרה
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>הערות (אופציונלי)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="הוסף הערות או פרטים נוספים..."
          placeholderTextColor={colors.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlign="right"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!responseType || submitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmitResponse}
        disabled={!responseType || submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Icon name="send" size={24} color={colors.textInverse} />
            <Text style={styles.submitButtonText}>שלח דיווח</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Icon name="info" size={20} color={colors.info} />
        <Text style={styles.infoText}>
          המפקד יקבל את הדיווח שלך ויוכל לראות מי דיווח ומי עדיין לא
        </Text>
      </View>
      </ScrollView>
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
    overflow: 'hidden',
  },
  decorCircleOne: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primarySoft,
    opacity: 0.1,
    top: -70,
    right: -80,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accentSoft,
    opacity: 0.16,
    bottom: -60,
    left: -70,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: fontSize.xlarge,
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.medium,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eventTitle: {
    fontSize: fontSize.xxlarge,
    fontWeight: '700',
    color: colors.accent,
    marginRight: spacing.sm,
  },
  eventTime: {
    fontSize: fontSize.large,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  eventArea: {
    fontSize: fontSize.medium,
    color: colors.muted,
    textAlign: 'right',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'right',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.medium,
    color: colors.muted,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
  },
  okButton: {
    borderColor: colors.success,
  },
  helpButton: {
    borderColor: colors.danger,
  },
  selectedOk: {
    backgroundColor: colors.success,
  },
  selectedHelp: {
    backgroundColor: colors.danger,
  },
  selectedButtonText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  responseButtonText: {
    fontSize: fontSize.large,
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    fontSize: fontSize.large,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.large,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.infoSoft,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.medium,
    color: colors.info,
    marginRight: spacing.sm,
    textAlign: 'right',
  },
});

export default ResponsesScreen;
