import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bell, ClipboardList, LayoutDashboard, Workflow } from 'lucide-react-native';
import OperationsDashboardScreen from '../screens/OperationsDashboardScreen';
import OperationsTasksScreen from '../screens/OperationsTasksScreen';
import OperationsWorkloadScreen from '../screens/OperationsWorkloadScreen';
import OperationsNotificationsScreen from '../screens/OperationsNotificationsScreen';
import OperationTaskDetailScreen from '../screens/OperationTaskDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
          else if (route.name === 'Tasks') icon = <ClipboardList color={color} size={size} />;
          else if (route.name === 'Workload') icon = <Workflow color={color} size={size} />;
          else if (route.name === 'Notifications') icon = <Bell color={color} size={size} />;
          return icon;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OperationsDashboardScreen} options={{ tabBarLabel: 'Tổng quan' }} />
      <Tab.Screen name="Tasks" component={OperationsTasksScreen} options={{ tabBarLabel: 'Công việc' }} />
      <Tab.Screen name="Workload" component={OperationsWorkloadScreen} options={{ tabBarLabel: 'Workload' }} />
      <Tab.Screen
        name="Notifications"
        component={OperationsNotificationsScreen}
        options={{ tabBarLabel: 'Thông báo' }}
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
