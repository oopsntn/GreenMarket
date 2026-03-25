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
import { API_BASE_URL } from "../config/api";

export default function LoginScreen({ onLoginSuccess }) {
  // OTP login state
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("mobile"); // "mobile" | "otp"
  const [loading, setLoading] = useState(false);

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
      console.log(res);
      if (!res.ok) {
        const errorData = await res.json();

        console.log(res.status); // 400, 401, 500, etc.
        console.log(errorData); // Lấy chi tiết lỗi từ server

        Alert.alert("Lỗi", errorData.message || "Thao tác thất bại");
        return;
      }

      const data = await res.json(); 
      Alert.alert("Thành công", "Mã OTP đã được gửi tới số điện thoại của bạn.");
      setStep("otp");
    } catch (error) {
      console.error("❌ Error:", error.message); // Xem chi tiết lỗi
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
      Alert.alert("Thành công", "Đăng nhập thành công!");
      onLoginSuccess(data.token);
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
    <View style={styles.card}>
      {renderMobileLogin()}
    </View>
  );
}

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
