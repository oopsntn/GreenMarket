import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Button from '../../Reused/Button/Button'
import { useAuth } from '../../../context/AuthContext'

type PaymentType = 'shop' | 'vip' | 'personal' | 'promote'

const PAYMENT_ACTIONS: Record<PaymentType, { primaryLabel: string; primaryRoute: string; secondaryLabel: string; secondaryRoute: string }> = {
    shop: {
        primaryLabel: 'Xem cửa hàng của tôi',
        primaryRoute: 'MyShop',
        secondaryLabel: 'Vào Dashboard cửa hàng',
        secondaryRoute: 'ShopDashboard',
    },
    vip: {
        primaryLabel: 'Vào Dashboard cửa hàng',
        primaryRoute: 'ShopDashboard',
        secondaryLabel: 'Xem gói dịch vụ',
        secondaryRoute: 'Packages',
    },
    personal: {
        primaryLabel: 'Xem tài khoản',
        primaryRoute: 'PersonalDashboard',
        secondaryLabel: 'Xem gói dịch vụ',
        secondaryRoute: 'Packages',
    },
    promote: {
        primaryLabel: 'Xem tin của tôi',
        primaryRoute: 'MyPost',
        secondaryLabel: 'Vào Dashboard cửa hàng',
        secondaryRoute: 'ShopDashboard',
    },
}

const PaymentResultScreen = () => {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const { refreshShop } = useAuth()

    const { status, code, txnRef, message, type = 'promote' } = route.params || {}
    const paymentType: PaymentType = PAYMENT_ACTIONS[type as PaymentType] ? type : 'promote'
    const actionConfig = PAYMENT_ACTIONS[paymentType]

    const isSuccess = status === 'success' || code === '00'
    const isFailed = status === 'failed' || (status && status !== 'success' && status !== 'pending')

    useEffect(() => {
        console.log('[PaymentResult] Received params:', { status, code, txnRef, message, type: paymentType })
    }, [status, code, txnRef, message, paymentType])

    useEffect(() => {
        if (!['shop', 'vip', 'promote'].includes(paymentType)) return

        refreshShop().catch((error) => {
            console.error('[PaymentResult] refreshShop failed:', error)
        })
    }, [paymentType, refreshShop])

    const handleGoHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        })
    }

    const handlePrimaryAction = async () => {
        if (['shop', 'vip', 'promote'].includes(paymentType)) {
            await refreshShop().catch((error) => {
                console.error('[PaymentResult] refreshShop before primary action failed:', error)
            })
        }

        navigation.navigate(actionConfig.primaryRoute)
    }

    const handleSecondaryAction = async () => {
        if (['shop', 'vip', 'promote'].includes(paymentType)) {
            await refreshShop().catch((error) => {
                console.error('[PaymentResult] refreshShop before secondary action failed:', error)
            })
        }

        navigation.navigate(actionConfig.secondaryRoute)
    }

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
                    <Button onPress={handlePrimaryAction} style={styles.primaryBtn}>
                        {actionConfig.primaryLabel}
                    </Button>
                    <Button variant="outline" onPress={handleSecondaryAction} style={styles.secondaryBtn}>
                        {actionConfig.secondaryLabel}
                    </Button>
                    <Button variant="outline" onPress={handleGoHome} style={styles.secondaryBtn}>
                        Về trang chủ
                    </Button>
                </View>
            </MobileLayout>
        )
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
                    <Button variant="outline" onPress={handlePrimaryAction} style={styles.secondaryBtn}>
                        {actionConfig.primaryLabel}
                    </Button>
                </View>
            </MobileLayout>
        )
    }

    return (
        <MobileLayout title="Thanh toán">
            <View style={styles.container}>
                <View style={styles.iconWrapper}>
                    <AlertCircle size={80} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <Text style={[styles.title, { color: '#d97706' }]}>Đang xử lý...</Text>
                <Text style={styles.subtitle}>
                    Giao dịch đang được xử lý. Vui lòng kiểm tra lại trạng thái sau ít phút trong mục phù hợp.
                </Text>
                {txnRef ? (
                    <View style={styles.txnBox}>
                        <Text style={styles.txnLabel}>Mã giao dịch</Text>
                        <Text style={styles.txnRef}>{txnRef}</Text>
                    </View>
                ) : null}
                <Button onPress={handlePrimaryAction} style={styles.primaryBtn}>
                    {actionConfig.primaryLabel}
                </Button>
                <Button variant="outline" onPress={handleGoHome} style={styles.secondaryBtn}>
                    Về trang chủ
                </Button>
            </View>
        </MobileLayout>
    )
}

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
})

export default PaymentResultScreen
