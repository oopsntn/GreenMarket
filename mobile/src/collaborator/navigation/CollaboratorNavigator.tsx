import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Building2,
  FileText,
  LayoutDashboard,
  MailOpen,
} from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import InvitationsScreen from '../screens/InvitationsScreen';
import MyActiveShopsScreen from '../screens/MyActiveShopsScreen';
import CreatePostLayout from '../../components/post/screen/CreatePostScreen';
import MyPostLayout from '../../components/post/screen/MyPostLayout';
import PublicShopDetailScreen from '../../components/shop/screen/PublicShopDetailScreen';
import PostDetailScreen from '../../components/post/screen/PostDetailScreen';
import NotificationsScreen from '../../components/notification/screen/NotificationsScreen';

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
          if (route.name === 'Dashboard') {
            return <LayoutDashboard color={color} size={size} />;
          }

          if (route.name === 'InvitationsTab') {
            return <MailOpen color={color} size={size} />;
          }

          if (route.name === 'MyShopsTab') {
            return <Building2 color={color} size={size} />;
          }

          return <FileText color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Tổng quan' }}
      />
      <Tab.Screen
        name="InvitationsTab"
        component={InvitationsScreen}
        options={{ tabBarLabel: 'Lời mời' }}
      />
      <Tab.Screen
        name="MyShopsTab"
        component={MyActiveShopsScreen}
        options={{ tabBarLabel: 'Shop' }}
      />
      <Tab.Screen
        name="MyPostsTab"
        component={MyPostLayout}
        options={{ tabBarLabel: 'Bài đăng' }}
      />
    </Tab.Navigator>
  );
};

const CollaboratorNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CollaboratorMain" component={CollaboratorTabs} />
      <Stack.Screen name="Invitations" component={InvitationsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="MyActiveShops" component={MyActiveShopsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="MyPost" component={MyPostLayout} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CreateDelegatedPost" component={CreatePostLayout} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PublicShopDetail" component={PublicShopDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

export default CollaboratorNavigator;
