import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import AuthStack from "./AuthStack";

/**
 * Deep-link config cho VNPay payment redirect.
 *
 * Expo Go (dev):  exp://greenmarket.ddns.net:8081/--/payment-result?status=success&code=00&txnRef=...
 * Production APK: greenmarket:///payment-result?status=success&code=00&txnRef=...
 *
 * Backend cần set:
 *   MOBILE_URL=exp://greenmarket.ddns.net:8081   (dev)
 *   MOBILE_URL=greenmarket://                    (production APK)
 *   MOBILE_PAYMENT_RESULT_PATH=/--/payment-result (dev) hoặc /payment-result (production)
 */
const prefix = Linking.createURL("/");

const linking = {
  prefixes: [
    prefix,
    "greenmarket://",
    "exp://",
  ],
  config: {
    screens: {
      // Màn hình UserNavigator (root level)
      PaymentResult: {
        path: "payment-result",
        parse: {
          status: (status: string) => status,
          code: (code: string) => code,
          txnRef: (txnRef: string) => txnRef,
          message: (message: string) => message,
        },
      },
    },
  },
};

const RootNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <AuthStack />
    </NavigationContainer>
  );
};

export default RootNavigator;
