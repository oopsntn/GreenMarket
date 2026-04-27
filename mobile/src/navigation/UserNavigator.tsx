import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Plus, Settings, Store, Newspaper } from 'lucide-react-native';

// Screens
import HomeScreen from '../components/Home/screen/HomeScreen';
import CreatePostLayout from '../components/post/screen/CreatePostScreen';
import ManagementCenterScreen from '../components/post/screen/ManagementCenterScreen';
import UserSettingsScreen from '../components/settings/screen/UserSettingsScreen';
import UserSupportRequestScreen from '../components/settings/screen/UserSupportRequestScreen';
import QrLoginScannerScreen from '../components/settings/screen/QrLoginScannerScreen';
import ProfileScreen from '../components/profile/screen/ProfileScreen';
import MyPostLayout from '../components/post/screen/MyPostLayout';
import PostTrashScreen from '../components/post/screen/PostTrashScreen';
import ShoDetailScreen from '../components/shop/screen/ShopDetailScreen';
import RegisterShopScreen from '../components/shop/screen/RegisterShop';
import EditShopScreen from '../components/shop/screen/EditShopScreen';
import BrowseShopsScreen from '../components/shop/screen/BrowseShopsScreen';
import NurseryListScreen from '../components/shop/screen/NurseryListScreen';
import NewsListScreen from '../components/news/screen/NewsListScreen';
import NewsBookmarksScreen from '../components/news/screen/NewsBookmarksScreen';
import PublicShopDetailScreen from '../components/shop/screen/PublicShopDetailScreen';
import PostDetailScreen from '../components/post/screen/PostDetailScreen';
import SavedPostsScreen from '../components/post/screen/SavedPostsScreen';
import PromotePostScreen from '../components/payment/screen/PromotePostScreen';
import PersonalDashboardScreen from '../components/payment/screen/PersonalDashboardScreen';
import CreateReportScreen from '../components/report/screen/CreateReportService';
import ShopDashboardScreen from '@/components/shop/screen/ShopDashboardScreen';
import PackagesScreen from '@/components/shop/screen/PackagesScreen';
import ShopCollaboratorsScreen from '@/components/shop/screen/ShopCollaboratorsScreen';
import CollaboratorPublicListScreen from '@/components/shop/screen/CollaboratorPublicListScreen';
import PublicCollaboratorDetailScreen from '@/components/shop/screen/PublicCollaboratorDetailScreen';
import PendingOwnerPostsScreen from '@/components/shop/screen/PendingOwnerPostsScreen';
import HostNewsDetailScreen from '@/host/screens/HostNewsDetailScreen';
import NotificationsScreen from '@/components/notification/screen/NotificationsScreen';
import HostNavigator from '@/host/navigation/HostNavigator';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// Home Stack
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeTab" component={HomeScreen} />
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
    </Stack.Navigator>
  );
};

const MainTabsNavigator = () => {
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
          } else if (route.name === 'NurseryList') {
            icon = <Store color={color} size={size} />;
          } else if (route.name === 'News') {
            icon = <Newspaper color={color} size={size} />;
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
        name="NurseryList"
        component={NurseryListScreen}
        options={{
          tabBarLabel: 'Nhà vườn',
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsListScreen}
        options={{
          tabBarLabel: 'Tin tức',
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

const UserNavigator = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabsNavigator} />
      <RootStack.Screen name="CreatePost" component={CreatePostLayout} />
      <RootStack.Screen name="Profile" component={ProfileScreen} />
      <RootStack.Screen name="ManagementCenter" component={ManagementCenterScreen} />
      <RootStack.Screen name="HostMode" component={HostNavigator} />
      <RootStack.Screen name="PostDetail" component={PostDetailScreen} />
      <RootStack.Screen name="PublicShopDetail" component={PublicShopDetailScreen} />
      <RootStack.Screen name="SavedPosts" component={SavedPostsScreen} />
      <RootStack.Screen name="MyPost" component={MyPostLayout} />
      <RootStack.Screen name="PostTrash" component={PostTrashScreen} />
      <RootStack.Screen name="MyShop" component={ShoDetailScreen} />
      <RootStack.Screen name="BrowseShops" component={BrowseShopsScreen} />
      <RootStack.Screen name="NurseryList" component={NurseryListScreen} />
      <RootStack.Screen name="News" component={NewsListScreen} />
      <RootStack.Screen name="NewsBookmarks" component={NewsBookmarksScreen} />
      <RootStack.Screen name="NewsDetail" component={HostNewsDetailScreen} />
      <RootStack.Screen name="RegisterShop" component={RegisterShopScreen} />
      <RootStack.Screen name="EditShop" component={EditShopScreen} />
      <RootStack.Screen name="CreateReport" component={CreateReportScreen} />
      <RootStack.Screen name="PromotePost" component={PromotePostScreen} />
      <RootStack.Screen name="PersonalDashboard" component={PersonalDashboardScreen} />
      <RootStack.Screen name="ShopDashboard" component={ShopDashboardScreen} />
      <RootStack.Screen name="Packages" component={PackagesScreen} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
      <RootStack.Screen name="UserSupportRequest" component={UserSupportRequestScreen} />
      <RootStack.Screen name="QrLoginScanner" component={QrLoginScannerScreen} />

      {/* Collaborator Screens For Shop Owner */}
      <RootStack.Screen name="ShopCollaborators" component={ShopCollaboratorsScreen} />
      <RootStack.Screen name="CollaboratorPublicList" component={CollaboratorPublicListScreen} />
      <RootStack.Screen name="PublicCollaboratorDetail" component={PublicCollaboratorDetailScreen} />
      <RootStack.Screen name="PendingOwnerPosts" component={PendingOwnerPostsScreen} />
    </RootStack.Navigator>
  );
};

export default UserNavigator;
