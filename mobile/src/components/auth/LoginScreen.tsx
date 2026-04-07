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
    if (!mobile.trim()) {
      Alert.alert("Error", "Please enter your phone number");
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
        const errorData = await res.json();
        Alert.alert("Error", errorData.message || "Action failed");
        return;
      }

      await res.json();
      Alert.alert("Success", "The OTP code has been sent to your phone number.");
      setStep("otp");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("OTP request error:", errorMessage);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-digit OTP");
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
        Alert.alert("Error", "The OTP code is incorrect or has expired.");
        return;
      }

      const data = await res.json();
      Alert.alert("Success", "Signed in successfully!");
      login(data.token, data.user);
      onLoginSuccess(data.token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Verify OTP error:", errorMessage);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {step === "mobile" ? (
          <>
            <Text style={styles.title}>Sign in with phone number</Text>
            <Text style={styles.subtitle}>Enter your phone number to receive an OTP code</Text>

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
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to {mobile}</Text>

            <TextInput
              style={styles.input}
              placeholder="000000"
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
                <Text style={styles.primaryButtonText}>Confirm sign in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setStep("mobile");
                setOtp("");
              }}
            >
              <Text style={styles.secondaryButtonText}>Change phone number</Text>
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

export default LoginScreen;
