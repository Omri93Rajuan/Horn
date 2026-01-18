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
        <View style={styles.avatarContainer}>
          <Icon name="account-circle" size={80} color="#2196F3" />
        </View>
        <Text style={styles.nameText}>{user?.name}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        {user?.phone && (
          <Text style={styles.emailText}>{user.phone}</Text>
        )}
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
              <Icon name={item.icon} size={24} color="#666" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Icon name="chevron-left" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="exit-to-app" size={24} color="#F44336" />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginRight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
