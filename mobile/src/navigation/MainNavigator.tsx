import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DashboardScreen from '../screens/DashboardScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ResponsesScreen from '../screens/ResponsesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {colors} from '../utils/theme';

export type MainTabParamList = {
  Dashboard: undefined;
  Alerts: undefined;
  Responses: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Alerts':
              iconName = 'notifications';
              break;
            case 'Responses':
              iconName = 'check-circle';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
        },
        headerTintColor: colors.primary,
        headerTitleAlign: 'center',
      })}>
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{title: 'דשבורד'}}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={{title: 'התרעות'}}
      />
      <Tab.Screen 
        name="Responses" 
        component={ResponsesScreen}
        options={{title: 'תגובות'}}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{title: 'פרופיל'}}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
