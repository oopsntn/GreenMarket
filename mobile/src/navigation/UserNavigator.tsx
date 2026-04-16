import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Plus, Settings } from 'lucide-react-native';

// Screens
import HomeScreen from '../components/Home/screen/HomeScreen';
import CreatePostLayout from '../components/post/screen/CreatePostScreen';
import UserSettingsScreen from '../components/settings/screen/UserSettingsScreen';
import ProfileScreen from '../components/profile/screen/ProfileScreen';
import MyPostLayout from '../components/post/screen/MyPostLayout';
import ShoDetailScreen from '../components/shop/screen/ShopDetailScreen';
import RegisterShopScreen from '../components/shop/screen/RegisterShop';
import EditShopScreen from '../components/shop/screen/EditShopScreen';
import BrowseShopsScreen from '../components/shop/screen/BrowseShopsScreen';
import PublicShopDetailScreen from '../components/shop/screen/PublicShopDetailScreen';
import PackagesScreen from '../components/shop/screen/PackagesScreen';
import PostDetailScreen from '../components/post/screen/PostDetailScreen';
import SavedPostsScreen from '../components/post/screen/SavedPostsScreen';
import PromotePostScreen from '../components/payment/screen/PromotePostScreen';
import CreateReportScreen from '../components/report/screen/CreateReportService';
import ShopDashboardScreen from '@/components/shop/screen/ShopDashboardScreen';
import CollaboratorNavigator from '../collaborator/navigation/CollaboratorNavigator';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeTab" component={HomeScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PublicShopDetail" component={PublicShopDetailScreen} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
      <Stack.Screen name="MyPost" component={MyPostLayout} />
      <Stack.Screen name="MyShop" component={ShoDetailScreen} />
      <Stack.Screen name="BrowseShops" component={BrowseShopsScreen} />
      <Stack.Screen name="RegisterShop" component={RegisterShopScreen} />
      <Stack.Screen name="EditShop" component={EditShopScreen} />
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="CreateReport" component={CreateReportScreen} />
      <Stack.Screen name="PromotePost" component={PromotePostScreen} />
      <Stack.Screen name="ShopDashboard" component={ShopDashboardScreen} />
      <Stack.Screen name="CollaboratorRoot" component={CollaboratorNavigator} />
    </Stack.Navigator>
  );
};

// Settings Stack
const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsTab" component={UserSettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="RegisterShop" component={RegisterShopScreen} />
      <Stack.Screen name="EditShop" component={EditShopScreen} />
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="MyShop" component={ShoDetailScreen} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
      <Stack.Screen name="ShopDashboard" component={ShopDashboardScreen} />
      <Stack.Screen name="CollaboratorRoot" component={CollaboratorNavigator} />
    </Stack.Navigator>
  );
};

// Main Bottom Tab Navigator
const UserNavigator = () => {
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
          if (route.name === 'HomeStack') {
            icon = <Home color={color} size={size} />;
          } else if (route.name === 'CreatePost') {
            icon = <Plus color={color} size={size} />;
          } else if (route.name === 'SettingsStack') {
            icon = <Settings color={color} size={size} />;
          }
          return icon;
        },
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Trang chủ',
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostLayout}
        options={{
          tabBarLabel: 'Đăng tin',
        }}
      />
      <Tab.Screen
        name="SettingsStack"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Cài đặt',
        }}
      />
    </Tab.Navigator>
  );
};

export default UserNavigator;
