import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Store, 
  AlertTriangle 
} from 'lucide-react-native';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import PostModerationList from '../screens/PostModerationList';
import PostModerationDetail from '../screens/PostModerationDetail';
import ShopModerationList from '../screens/ShopModerationList';
import ShopModerationDetail from '../screens/ShopModerationDetail';
import ReportModerationList from '../screens/ReportModerationList';
import ReportModerationDetail from '../screens/ReportModerationDetail';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator for the main sections
const ModeratorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
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
          else if (route.name === 'Posts') icon = <ClipboardCheck color={color} size={size} />;
          else if (route.name === 'Shops') icon = <Store color={color} size={size} />;
          else if (route.name === 'Reports') icon = <AlertTriangle color={color} size={size} />;
          return icon;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Overview' }} />
      <Tab.Screen name="Posts" component={PostModerationList} options={{ tabBarLabel: 'Review Posts', tabBarBadge: 5 }} />
      <Tab.Screen name="Shops" component={ShopModerationList} options={{ tabBarLabel: 'Shops' }} />
      <Tab.Screen name="Reports" component={ReportModerationList} options={{ tabBarLabel: 'Reports', tabBarBadge: 3 }} />
    </Tab.Navigator>
  );
};

// Main Moderator Navigator wrapping everything
const ModeratorNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={ModeratorTabs} />
      
      {/* Detail Screens (Not in tabs) */}
      <Stack.Screen 
        name="PostModerationDetail" 
        component={PostModerationDetail} 
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="ShopModerationDetail" 
        component={ShopModerationDetail} 
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="ReportModerationDetail" 
        component={ReportModerationDetail} 
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default ModeratorNavigator;
