import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const pollAfterPayment = async (maxRetries = 6, delayMs = 2500) => {
        // Ở đây mình chỉ poll mềm để chờ backend/IPN cập nhật.
        // Nếu sau này có endpoint lấy chi tiết post mới nhất, bạn có thể gọi tại đây.
        for (let i = 0; i < maxRetries; i++) {
            await sleep(delayMs);
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
        } catch (error) {
            console.error('Error fetching packages:', error);
            CustomAlert('Lỗi', 'Không thể tải các gói đẩy tin.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!post?.postId) {
            CustomAlert('Lỗi', 'Không tìm thấy thông tin bài đăng.');
            return;
        }

        if (!selectedPackage) {
            CustomAlert('Yêu cầu chọn', 'Vui lòng chọn một gói đẩy tin trước.');
            return;
        }

        try {
            setProcessing(true);

            const res = await paymentService.buyPackage(
                post.postId,
                selectedPackage.promotionPackageId
            );

            console.log('[PromotePost] buyPackage response:', res);

            const paymentUrl =
                res?.paymentUrl ||
                res?.url ||
                res?.checkoutUrl;

            if (!paymentUrl) {
                CustomAlert('Lỗi', 'Không thể tạo liên kết thanh toán.');
                return;
            }

            const browserResult = await WebBrowser.openBrowserAsync(paymentUrl);
            console.log('[PromotePost] Browser result:', browserResult);

            // Chờ backend/IPN cập nhật
            await pollAfterPayment();

            CustomAlert(
                'Đã mở cổng thanh toán',
                'Sau khi hoàn tất thanh toán, hệ thống sẽ cập nhật trạng thái đẩy tin. Vui lòng kiểm tra lại trong quản lý tin đăng hoặc bảng điều khiển cửa hàng.',
                [
                    {
                        text: 'Về quản lý tin',
                        onPress: () => navigation.navigate('MyPost')
                    },
                    {
                        text: 'Tới dashboard',
                        onPress: () => navigation.replace('ShopDashboard')
                    }
                ]
            );
        } catch (error: any) {
            console.error('Promotion error:', error);
            CustomAlert(
                'Lỗi',
                error?.response?.data?.error ||
                error?.message ||
                'Đã xảy ra lỗi trong quá trình thanh toán.'
            );
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
