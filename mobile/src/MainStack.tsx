import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import ShoDetailScreen from './components/shop/screen/ShopDetailScreen'
import MyPostLayout from './components/post/screen/MyPostLayout'
import ProfileScreen from './components/profile/screen/ProfileScreen'

import RegisterShopScreen from './components/shop/screen/RegisterShop'
import EditShopScreen from './components/shop/screen/EditShopScreen'
import CreatePostLayout from './components/post/screen/CreatePostScreen'
import CreateReportScreen from './components/report/screen/CreateReportService'
import BrowseShopsScreen from './components/shop/screen/BrowseShopsScreen'
import PublicShopDetailScreen from './components/shop/screen/PublicShopDetailScreen'

const Stack = createNativeStackNavigator()

const MainStack = () => {
    return (
        <Stack.Navigator initialRouteName='Profile'
            screenOptions={{
                headerShown: false, // Vì bạn đã dùng MobileLayout có header riêng rồi
            }}>
            <Stack.Screen name="Profile" component={ProfileScreen} />

            <Stack.Screen name="RegisterShop" component={RegisterShopScreen} />
            <Stack.Screen name="MyShop" component={ShoDetailScreen} />
            <Stack.Screen name="EditShop" component={EditShopScreen} />
            <Stack.Screen name="BrowseShops" component={BrowseShopsScreen} />
            <Stack.Screen name="PublicShopDetail" component={PublicShopDetailScreen} />

            <Stack.Screen name="MyPost" component={MyPostLayout} />
            <Stack.Screen name="CreatePost" component={CreatePostLayout} />
            <Stack.Screen name="CreateReport" component={CreateReportScreen} />

        </Stack.Navigator>
    )
}

export default MainStack
