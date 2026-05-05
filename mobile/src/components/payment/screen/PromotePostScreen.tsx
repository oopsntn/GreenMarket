import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, CreditCard, Rocket, ShieldCheck } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Card from '../../Reused/Card/Card';
import Button from '../../Reused/Button/Button';
import { paymentService, PromotionPackage } from '../service/paymentService';
import CustomAlert from '../../../utils/AlertHelper';

const PromotePostScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { post } = route.params;

    const [packages, setPackages] = useState<PromotionPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<PromotionPackage | null>(null);
    const [processing, setProcessing] = useState(false);
    const [audienceReason, setAudienceReason] = useState<string>('');

    useEffect(() => {
        fetchPackages();
    }, []);

    const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

    const getPromotionErrorAlert = (error: any) => {
        const errorCode = error?.response?.data?.code;

        if (errorCode === 'PLACEMENT_SLOT_FULL') {
            return {
                title: 'Vị trí này đang tạm hết chỗ',
                message: 'Gói bạn chọn hiện đã đủ số lượng hiển thị. Bạn vui lòng chọn vị trí khác hoặc thử lại sau nhé.',
            };
        }

        if (error?.response?.status === 409) {
            return {
                title: 'Chưa thể áp dụng gói này',
                message:
                    error?.response?.data?.error ||
                    'Gói bạn chọn hiện chưa thể dùng cho bài đăng này. Bạn thử một gói khác giúp mình nhé.',
            };
        }

        return {
            title: 'Chưa thể tiếp tục',
            message:
                error?.response?.data?.error ||
                error?.message ||
                'Hiện tại hệ thống chưa xử lý được yêu cầu này. Bạn vui lòng thử lại sau nhé.',
        };
    };

    const pollAfterPayment = async (maxRetries = 6, delayMs = 2500) => {
        for (let i = 0; i < maxRetries; i++) {
            await sleep(delayMs);
        }
    };

    // Mở browser thanh toán và lắng nghe deep-link trả về từ VNPay
    const openPaymentBrowser = async (paymentUrl: string) => {
        // Dùng ref để tránh navigate nhiều lần nếu listener bị gọi nhiều lần
        const navigatedRef = { current: false };

        const subscription = Linking.addEventListener('url', (event) => {
            if (navigatedRef.current) return;
            const url = event.url;
            // Kiểm tra xem URL có phải từ VNPay redirect về app không
            if (url && (url.includes('payment-result') || url.includes('vnpay-return'))) {
                navigatedRef.current = true;
                subscription.remove();

                // Parse params từ URL
                const getParam = (u: string, key: string): string | undefined => {
                    const match = u.match(new RegExp('[?&]' + key + '=([^&]*)'));
                    return match ? decodeURIComponent(match[1]) : undefined;
                };
                const status = getParam(url, 'status') || (getParam(url, 'vnp_ResponseCode') === '00' ? 'success' : 'failed');
                const code = getParam(url, 'code') || getParam(url, 'vnp_ResponseCode') || undefined;
                const txnRef = getParam(url, 'txnRef') || getParam(url, 'vnp_TxnRef') || undefined;

                navigation.navigate('PaymentResult', { status, code, txnRef });
            }
        });

        await WebBrowser.openBrowserAsync(paymentUrl);

        // Browser đã đóng nhưng chưa nhận deep-link → chuyển đến màn hình chờ
        subscription.remove();
        if (!navigatedRef.current) {
            navigation.navigate('PaymentPending', { type: 'promote', postId: post?.postId });
        }
    };

    const fetchPackages = async () => {
        try {
            setLoading(true);

            try {
                const eligibleRes = await paymentService.getEligiblePackages();
                const eligiblePackages = Array.isArray(eligibleRes?.packages) ? eligibleRes.packages : [];
                setPackages(eligiblePackages);
                setAudienceReason(eligibleRes?.reason || '');

                if (eligiblePackages.length > 0) {
                    setSelectedPackage(eligiblePackages[0]);
                }
                return;
            } catch (eligibleError) {
                console.warn('Eligible packages failed, fallback to all packages:', eligibleError);
            }

            const res = await paymentService.getPackages();
            const allPackages = Array.isArray(res) ? res : [];
            setPackages(allPackages);

            if (allPackages.length > 0) {
                setSelectedPackage(allPackages[0]);
            }
        } catch (_error) {
            CustomAlert('Chưa tải được gói đẩy tin', 'Hiện tại hệ thống chưa lấy được danh sách gói. Bạn thử lại sau nhé.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!post?.postId) {
            CustomAlert('Chưa thể tiếp tục', 'Hiện chưa tìm thấy thông tin bài đăng để đẩy tin.');
            return;
        }

        if (!selectedPackage) {
            CustomAlert('Chọn giúp một gói nhé', 'Bạn vui lòng chọn một gói đẩy tin trước khi tiếp tục thanh toán.');
            return;
        }

        try {
            setProcessing(true);

            const res = await paymentService.buyPackage(
                post.postId,
                selectedPackage.promotionPackageId
            );

            const paymentUrl =
                res?.paymentUrl ||
                res?.url ||
                res?.checkoutUrl;

            if (!paymentUrl) {
                CustomAlert('Chưa tạo được liên kết thanh toán', 'Hệ thống chưa chuẩn bị xong trang thanh toán. Bạn thử lại sau nhé.');
                return;
            }

            await openPaymentBrowser(paymentUrl);
        } catch (error: any) {
            const alertContent = getPromotionErrorAlert(error);
            CustomAlert(alertContent.title, alertContent.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <MobileLayout title="Đẩy tin đăng" backButton={() => navigation.goBack()}>
            <View style={styles.container}>
                <Card style={styles.postCard}>
                    <View style={styles.postHeader}>
                        <Rocket size={20} color="#8b5cf6" />
                        <Text style={styles.postTitle} numberOfLines={1}>
                            Đang đẩy: {post?.postTitle || 'Bài đăng'}
                        </Text>
                    </View>
                    <Text style={styles.postDesc}>
                        Đẩy tin sẽ giúp bài viết của bạn xuất hiện ở đầu kết quả tìm kiếm, tăng lượt xem và tương tác.
                    </Text>
                </Card>

                <Text style={styles.sectionTitle}>Chọn một gói</Text>

                {audienceReason ? (
                    <Text style={styles.reasonText}>{audienceReason}</Text>
                ) : null}

                {loading ? (
                    <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
                ) : packages.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Chưa có gói phù hợp</Text>
                        <Text style={styles.emptyText}>
                            Hiện tại bạn chưa có gói đẩy tin phù hợp để sử dụng cho bài đăng này.
                        </Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {packages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.promotionPackageId}
                                onPress={() => setSelectedPackage(pkg)}
                                activeOpacity={0.7}
                            >
                                <Card
                                    style={[
                                        styles.packageCard,
                                        selectedPackage?.promotionPackageId === pkg.promotionPackageId && styles.selectedCard
                                    ]}
                                >
                                    <View style={styles.packageInfo}>
                                        <View style={styles.pkgMain}>
                                            <Text style={styles.pkgTitle}>{pkg.promotionPackageTitle}</Text>
                                            <Text style={styles.pkgDuration}>
                                                Gói {pkg.promotionPackageDurationDays} ngày
                                            </Text>
                                            <Text style={styles.pkgMeta}>
                                                {pkg.slotTitle || pkg.slotCode || 'Vị trí tiêu chuẩn'}
                                                {pkg.slotRules?.priority
                                                    ? ` • Ưu tiên ${pkg.slotRules.priority}`
                                                    : ''}
                                            </Text>
                                        </View>

                                        <Text style={styles.pkgPrice}>
                                            {new Intl.NumberFormat('vi-VN').format(pkg.promotionPackagePrice)}đ
                                        </Text>
                                    </View>

                                    {selectedPackage?.promotionPackageId === pkg.promotionPackageId && (
                                        <View style={styles.checkIcon}>
                                            <CheckCircle2 size={24} color="#10b981" />
                                        </View>
                                    )}
                                </Card>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.guaranteeBox}>
                            <ShieldCheck size={16} color="#059669" />
                            <Text style={styles.guaranteeText}>
                                Thanh toán an toàn qua cổng tích hợp sẵn
                            </Text>
                        </View>
                    </ScrollView>
                )}
            </View>

            <View style={styles.bottomBar}>
                <Button
                    variant="primary"
                    icon={<CreditCard size={20} color="#fff" />}
                    loading={processing}
                    disabled={processing || !selectedPackage || packages.length === 0}
                    onPress={handlePromote}
                    style={styles.payBtn}
                >
                    Tiến hành thanh toán
                </Button>
            </View>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    postCard: {
        padding: 16,
        backgroundColor: '#f5f3ff',
        borderColor: '#ddd6fe',
        borderWidth: 1,
        marginBottom: 24,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    postTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4c1d95',
    },
    postDesc: {
        fontSize: 13,
        color: '#6d28d9',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    reasonText: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
    },
    emptyBox: {
        marginTop: 24,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 18,
    },
    packageCard: {
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f3f4f6',
    },
    selectedCard: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    packageInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pkgMain: {
        flex: 1,
        paddingRight: 12,
    },
    pkgTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    pkgDuration: {
        fontSize: 12,
        color: '#6b7280',
    },
    pkgMeta: {
        marginTop: 4,
        fontSize: 11,
        color: '#64748b',
    },
    pkgPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10b981',
    },
    checkIcon: {
        marginLeft: 12,
    },
    guaranteeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        marginBottom: 30,
    },
    guaranteeText: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    payBtn: {
        height: 52,
    }
});

export default PromotePostScreen;
