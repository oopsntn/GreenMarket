import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import MainStack from "./src/MainStack";
import LoginScreen from "./src/components/LoginScreen";

const RootNavigation = () => {
  const { token, loading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  const onLogin = async () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!token ? (
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.appName}>GreenMarket</Text>
            <Text style={styles.appDescription}>Sign in to continue your green shopping experience</Text>
          </View>
          <LoginScreen onLoginSuccess={onLogin} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <MainStack />

          {showSuccess && (
            <View style={styles.successToast}>
              <Text style={styles.title}>Signed in successfully!</Text>
            </View>
          )}
        </View>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <RootNavigation />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#15803d",
  },
  appDescription: {
    marginTop: 4,
    fontSize: 14,
    color: "#4b5563",
  },
  successToast: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#15803d",
  },
});
