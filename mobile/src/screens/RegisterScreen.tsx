import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {AuthStackParamList} from '../navigation/AuthNavigator';
import {authService} from '../services/authService';
import {setCredentials, setLoading} from '../store/authSlice';
import {borderRadius, colors, fontSize, spacing} from '../utils/theme';

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register'
>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

const RegisterScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [areaId, setAreaId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleRegister = async () => {
    if (!email || !password || !name || !areaId) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות החובה');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      const response = await authService.register({
        email,
        password,
        name,
        phone,
        areaId,
      });
      dispatch(setCredentials(response));
    } catch (error: any) {
      Alert.alert(
        'שגיאת הרשמה',
        error.response?.data?.message || 'אירעה שגיאה בהרשמה',
      );
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>הרשמה</Text>
          <Text style={styles.subtitle}>צור חשבון חדש במערכת Horn</Text>

          <TextInput
            style={styles.input}
            placeholder="שם מלא *"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="אימייל *"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="מספר טלפון (אופציונלי)"
            placeholderTextColor={colors.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="קוד אזור/יחידה *"
            placeholderTextColor={colors.muted}
            value={areaId}
            onChangeText={setAreaId}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="סיסמה *"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="אימות סיסמה *"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>הירשם</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>יש לך חשבון? התחבר</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primarySoft,
    opacity: 0.12,
    top: -60,
    right: -80,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accentSoft,
    opacity: 0.2,
    bottom: -50,
    left: -70,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: fontSize.xxxlarge,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.large,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    fontSize: fontSize.large,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: fontSize.large,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.accent,
    fontSize: fontSize.medium,
    fontWeight: '600',
  },
});

export default RegisterScreen;
