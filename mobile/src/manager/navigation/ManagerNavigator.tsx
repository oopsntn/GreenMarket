import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  AlertTriangle,
  Megaphone,
  Settings
} from 'lucide-react-native';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import PostManagementList from '../screens/PostManagementList';
import PostManagementDetail from '../screens/PostManagementDetail';
import HostContentModerationList from '../screens/HostContentModerationList';
import HostContentModerationDetail from '../screens/HostContentModerationDetail';
import ShopManagementList from '../screens/ShopManagementList';
import ShopManagementDetail from '../screens/ShopManagementDetail';
import ReportManagementList from '../screens/ReportManagementList';
import ReportManagementDetail from '../screens/ReportManagementDetail';
import ManagerSettingsScreen from '../screens/ManagerSettingsScreen';
import ModerationHistoryScreen from '../screens/ModerationHistoryScreen';
import ModerationStatisticsScreen from '../screens/ModerationStatisticsScreen';
import ManagerProfileScreen from '../screens/ManagerProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator for the main sections
const ManagerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 75,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === 'Dashboard') icon = <LayoutDashboard color={color} size={size} />;
          else if (route.name === 'Posts') icon = <ClipboardCheck color={color} size={size} />;
          else if (route.name === 'HostContents') icon = <Megaphone color={color} size={size} />;
          else if (route.name === 'Shops') icon = <Store color={color} size={size} />;
          else if (route.name === 'Reports') icon = <AlertTriangle color={color} size={size} />;
          else if (route.name === 'Settings') icon = <Settings color={color} size={size} />;
          return icon;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Tổng quan' }} />
      <Tab.Screen name="Posts" component={PostManagementList} options={{ tabBarLabel: 'Bài đăng' }} />
      <Tab.Screen name="HostContents" component={HostContentModerationList} options={{ tabBarLabel: 'Nội dung host' }} />
      <Tab.Screen name="Shops" component={ShopManagementList} options={{ tabBarLabel: 'Cửa hàng' }} />
      <Tab.Screen name="Reports" component={ReportManagementList} options={{ tabBarLabel: 'Báo cáo' }} />
      <Tab.Screen name="Settings" component={ManagerSettingsScreen} options={{ tabBarLabel: 'Cài đặt' }} />
    </Tab.Navigator>
  );
};

// Main Manager Navigator wrapping everything
const ManagerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={ManagerTabs} />

      {/* Detail Screens (Not in tabs) */}
      <Stack.Screen
        name="PostManagementDetail"
        component={PostManagementDetail}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="HostContentModerationDetail"
        component={HostContentModerationDetail}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ShopManagementDetail"
        component={ShopManagementDetail}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ReportManagementDetail"
        component={ReportManagementDetail}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ModerationHistory"
        component={ModerationHistoryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ModerationStatistics"
        component={ModerationStatisticsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ManagerProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default ManagerNavigator;
