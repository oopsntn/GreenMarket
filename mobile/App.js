import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LoginScreen from "./src/components/LoginScreen";

export default function App() {
  const [token, setToken] = useState(null);

  const handleLoginSuccess = (authToken) => {
    setToken(authToken);
    // TODO: Lưu token vào storage và điều hướng đến màn hình chính
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {!token ? (
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.appName}>GreenMarket</Text>
            <Text style={styles.appDescription}>Đăng nhập để tiếp tục trải nghiệm mua sắm xanh</Text>
          </View>

          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </View>
      ) : (
        <View style={styles.inner}>
          <Text style={styles.title}>Đã đăng nhập thành công!</Text>
          {/* TODO: Thêm nội dung chính của app ở đây */}
        </View>
      )}
    </SafeAreaView>
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
});
