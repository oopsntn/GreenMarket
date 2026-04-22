import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  Home,
  Megaphone,
  CircleDollarSign,
  HandCoins,
  Settings,
} from 'lucide-react-native';
import HostDashboardScreen from '../screens/HostDashboardScreen';
import CreatePromotionalContentScreen from '../screens/CreatePromotionalContentScreen';
import HostEarningsScreen from '../screens/HostEarningsScreen';
import HostPayoutScreen from '../screens/HostPayoutScreen';
import HostNewsDetailScreen from '../screens/HostNewsDetailScreen';

// Marketplace (same browsing experience as User)
import HomeScreen from '../../components/Home/screen/HomeScreen';
import PostDetailScreen from '../../components/post/screen/PostDetailScreen';
import PublicShopDetailScreen from '../../components/shop/screen/PublicShopDetailScreen';
import BrowseShopsScreen from '../../components/shop/screen/BrowseShopsScreen';
import HostSettingsScreen from '../screens/HostSettingsScreen';
import HostProfileScreen from '../screens/HostProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HostSettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsTab" component={HostSettingsScreen} />
      <Stack.Screen name="Profile" component={HostProfileScreen} />
    </Stack.Navigator>
  );
};

const HostMarketplaceStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTab" component={HomeScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PublicShopDetail" component={PublicShopDetailScreen} />
      <Stack.Screen name="BrowseShops" component={BrowseShopsScreen} />
    </Stack.Navigator>
  );
};

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
          } else if (route.name === 'Marketplace') {
            icon = <Home color={color} size={size} />;
          } else if (route.name === 'CreateContent') {
            icon = <Megaphone color={color} size={size} />;
          } else if (route.name === 'Earnings') {
            icon = <CircleDollarSign color={color} size={size} />;
          } else if (route.name === 'Payout') {
            icon = <HandCoins color={color} size={size} />;
          } else if (route.name === 'SettingsStack') {
            icon = <Settings color={color} size={size} />;
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
        name="Marketplace"
        component={HostMarketplaceStack}
        options={{ tabBarLabel: 'Cây cảnh' }}
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
      <Tab.Screen
        name="SettingsStack"
        component={HostSettingsStack}
        options={{ tabBarLabel: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
};

const HostNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HostMain" component={HostTabs} />
      <Stack.Screen
        name="HostNewsDetail"
        component={HostNewsDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default HostNavigator;
