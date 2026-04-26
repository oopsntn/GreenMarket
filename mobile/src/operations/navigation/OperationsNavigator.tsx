import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bell, ClipboardList, Home, LayoutDashboard, Settings, Workflow } from 'lucide-react-native';
import OperationsDashboardScreen from '../screens/OperationsDashboardScreen';
import OperationsTasksScreen from '../screens/OperationsTasksScreen';
import OperationsWorkloadScreen from '../screens/OperationsWorkloadScreen';
import OperationsNotificationsScreen from '../screens/OperationsNotificationsScreen';
import OperationTaskDetailScreen from '../screens/OperationTaskDetailScreen';

// Marketplace (same browsing experience as User)
import HomeScreen from '../../components/Home/screen/HomeScreen';
import PostDetailScreen from '../../components/post/screen/PostDetailScreen';
import PublicShopDetailScreen from '../../components/shop/screen/PublicShopDetailScreen';
import BrowseShopsScreen from '../../components/shop/screen/BrowseShopsScreen';
import OperationsSettingsScreen from '../screens/OperationsSettingsScreen';
import OperationsProfileScreen from '../screens/OperationsProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const OperationsSettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsTab" component={OperationsSettingsScreen} />
      <Stack.Screen name="Profile" component={OperationsProfileScreen} />
    </Stack.Navigator>
  );
};

const OperationsMarketplaceStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTab" component={HomeScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PublicShopDetail" component={PublicShopDetailScreen} />
      <Stack.Screen name="BrowseShops" component={BrowseShopsScreen} />
    </Stack.Navigator>
  );
};

const OperationsTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === 'Dashboard') icon = <LayoutDashboard color={color} size={size} />;
          else if (route.name === 'Marketplace') icon = <Home color={color} size={size} />;
          else if (route.name === 'Tasks') icon = <ClipboardList color={color} size={size} />;
          else if (route.name === 'Workload') icon = <Workflow color={color} size={size} />;
          else if (route.name === 'Notifications') icon = <Bell color={color} size={size} />;
          else if (route.name === 'SettingsStack') icon = <Settings color={color} size={size} />;
          return icon;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OperationsDashboardScreen} options={{ tabBarLabel: 'Tổng quan' }} />
      <Tab.Screen name="Marketplace" component={OperationsMarketplaceStack} options={{ tabBarLabel: 'Cây cảnh' }} />
      <Tab.Screen name="Tasks" component={OperationsTasksScreen} options={{ tabBarLabel: 'Công việc' }} />
      <Tab.Screen name="Workload" component={OperationsWorkloadScreen} options={{ tabBarLabel: 'Workload' }} />
      <Tab.Screen
        name="Notifications"
        component={OperationsNotificationsScreen}
        options={{ tabBarLabel: 'Thông báo' }}
      />
      <Tab.Screen
        name="SettingsStack"
        component={OperationsSettingsStack}
        options={{ tabBarLabel: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
};

const OperationsNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OperationsMain" component={OperationsTabs} />
      <Stack.Screen
        name="TaskDetail"
        component={OperationTaskDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default OperationsNavigator;
