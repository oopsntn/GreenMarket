import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../components/auth/LoginScreen";
import UserNavigator from "./UserNavigator";
import ManagerNavigator from "../manager/navigation/ManagerNavigator";
import SuccessToast from "../components/SuccessToast";
import CollaboratorNavigator from "@/collaborator/navigation/CollaboratorNavigator";

const AuthStack = () => {
  const { token, user, loading } = useAuth();
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
            Đăng nhập để tiếp tục trải nghiệm mua sắm xanh
          </Text>
        </View>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }


  const renderStack = () => {
    const businessRoleCode = user?.businessRoleCode;

    switch (businessRoleCode) {
      case "MANAGER":
        return <ManagerNavigator />;
      case "COLLABORATOR":
        return <CollaboratorNavigator />
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
