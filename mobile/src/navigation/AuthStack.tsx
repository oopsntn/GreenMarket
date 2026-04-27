import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../components/auth/LoginScreen";
import WelcomeScreen from "../components/auth/WelcomeScreen";
import UserNavigator from "./UserNavigator";
import ManagerNavigator from "../manager/navigation/ManagerNavigator";
import SuccessToast from "../components/SuccessToast";
import CollaboratorNavigator from "@/collaborator/navigation/CollaboratorNavigator";
import HostNavigator from "../host/navigation/HostNavigator";
import OperationsNavigator from "../operations/navigation/OperationsNavigator";
import { Leaf } from "lucide-react-native";

const AuthStack = () => {
  const { token, user, loading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const previousTokenRef = useRef<string | null>(token);

  useEffect(() => {
    if (previousTokenRef.current !== null && token === null) {
      setShowWelcome(false);
    }

    previousTokenRef.current = token;
  }, [token]);

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
    // Show welcome screen first
    if (showWelcome) {
      return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
    }

    // Show login screen
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.logoArea}>
            <View style={styles.iconWrap}>
              <Leaf color="#16a34a" size={32} />
            </View>
            <Text style={styles.appName}>GreenMarket</Text>
            <Text style={styles.appDescription}>
              Đăng nhập để tiếp tục trải nghiệm mua sắm xanh
            </Text>
          </View>

          <View style={styles.loginCardWrap}>
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const renderStack = () => {
    const businessRoleCode = user?.businessRoleCode;

    switch (businessRoleCode) {
      case "MANAGER":
        return <ManagerNavigator />;
      case "COLLABORATOR":
        return <CollaboratorNavigator />;
      case "OPERATION_STAFF":
        return <OperationsNavigator />;
      case "HOST":
        return <HostNavigator />;
      default:
        return <UserNavigator />;
    }
  };

  return (
    <>
      {renderStack()}
      {showSuccess && <SuccessToast onHide={handleToastHide} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faf8",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#15803d",
  },
  appDescription: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  loginCardWrap: {
    // The LoginScreen component is already a card, no extra flex needed
  },
});

export default AuthStack;
