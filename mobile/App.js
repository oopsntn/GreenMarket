import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
export const API_URL = 'http://10.33.50.177/api'

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Các màn hình của bạn sẽ khai báo ở đây */}
        <Stack.Screen name="CreatePost" component={CreatePostLayout} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}