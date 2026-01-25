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
} from 'react-native';
import {useDispatch} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {AuthStackParamList} from '../navigation/AuthNavigator';
import {authService} from '../services/authService';
import {setCredentials, setLoading} from '../store/authSlice';
import {borderRadius, colors, fontSize, spacing} from '../utils/theme';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      const response = await authService.login({email, password});
      dispatch(setCredentials(response));
    } catch (error: any) {
      Alert.alert(
        'שגיאת התחברות',
        error.response?.data?.message || 'אירעה שגיאה בהתחברות',
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
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>מערכת Horn</Text>
          <Text style={styles.subtitle}>התחבר לחשבון שלך</Text>

          <TextInput
            style={styles.input}
            placeholder="אימייל"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="סיסמה"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>התחבר</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>אין לך חשבון? הירשם</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primarySoft,
    opacity: 0.15,
    top: -40,
    left: -80,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accentSoft,
    opacity: 0.2,
    bottom: -40,
    right: -60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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

export default LoginScreen;
