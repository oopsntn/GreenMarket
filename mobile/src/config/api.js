import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let unauthorizedHandler = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
};

const getApiBaseUrl = () => {
  const API_HOST =
    process.env.EXPO_PUBLIC_API_HOST ||
    process.env.EXPO_PUBLIC_API_IP ||
    'greenmarket.ddns.net';
  const API_SCHEME = process.env.EXPO_PUBLIC_API_SCHEME || 'http';
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';
  const useAndroidEmulatorLoopback =
    process.env.EXPO_PUBLIC_USE_ANDROID_EMULATOR_LOOPBACK === 'true';

  const EMULATOR_API_URL = `http://10.0.2.2:${API_PORT}/api`;
  const DEFAULT_API_URL = `${API_SCHEME}://${API_HOST}:${API_PORT}/api`;

  const isProbablyAndroidEmulator = () => {
    if (Platform.OS !== 'android') return false;

    const constants = Platform.constants || {};
    const fingerprint =
      typeof constants.Fingerprint === 'string'
        ? constants.Fingerprint.toLowerCase()
        : '';
    const model =
      typeof constants.Model === 'string' ? constants.Model.toLowerCase() : '';
    const brand =
      typeof constants.Brand === 'string' ? constants.Brand.toLowerCase() : '';

    return (
      fingerprint.includes('generic') ||
      fingerprint.includes('unknown') ||
      fingerprint.includes('emulator') ||
      model.includes('sdk_gphone') ||
      model.includes('android sdk built for') ||
      brand.includes('generic')
    );
  };

  if (
    __DEV__ &&
    Platform.OS === 'android' &&
    useAndroidEmulatorLoopback &&
    isProbablyAndroidEmulator()
  ) {
    return EMULATOR_API_URL;
  }

  return DEFAULT_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_URL || 'https://greenmarket.vn';

export const getServerBaseUrl = () => {
  return API_BASE_URL.replace(/\/api\s*$/, '');
};

console.log('[API Config] Using API URL:', API_BASE_URL);
console.log('[API Config] Server Base URL:', getServerBaseUrl());

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const buildRequestLogUrl = (config) => {
  const path = typeof config?.url === 'string' ? config.url : '';
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const isExpectedShopNotFoundError = (error) => {
  const path = typeof error?.config?.url === 'string' ? error.config.url : '';
  const status = error?.response?.status;
  const message = error?.response?.data?.error;

  return (
    path === '/shops/my-shop' &&
    status === 404 &&
    typeof message === 'string' &&
    message.toLowerCase().includes('shop not found')
  );
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  console.log('[API Request]', {
    method: (config.method || 'get').toUpperCase(),
    url: buildRequestLogUrl(config),
    params: config.params || null,
    payload: config.data instanceof FormData ? '[FormData]' : config.data ?? null,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', {
      method: (response.config?.method || 'get').toUpperCase(),
      url: buildRequestLogUrl(response.config),
      status: response.status,
      data: response.data,
    });

    return response;
  },
  async (error) => {
    const logPayload = {
      method: (error?.config?.method || 'get').toUpperCase(),
      url: buildRequestLogUrl(error?.config),
      status: error?.response?.status || null,
      data: error?.response?.data || null,
      message: error?.message,
    };

    if (isExpectedShopNotFoundError(error)) {
      console.log('[API Expected]', logPayload);
    } else {
      console.error('[API Error]', logPayload);
    }

    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      try {
        if (unauthorizedHandler) {
          await Promise.resolve(unauthorizedHandler(error));
        } else {
          await AsyncStorage.multiRemove(['token', 'user']);
        }
      } catch (handlerError) {
        console.error('[API] Unauthorized handler error:', handlerError);
        await AsyncStorage.multiRemove(['token', 'user']);
      } finally {
        isHandlingUnauthorized = false;
      }
    }

    return Promise.reject(error);
  },
);
