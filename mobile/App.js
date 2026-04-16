import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/AppNavigator";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {

  AsyncStorage.multiRemove(['token', 'user']);

  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
});
