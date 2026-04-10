import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  LayoutDashboard, 
  MapPin, 
  Briefcase, 
  Wallet 
} from 'lucide-react-native';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import AvailableJobsScreen from '../screens/AvailableJobsScreen';
import MyJobsScreen from '../screens/MyJobsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import SubmitWorkScreen from '../screens/SubmitWorkScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import PayoutRequestScreen from '../screens/PayoutRequestScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CollaboratorTabs = () => {
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
          else if (route.name === 'Explore') icon = <MapPin color={color} size={size} />;
          else if (route.name === 'MyWork') icon = <Briefcase color={color} size={size} />;
          else if (route.name === 'Wallet') icon = <Wallet color={color} size={size} />;
          return icon;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Overview' }} />
      <Tab.Screen name="Explore" component={AvailableJobsScreen} options={{ tabBarLabel: 'Find Jobs' }} />
      <Tab.Screen name="MyWork" component={MyJobsScreen} options={{ tabBarLabel: 'My Jobs' }} />
      <Tab.Screen name="Wallet" component={EarningsScreen} options={{ tabBarLabel: 'Wallet' }} />
    </Tab.Navigator>
  );
};

const CollaboratorNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CollaboratorMain" component={CollaboratorTabs} />
      {/* Detail screens go here */}
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SubmitWork" component={SubmitWorkScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="PayoutRequest" component={PayoutRequestScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
};

export default CollaboratorNavigator;
