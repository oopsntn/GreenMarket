import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

interface SuccessToastProps {
  onHide: () => void;
  duration?: number;
}

const SuccessToast = ({ onHide, duration = 5000 }: SuccessToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [onHide, duration]);

  return (
    <View style={styles.successToast}>
      <Text style={styles.title}>Signed in successfully!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default SuccessToast;
