import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Clock, CreditCard, Crown, Home, Rocket, Store } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Button from '../../Reused/Button/Button';
import { useAuth } from '@/context/AuthContext';
import CustomAlert from '@/utils/AlertHelper';

type PaymentType = 'shop' | 'vip' | 'personal' | 'promote';

interface TypeConfig {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
}

const TYPE_CONFIG: Record<PaymentType, TypeConfig> = {
    shop: {
        icon: <Store size={44} color="#10b981" />,
        iconBg: '#d1fae5',
        title: 'Đang chờ kích hoạt cửa hàng',
        description:
            'Nếu bạn đã hoàn tất thanh toán, hệ thống sẽ kích hoạt cửa hàng của bạn trong giây lát. Bạn có thể nhấn "Xem cửa hàng" để kiểm tra trạng thái.',
        actionLabel: 'Xem cửa hàng của tôi',
        actionRoute: 'MyShop',
    },
    vip: {
        icon: <Crown size={44} color="#d97706" />,
        iconBg: '#fef3c7',
        title: 'Đang chờ kích hoạt VIP',
        description:
            'Nếu bạn đã hoàn tất thanh toán, quyền VIP của cửa hàng sẽ được kích hoạt trong vài phút. Bạn có thể kiểm tra trong trang gói dịch vụ.',
        actionLabel: 'Xem gói dịch vụ',
        actionRoute: 'Packages',
    },
    personal: {
        icon: <CreditCard size={44} color="#2563eb" />,
        iconBg: '#dbeafe',
        title: 'Đang chờ kích hoạt gói cá nhân',
        description:
            'Nếu bạn đã hoàn tất thanh toán, gói cá nhân của bạn sẽ được kích hoạt trong vài phút. Bạn có thể kiểm tra trong trang tài khoản của mình.',
        actionLabel: 'Xem tài khoản',
        actionRoute: 'PersonalDashboard',
    },
    promote: {
        icon: <Rocket size={44} color="#8b5cf6" />,
        iconBg: '#ede9fe',
        title: 'Đang chờ xác nhận đẩy tin',
        description:
            'Nếu bạn đã hoàn tất thanh toán, bài đăng của bạn sẽ được ưu tiên hiển thị trong vài phút. Bạn có thể theo dõi trạng thái trong quản lý tin đăng.',
        actionLabel: 'Xem tin của tôi',
        actionRoute: 'MyPost',
    },
};

/**
 * PaymentPendingScreen
 *
 * Màn hình chờ xác nhận thanh toán — hiển thị khi người dùng đóng browser VNPay
 * mà không có deep-link trả về (fallback từ openPaymentBrowser).
 *
 * Params:
 *   - type: 'shop' | 'vip' | 'personal' | 'promote'
 *   - txnRef?: string  (mã tham chiếu giao dịch nếu có)
 */
const PaymentPendingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { type = 'shop', txnRef } = route.params || {};
    const { refreshShop } = useAuth()
    const [refreshing, setRefreshing] = useState(false);
    const config: TypeConfig = TYPE_CONFIG[type as PaymentType] ?? TYPE_CONFIG.shop;

    // Pulse animation cho icon
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    const handleGoHome = () => {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    };

    const handleGoAction = () => {
        navigation.navigate(config.actionRoute);
    };

    const handleReload = async () => {
        try {
            setRefreshing(true);

            if (type === 'shop' || type === 'vip') {
                await refreshShop();
            }

            CustomAlert('Đã tải lại', 'Hệ thống đã cập nhật lại trạng thái mới nhất.');
        } catch (error: any) {
            CustomAlert(
                'Chưa tải lại được',
                error?.response?.data?.error || 'Không thể kiểm tra trạng thái thanh toán lúc này.'
            );
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <MobileLayout title="Trạng thái thanh toán">
            <View style={styles.container}>
                {/* Animated icon */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 20 }}>
                    <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
                        {config.icon}
                    </View>
                </Animated.View>

                {/* Spinner */}
                <ActivityIndicator size="large" color="#10b981" style={styles.spinner} />

                {/* Title & description */}
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.description}>{config.description}</Text>

                {/* TxnRef */}
                {txnRef ? (
                    <View style={styles.txnBox}>
                        <Text style={styles.txnLabel}>Mã giao dịch</Text>
                        <Text style={styles.txnRef}>{txnRef}</Text>
                    </View>
                ) : null}

                {/* Hint */}
                <View style={styles.hint}>
                    <Clock size={14} color="#f59e0b" />
                    <Text style={styles.hintText}>
                        Xác nhận thường mất 1–5 phút. Nếu chưa thấy thay đổi, hãy kiểm tra lại sau.
                    </Text>
                </View>

                <Button
                    loading={refreshing}
                    disabled={refreshing}
                    onPress={handleReload}
                    style={styles.reloadBtn}
                >
                    Đã thanh toán? Tải lại ngay
                </Button>

                {/* Action buttons */}
                <Button onPress={handleGoAction} style={styles.primaryBtn}>
                    {config.actionLabel}
                </Button>

                <Button
                    variant="outline"
                    onPress={handleGoHome}
                    style={styles.secondaryBtn}
                    icon={<Home size={18} color="#10b981" />}
                >
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
    reloadBtn: {
        width: '100%',
        backgroundColor: '#111827',
        marginBottom: 12,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    txnBox: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 20,
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
    hint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fde68a',
        borderRadius: 10,
        padding: 12,
        marginBottom: 24,
        width: '100%',
    },
    hintText: {
        flex: 1,
        fontSize: 12,
        color: '#92400e',
        lineHeight: 18,
    },
    primaryBtn: {
        width: '100%',
        marginBottom: 12,
    },
    secondaryBtn: {
        width: '100%',
    },
});

export default PaymentPendingScreen;
