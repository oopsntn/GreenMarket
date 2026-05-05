import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

interface LoginScreenProps {
  onLoginSuccess: (token?: string) => void;
}

type LoginStep = "mobile" | "otp";

const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
  const [mobile, setMobile] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [step, setStep] = useState<LoginStep>("mobile");
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const handleRequestOtp = async (): Promise<void> => {
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại của bạn");
      return;
    }

    if (trimmedMobile.length !== 10 || !/^\d+$/.test(trimmedMobile)) {
      Alert.alert("Lỗi", "Vui lòng nhập đúng định dạng số điện thoại");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/user/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: trimmedMobile }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        Alert.alert("Lỗi", errorData.message || "Thao tác thất bại");
        console.error("OTP request error:", errorData);
        return;
      }

      await res.json();
      Alert.alert("Thành công", "Mã OTP đã được gửi đến số điện thoại của bạn.");
      setStep("otp");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("OTP request error:", errorMessage);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (otp.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim(), otp }),
      });

      if (!res.ok) {
        Alert.alert("Lỗi", "Mã OTP không đúng hoặc đã hết hạn.");
        return;
      }

      const data = await res.json();
      Alert.alert("Thành công", "Đăng nhập thành công!");
      login(data.token, data.user);
      onLoginSuccess(data.token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Verify OTP error:", errorMessage);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {step === "mobile" ? (
          <>
            <Text style={styles.title}>Đăng nhập bằng số điện thoại</Text>
            <Text style={styles.subtitle}>Nhập số điện thoại để nhận mã OTP</Text>

            <TextInput
              testID="login-mobile-input"
              style={styles.input}
              placeholder="09xx xxx xxx"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />

            <TouchableOpacity
              testID="login-send-otp-button"
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
            <Text style={styles.subtitle}>Nhập 6 số OTP đã gửi đến {mobile}</Text>

            <TextInput
              testID="login-otp-input"
              style={styles.input}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity
              testID="login-confirm-button"
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
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
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

export default LoginScreen;
