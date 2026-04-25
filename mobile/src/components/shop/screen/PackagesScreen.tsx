import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CheckCircle2, Crown, Rocket } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Card from '../../Reused/Card/Card';
import Button from '../../Reused/Button/Button';
import CustomAlert from '../../../utils/AlertHelper';
import { useAuth } from '../../../context/AuthContext';
import { postService } from '../../post/service/postService';
import { paymentService, PromotionPackage } from '../../payment/service/paymentService';

const formatVnd = (value: unknown) => {
    const amount = Number(value ?? 0);
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0)}đ`;
}

const formatVndOrFallback = (value: unknown, fallback = '--') => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }

    return formatVnd(value);
}

const PackagesScreen = () => {
    const navigation = useNavigation<any>();
    const { shop, isAuthenticated, refreshShop } = useAuth();
    const isOwner = !!shop && shop.shopStatus === 'active';

    const [loading, setLoading] = useState(true);
    const [pricingConfig, setPricingConfig] = useState<any>(null);
    const [vipPackage, setVipPackage] = useState<PromotionPackage | null>(null);
    const [boostPackages, setBoostPackages] = useState<PromotionPackage[]>([]);
    const [policy, setPolicy] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [pricingRes, vipRes, publicPackages] = await Promise.all([
                        paymentService.getPricingConfig(),
                        paymentService.getShopVipPackage().catch(() => null),
                        paymentService.getPackages().catch(() => []),
                    ]);

                    setPricingConfig(pricingRes);
                    setVipPackage(vipRes);
                    setBoostPackages(Array.isArray(publicPackages) ? publicPackages : []);

                    if (isAuthenticated) {
                        const resPolicy = await postService.getPostingPolicy().catch(() => null);
                        setPolicy(resPolicy);
                    }
                } catch (error) {
                    console.error('Error fetching packages info:', error);
                    CustomAlert('Lỗi', 'Không thể tải thông tin các gói.');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [isAuthenticated]),
    );

    const isVipActive = !!policy?.shopVipExpiry && new Date(policy.shopVipExpiry) > new Date();
    const isPersonalActive = !!policy?.planExpiresAt && new Date(policy.planExpiresAt) > new Date();

    const recommendedBoostPackage = useMemo(() => {
        if (!boostPackages.length) return null;

        return [...boostPackages]
            .sort((a, b) => {
                const aPerDay = a.promotionPackagePrice / Math.max(a.promotionPackageDurationDays, 1);
                const bPerDay = b.promotionPackagePrice / Math.max(b.promotionPackageDurationDays, 1);
                if (aPerDay !== bPerDay) return aPerDay - bPerDay;
                return b.promotionPackageDurationDays - a.promotionPackageDurationDays;
            })[0];
    }, [boostPackages]);

    const handleOpenPayment = async (paymentUrl?: string) => {
        if (!paymentUrl) {
            CustomAlert('Lỗi', 'Không tạo được liên kết thanh toán.');
            return;
        }

        await WebBrowser.openBrowserAsync(paymentUrl);
        await refreshShop();
    };

    const handleBuyVip = async () => {
        try {
            setProcessing(true);
            const res = await paymentService.buyShopVipPackage();
            await handleOpenPayment(res.paymentUrl);
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Đã xảy ra lỗi khi tạo thanh toán VIP.');
        } finally {
            setProcessing(false);
        }
    };

    const handleBuyPersonal = async () => {
        try {
            setProcessing(true);
            const res = await paymentService.buyPersonalPackage();
            await handleOpenPayment(res.paymentUrl);
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Đã xảy ra lỗi khi tạo thanh toán gói cá nhân.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <MobileLayout title="Các gói dịch vụ" backButton={() => navigation.goBack()}>
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="Các gói dịch vụ" backButton={() => navigation.goBack()}>
            <ScrollView contentContainerStyle={styles.container}>
                <Card style={[styles.card, { borderColor: '#d1fae5', backgroundColor: '#f0fdf4' }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{pricingConfig?.ownerPolicy?.planTitle || 'Chủ vườn vĩnh viễn'}</Text>
                        {isOwner ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Đang sử dụng</Text>
                            </View>
                        ) : null}
                    </View>
                    <Text style={styles.price}>{formatVnd(pricingConfig?.shopRegistrationPrice)}</Text>
                    <Text style={styles.desc}>Nâng cấp tài khoản lên chủ vườn để mở shop và đăng bài theo mô hình shop owner.</Text>
                    <View style={styles.featureList}>
                        <View style={styles.featureItem}><CheckCircle2 size={16} color="#10b981" /><Text style={styles.featureText}>Đăng bài ngay theo quyền shop owner</Text></View>
                        <View style={styles.featureItem}><CheckCircle2 size={16} color="#10b981" /><Text style={styles.featureText}>Phí đăng lẻ theo policy backend</Text></View>
                    </View>

                    {isOwner ? (
                        <Button variant="outline" onPress={() => navigation.navigate('ShopDashboard')}>Vào Dashboard Chủ Vườn</Button>
                    ) : isAuthenticated ? (
                        <Button onPress={() => navigation.navigate('RegisterShop')}>Đăng ký mở Shop</Button>
                    ) : (
                        <Button onPress={() => CustomAlert('Yêu cầu', 'Vui lòng đăng nhập.')}>Đăng nhập để mở Shop</Button>
                    )}
                </Card>

                <Card style={[styles.card, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Crown size={20} color="#d97706" />
                            <Text style={[styles.cardTitle, { color: '#92400e' }]}>Nhà vườn VIP</Text>
                        </View>
                        {isVipActive ? (
                            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                                <Text style={[styles.badgeText, { color: '#b45309' }]}>VIP kích hoạt</Text>
                            </View>
                        ) : null}
                    </View>
                    <Text style={[styles.price, { color: '#b45309' }]}>{formatVndOrFallback(vipPackage?.promotionPackagePrice)}</Text>
                    <Text style={styles.desc}>
                        {vipPackage
                            ? `Gói ${vipPackage.promotionPackageDurationDays} ngày. ${vipPackage.promotionPackageDescription || 'Ưu tiên hiển thị và nhận diện đặc biệt dành cho nhà vườn chuyên nghiệp.'}`
                            : 'Hiện chưa có dữ liệu gói VIP từ backend.'}
                    </Text>

                    {isOwner ? (
                        isVipActive ? (
                            <Button disabled style={{ backgroundColor: '#fbbf24' }}>ĐANG SỬ DỤNG</Button>
                        ) : (
                            <Button
                                loading={processing}
                                disabled={processing || !vipPackage}
                                onPress={handleBuyVip}
                                style={{ backgroundColor: '#111827' }}
                            >
                                Kích hoạt VIP
                            </Button>
                        )
                    ) : (
                        <Button variant="outline" onPress={() => navigation.navigate('RegisterShop')}>Mở Shop để mua VIP</Button>
                    )}
                </Card>

                {!isOwner ? (
                    <Card style={[styles.card, { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{pricingConfig?.personalPolicy?.planTitle || 'Gói cá nhân (tháng)'}</Text>
                            {isPersonalActive ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Đang sử dụng</Text>
                                </View>
                            ) : null}
                        </View>
                        <Text style={styles.price}>{formatVnd(pricingConfig?.personalMonthlyPrice)}</Text>
                        <Text style={styles.desc}>Dành cho người bán cá nhân đăng bài thường xuyên theo policy cá nhân từ backend.</Text>

                        {isAuthenticated ? (
                            isPersonalActive ? (
                                <Button disabled variant="outline">Đang kích hoạt</Button>
                            ) : (
                                <Button loading={processing} disabled={processing} onPress={handleBuyPersonal} style={{ backgroundColor: '#111827' }}>Đăng ký gói</Button>
                            )
                        ) : (
                            <Button onPress={() => CustomAlert('Yêu cầu', 'Vui lòng đăng nhập.')}>Đăng nhập để mua</Button>
                        )}
                    </Card>
                ) : null}

                <View style={styles.sectionHeader}>
                    <Rocket size={18} color="#10b981" />
                    <Text style={styles.sectionTitle}>Gói đẩy tin</Text>
                </View>

                {boostPackages.length === 0 ? (
                    <Card style={styles.card}>
                        <Text style={styles.desc}>Hiện backend chưa trả về gói đẩy tin công khai.</Text>
                    </Card>
                ) : (
                    boostPackages.map((pkg) => {
                        const isRecommended = recommendedBoostPackage?.promotionPackageId === pkg.promotionPackageId;
                        return (
                            <Card
                                key={pkg.promotionPackageId}
                                style={[
                                    styles.card,
                                    isRecommended && { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
                                ]}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{pkg.promotionPackageTitle}</Text>
                                    {isRecommended ? (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>Đề xuất</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text style={styles.price}>{formatVnd(pkg.promotionPackagePrice)}</Text>
                                <Text style={styles.desc}>
                                    {pkg.promotionPackageDescription || 'Gói ưu tiên hiển thị cho bài đăng đã được duyệt.'}
                                </Text>
                                <Text style={styles.metaText}>Thời hạn: {pkg.promotionPackageDurationDays} ngày</Text>
                                {pkg.slotTitle ? <Text style={styles.metaText}>Vị trí: {pkg.slotTitle}</Text> : null}
                                <Button variant="outline" onPress={() => navigation.navigate('MyPost')}>
                                    Chọn bài để mua gói này
                                </Button>
                            </Card>
                        );
                    })
                )}
            </ScrollView>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    card: {
        padding: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    cardTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    badge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#047857',
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 24,
        fontWeight: '800',
        color: '#047857',
        marginBottom: 8,
    },
    desc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 16,
    },
    metaText: {
        fontSize: 12,
        color: '#475569',
        marginBottom: 6,
    },
    featureList: {
        marginBottom: 16,
        gap: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 13,
        color: '#334155',
    }
});

export default PackagesScreen;
