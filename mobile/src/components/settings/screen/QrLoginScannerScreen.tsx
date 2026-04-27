import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { QrCode } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import CustomAlert from '../../../utils/AlertHelper';
import { qrAuthService } from '../service/qrAuthService';

type ScanState = 'scanning' | 'processing' | 'scanned' | 'paused' | 'authorizing';

const extractSessionId = (raw: string): string | null => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  const match = trimmed.match(/sessionId=([^&]+)/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.sessionId === 'string') {
      return parsed.sessionId;
    }
  } catch {
    // Ignore JSON parse errors and fall back to raw value.
  }

  return trimmed;
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const responseData = (error as any).response?.data;
    if (typeof responseData?.error === 'string') return responseData.error;
    if (typeof responseData?.message === 'string') return responseData.message;
  }

  if (error instanceof Error) return error.message;
  return 'Không thể xử lý yêu cầu QR lúc này.';
};

const QrLoginScannerScreen = ({ navigation }: any) => {
  const [permission, requestCameraPermission] = useCameraPermissions();
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scanLockRef = useRef(false);

  const hasPermission = permission?.granted ?? null;

  const requestPermission = useCallback(async () => {
    setPermissionLoading(true);
    try {
      await requestCameraPermission();
    } catch (error) {
      console.error('[QR Login] Permission error:', error);
    } finally {
      setPermissionLoading(false);
    }
  }, [requestCameraPermission]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const resetScanner = useCallback(() => {
    scanLockRef.current = false;
    setSessionId(null);
    setErrorMessage(null);
    setScanState('scanning');
  }, []);

  const handleBarCodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (scanState !== 'scanning' || scanLockRef.current) return;
      scanLockRef.current = true;
      setErrorMessage(null);

      const resolvedSessionId = extractSessionId(data);
      if (!resolvedSessionId) {
        setErrorMessage('Mã QR không hợp lệ. Vui lòng thử lại.');
        setScanState('paused');
        return;
      }

      setSessionId(resolvedSessionId);
      setScanState('processing');

      try {
        await qrAuthService.scan(resolvedSessionId);
        setScanState('scanned');
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        setScanState('paused');
      }
    },
    [scanState],
  );

  const handleAuthorize = async () => {
    if (!sessionId || scanState === 'authorizing') return;
    setScanState('authorizing');

    try {
      await qrAuthService.authorize(sessionId);
      CustomAlert('Thành công', 'Bạn đã xác nhận đăng nhập Web thành công.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setScanState('paused');
    }
  };

  const renderActionCard = () => {
    if (!hasPermission) return null;

    if (scanState === 'processing') {
      return (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Đang kiểm tra mã QR...</Text>
          <ActivityIndicator color="#16a34a" />
        </View>
      );
    }

    if (scanState === 'authorizing') {
      return (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Đang xác nhận đăng nhập...</Text>
          <ActivityIndicator color="#16a34a" />
        </View>
      );
    }

    if (scanState === 'scanned') {
      return (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Xác nhận đăng nhập</Text>
          <Text style={styles.cardSubtitle}>
            Bạn có muốn đăng nhập trên trình duyệt Web không?
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetScanner}>
              <Text style={styles.secondaryButtonText}>Quét lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAuthorize}>
              <Text style={styles.primaryButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (scanState === 'paused') {
      return (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Quét lại mã QR</Text>
          <Text style={styles.cardSubtitle}>
            Hãy đảm bảo mã QR còn hiệu lực và thử lại.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
            <Text style={styles.primaryButtonText}>Quét lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionCard}>
        <Text style={styles.cardTitle}>Đưa mã QR vào khung</Text>
        <Text style={styles.cardSubtitle}>
          Mã QR sẽ được nhận diện tự động khi nằm trong khung.
        </Text>
      </View>
    );
  };

  return (
    <MobileLayout title="Quét mã QR" backButton={() => navigation.goBack()} scrollEnabled={false}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <QrCode size={26} color="#16a34a" />
          </View>
          <Text style={styles.title}>Đăng nhập Web bằng QR</Text>
          <Text style={styles.subtitle}>
            Quét mã QR trên màn hình đăng nhập Web để xác nhận tài khoản.
          </Text>
        </View>

        {hasPermission === null ? (
          <View style={styles.permissionCard}>
            <Text style={styles.cardTitle}>Đang yêu cầu quyền camera...</Text>
            {permissionLoading ? <ActivityIndicator color="#16a34a" /> : null}
          </View>
        ) : hasPermission === false ? (
          <View style={styles.permissionCard}>
            <Text style={styles.cardTitle}>Cần quyền truy cập camera</Text>
            <Text style={styles.cardSubtitle}>
              Vui lòng cấp quyền để quét mã QR đăng nhập Web.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
              disabled={permissionLoading}
            >
              {permissionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Cấp quyền</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannerWrap}>
            <CameraView
              onBarcodeScanned={scanState === 'scanning' ? handleBarCodeScanned : undefined}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.frame} />
            {scanState === 'processing' ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loadingText}>Đang kiểm tra...</Text>
              </View>
            ) : null}
          </View>
        )}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {renderActionCard()}
      </View>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  hero: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
  },
  subtitle: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  scannerWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '72%',
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default QrLoginScannerScreen;
