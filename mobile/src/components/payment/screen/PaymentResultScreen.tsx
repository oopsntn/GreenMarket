import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Button from '../../Reused/Button/Button';

/**
 * PaymentResultScreen
 *
 * Màn hình kết quả thanh toán - nhận params từ deep-link hoặc navigate trực tiếp:
 *   - status: 'success' | 'failed' | 'pending'
 *   - code?: string   (VNPay response code, '00' = success)
 *   - txnRef?: string (mã tham chiếu giao dịch)
 *   - message?: string
 *
 * Deep-link cho Expo Go:  exp://greenmarket.ddns.net:8081/--/payment-result?status=success&...
 * Deep-link cho APK:      greenmarket:///payment-result?status=success&...
 */
const PaymentResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { status, code, txnRef, message } = route.params || {};

    const isSuccess = status === 'success' || code === '00';
    const isFailed = status === 'failed' || (status && status !== 'success' && status !== 'pending');

    useEffect(() => {
        console.log('[PaymentResult] Received params:', { status, code, txnRef, message });
    }, []);

    const handleGoHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        });
    };

    const handleGoMyPosts = () => {
        navigation.navigate('MyPost');
    };

    const handleGoDashboard = () => {
        navigation.navigate('ShopDashboard');
    };

    if (isSuccess) {
        return (
            <MobileLayout title="Thanh toán">
                <View style={styles.container}>
                    <View style={styles.iconWrapper}>
                        <CheckCircle2 size={80} color="#10b981" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.title}>Thanh toán thành công!</Text>
                    <Text style={styles.subtitle}>
                        Giao dịch của bạn đã được xử lý thành công. Hệ thống sẽ cập nhật trạng thái trong giây lát.
                    </Text>
                    {txnRef ? (
                        <View style={styles.txnBox}>
                            <Text style={styles.txnLabel}>Mã giao dịch</Text>
                            <Text style={styles.txnRef}>{txnRef}</Text>
                        </View>
                    ) : null}
                    <Button onPress={handleGoMyPosts} style={styles.primaryBtn}>
                        Xem tin của tôi
                    </Button>
                    <Button variant="outline" onPress={handleGoDashboard} style={styles.secondaryBtn}>
                        Vào Dashboard cửa hàng
                    </Button>
                    <Button variant="outline" onPress={handleGoHome} style={styles.secondaryBtn}>
                        Về trang chủ
                    </Button>
                </View>
            </MobileLayout>
        );
    }

    if (isFailed) {
        return (
            <MobileLayout title="Thanh toán">
                <View style={styles.container}>
                    <View style={styles.iconWrapper}>
                        <XCircle size={80} color="#ef4444" strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.title, { color: '#ef4444' }]}>Thanh toán không thành công</Text>
                    <Text style={styles.subtitle}>
                        Giao dịch bị hủy hoặc gặp lỗi. Số tiền (nếu đã trừ) sẽ được hoàn lại theo quy định ngân hàng.
                    </Text>
                    {code && code !== '00' ? (
                        <View style={styles.txnBox}>
                            <Text style={styles.txnLabel}>Mã lỗi VNPay</Text>
                            <Text style={[styles.txnRef, { color: '#ef4444' }]}>{code}</Text>
                        </View>
                    ) : null}
                    <Button onPress={handleGoHome} style={styles.primaryBtn}>
                        Về trang chủ
                    </Button>
                    <Button variant="outline" onPress={handleGoMyPosts} style={styles.secondaryBtn}>
                        Xem tin của tôi
                    </Button>
                </View>
            </MobileLayout>
        );
    }

    // Pending / unknown
    return (
        <MobileLayout title="Thanh toán">
            <View style={styles.container}>
                <View style={styles.iconWrapper}>
                    <AlertCircle size={80} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <Text style={[styles.title, { color: '#d97706' }]}>Đang xử lý...</Text>
                <Text style={styles.subtitle}>
                    Giao dịch đang được xử lý. Vui lòng kiểm tra lại trạng thái sau ít phút trong mục quản lý tin đăng.
                </Text>
                {txnRef ? (
                    <View style={styles.txnBox}>
                        <Text style={styles.txnLabel}>Mã giao dịch</Text>
                        <Text style={styles.txnRef}>{txnRef}</Text>
                    </View>
                ) : null}
                <Button onPress={handleGoMyPosts} style={styles.primaryBtn}>
                    Xem tin của tôi
                </Button>
                <Button variant="outline" onPress={handleGoHome} style={styles.secondaryBtn}>
                    Về trang chủ
                </Button>
            </View>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
    },
    iconWrapper: {
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    txnBox: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    txnLabel: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    txnRef: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        letterSpacing: 0.5,
    },
    primaryBtn: {
        width: '100%',
        marginBottom: 12,
    },
    secondaryBtn: {
        width: '100%',
        marginBottom: 8,
    },
});

export default PaymentResultScreen;
