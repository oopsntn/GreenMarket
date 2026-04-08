import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../components/auth/LoginScreen";
import MainStack from "../MainStack";
import SuccessToast from "../components/SuccessToast";

const AuthStack = () => {
  const { token, loading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLoginSuccess = () => {
    setShowSuccess(true);
  };

  const handleToastHide = () => {
    setShowSuccess(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>GreenMarket</Text>
          <Text style={styles.appDescription}>
            Sign in to continue your green shopping experience
          </Text>
        </View>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  return (
    <>
      <MainStack />
      {showSuccess && <SuccessToast onHide={handleToastHide} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: "#f0fdf4",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
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
});

export default AuthStack;
