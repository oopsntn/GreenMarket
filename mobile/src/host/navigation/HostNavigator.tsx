import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  Megaphone,
  CircleDollarSign,
  HandCoins,
} from 'lucide-react-native';
import HostDashboardScreen from '../screens/HostDashboardScreen';
import CreatePromotionalContentScreen from '../screens/CreatePromotionalContentScreen';
import HostEarningsScreen from '../screens/HostEarningsScreen';
import HostPayoutScreen from '../screens/HostPayoutScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HostTabs = () => {
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
          if (route.name === 'Dashboard') {
            icon = <LayoutDashboard color={color} size={size} />;
          } else if (route.name === 'CreateContent') {
            icon = <Megaphone color={color} size={size} />;
          } else if (route.name === 'Earnings') {
            icon = <CircleDollarSign color={color} size={size} />;
          } else if (route.name === 'Payout') {
            icon = <HandCoins color={color} size={size} />;
          }
          return icon;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={HostDashboardScreen}
        options={{ tabBarLabel: 'Tổng quan' }}
      />
      <Tab.Screen
        name="CreateContent"
        component={CreatePromotionalContentScreen}
        options={{ tabBarLabel: 'Quảng bá' }}
      />
      <Tab.Screen
        name="Earnings"
        component={HostEarningsScreen}
        options={{ tabBarLabel: 'Doanh thu' }}
      />
      <Tab.Screen
        name="Payout"
        component={HostPayoutScreen}
        options={{ tabBarLabel: 'Rút tiền' }}
      />
    </Tab.Navigator>
  );
};

const HostNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HostMain" component={HostTabs} />
    </Stack.Navigator>
  );
};

export default HostNavigator;
