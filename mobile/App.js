import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://localhost:5000/api";

export default function App() {
  // OTP login state
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("mobile"); // "mobile" | "otp"
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const handleRequestOtp = async () => {
    if (!mobile.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/user/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      if (!res.ok) {
        Alert.alert("Lỗi", "Không thể gửi OTP. Vui lòng thử lại.");
        return;
      }

      Alert.alert("Thành công", "Mã OTP đã được gửi tới số điện thoại của bạn.");
      setStep("otp");
    } catch (error) {
      console.error("Request OTP error", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });

      if (!res.ok) {
        Alert.alert("Lỗi", "Mã OTP không đúng hoặc đã hết hạn.");
        return;
      }

      const data = await res.json();
      setToken(data.token);
      Alert.alert("Thành công", "Đăng nhập thành công!");
    } catch (error) {
      console.error("Verify OTP error", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const renderMobileLogin = () => {
    return (
      <View style={styles.cardBody}>
        {step === "mobile" ? (
          <>
            <Text style={styles.title}>Đăng nhập bằng số điện thoại</Text>
            <Text style={styles.subtitle}>Nhập số điện thoại của bạn để nhận mã OTP</Text>

            <TextInput
              style={styles.input}
              placeholder="09xx xxx xxx"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Gửi mã OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>Nhập mã OTP gồm 6 số đã được gửi tới {mobile}</Text>

            <TextInput
              style={styles.input}
              placeholder="••••••"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Xác nhận đăng nhập</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setStep("mobile");
                setOtp("");
              }}
            >
              <Text style={styles.secondaryButtonText}>Đổi số điện thoại</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.appName}>GreenMarket</Text>
          <Text style={styles.appDescription}>Đăng nhập để tiếp tục trải nghiệm mua sắm xanh</Text>
        </View>

        <View style={styles.card}>
          {renderMobileLogin()}
        </View>
      </View>
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    flexGrow: 1,
  },
  cardBody: {
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "600",
  },
});
