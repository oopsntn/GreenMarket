import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import ShoDetailScreen from './components/shop/screen/ShoDetailScreen'
import MyPostLayout from './components/post/screen/MyPostLayout'
import ProfileScreen from './components/profile/screen/ProfileScreen'
import CreatePostLayout from './components/post/screen/CreatePostLayout'
import RegisterShopScreen from './components/shop/screen/RegisterShop'
import EditShopScreen from './components/shop/screen/EditShopScreen'

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

            <Stack.Screen name="MyPost" component={MyPostLayout} />
            <Stack.Screen name="CreatePost" component={CreatePostLayout} />

        </Stack.Navigator>
    )
}

export default MainStack
