import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '../store';
import {logout} from '../store/authSlice';
import {borderRadius, colors, fontSize, spacing} from '../utils/theme';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח שברצונך להתנתק?', [
      {
        text: 'ביטול',
        style: 'cancel',
      },
      {
        text: 'התנתק',
        onPress: () => dispatch(logout()),
        style: 'destructive',
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'edit',
      title: 'ערוך פרופיל',
      onPress: () => {},
    },
    {
      icon: 'notifications',
      title: 'הגדרות התראות',
      onPress: () => {},
    },
    {
      icon: 'lock',
      title: 'שנה סיסמה',
      onPress: () => {},
    },
    {
      icon: 'help',
      title: 'עזרה ותמיכה',
      onPress: () => {},
    },
    {
      icon: 'info',
      title: 'אודות',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerDecor} />
        <View style={styles.avatarContainer}>
          <View style={styles.avatarBadge}>
            <Icon name="account-circle" size={80} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.nameText}>{user?.name}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        {user?.phone && <Text style={styles.emailText}>{user.phone}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>אזור: {user?.areaId}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}>
            <View style={styles.menuItemContent}>
              <Icon name={item.icon} size={24} color={colors.muted} />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Icon name="chevron-left" size={24} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="exit-to-app" size={24} color={colors.danger} />
        <Text style={styles.logoutText}>התנתק</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>גרסה 1.0.0</Text>
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
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.large,
    borderBottomRightRadius: borderRadius.large,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accentSoft,
    opacity: 0.35,
    top: -80,
    right: -60,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    padding: spacing.xs,
  },
  nameText: {
    fontSize: fontSize.xxlarge,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.textInverse,
  },
  emailText: {
    fontSize: fontSize.medium,
    color: colors.textInverse,
    opacity: 0.85,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginTop: spacing.sm,
  },
  roleText: {
    color: colors.textInverse,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    marginTop: spacing.lg,
    borderRadius: borderRadius.large,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: fontSize.large,
    marginRight: spacing.sm,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: {
    color: colors.danger,
    fontSize: fontSize.large,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  versionText: {
    fontSize: fontSize.small,
    color: colors.muted,
  },
});

export default ProfileScreen;
