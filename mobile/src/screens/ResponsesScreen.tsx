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

const ResponsesScreen = () => {
  const [responseType, setResponseType] = useState<'OK' | 'HELP' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const {currentEvent} = useSelector((state: RootState) => state.data);
  const {user} = useSelector((state: RootState) => state.auth);

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
        <Icon name="event-busy" size={64} color="#ccc" />
        <Text style={styles.emptyText}>אין אירוע פעיל כרגע</Text>
        <Text style={styles.emptySubtext}>
          כשיהיה אירוע פעיל, תוכל לדווח כאן
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Icon name="notifications-active" size={32} color="#FF5722" />
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
              responseType === 'OK' && styles.selectedButton,
            ]}
            onPress={() => setResponseType('OK')}>
            <Icon
              name="check-circle"
              size={48}
              color={responseType === 'OK' ? '#fff' : '#4CAF50'}
            />
            <Text
              style={[
                styles.responseButtonText,
                responseType === 'OK' && styles.selectedButtonText,
              ]}>
              הכל תקין
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.responseButton,
              styles.helpButton,
              responseType === 'HELP' && styles.selectedButton,
            ]}
            onPress={() => setResponseType('HELP')}>
            <Icon
              name="error"
              size={48}
              color={responseType === 'HELP' ? '#fff' : '#F44336'}
            />
            <Text
              style={[
                styles.responseButtonText,
                responseType === 'HELP' && styles.selectedButtonText,
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
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="send" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>שלח דיווח</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          המפקד יקבל את הדיווח שלך ויוכל לראות מי דיווח ומי עדיין לא
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
    marginRight: 10,
  },
  eventTime: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    marginBottom: 5,
  },
  eventArea: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'right',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ddd',
    elevation: 2,
  },
  okButton: {
    borderColor: '#4CAF50',
  },
  helpButton: {
    borderColor: '#F44336',
  },
  selectedButton: {
    borderWidth: 3,
  },
  selectedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  responseButtonText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginBottom: 15,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginRight: 10,
    textAlign: 'right',
  },
});

export default ResponsesScreen;
