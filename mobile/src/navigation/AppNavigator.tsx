import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import AuthStack from "./AuthStack";

/**
 * Deep-link config cho payment redirect.
 *
 * Expo Go:
 *   exp://<expo-host>:8081/--/payment-result?status=success&code=00&txnRef=...
 *
 * APK / dev build:
 *   greenmarket://payment-result?status=success&code=00&txnRef=...
 *
 * Backend phải dùng đúng cặp biến theo môi trường đang chạy:
 *   Expo Go:
 *     MOBILE_URL=exp://<expo-host>:8081
 *     MOBILE_PAYMENT_RESULT_PATH=/--/payment-result
 *   APK / dev build:
 *     MOBILE_URL=greenmarket://
 *     MOBILE_PAYMENT_RESULT_PATH=/payment-result
 */
const expoPrefix = Linking.createURL("/");

const linking = {
  prefixes: [expoPrefix, "greenmarket://"],
  config: {
    screens: {
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
