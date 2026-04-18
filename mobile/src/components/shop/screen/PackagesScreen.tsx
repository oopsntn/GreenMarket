import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CheckCircle2, Crown, Store, User } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Card from '../../Reused/Card/Card';
import Button from '../../Reused/Button/Button';
import CustomAlert from '../../../utils/AlertHelper';
import { useAuth } from '../../../context/AuthContext';
import { postService } from '../../post/service/postService';
import { paymentService, PromotionPackage } from '../../payment/service/paymentService';

const PackagesScreen = () => {
    const navigation = useNavigation<any>();
    const { shop, isAuthenticated, refreshShop } = useAuth();
    const isOwner = !!shop && shop.shopStatus === 'active';

    const [loading, setLoading] = useState(true);
    const [pricingConfig, setPricingConfig] = useState<any>(null);
    const [vipPackage, setVipPackage] = useState<PromotionPackage | null>(null);
    const [policy, setPolicy] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pricingRes, vipRes] = await Promise.all([
                paymentService.getPricingConfig(),
                paymentService.getShopVipPackage().catch(() => null),
            ]);
            setPricingConfig(pricingRes);
            setVipPackage(vipRes);

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

    const isVipActive = !!policy?.shopVipExpiry && new Date(policy.shopVipExpiry) > new Date();
    const isPersonalActive = !!policy?.planExpiresAt && new Date(policy.planExpiresAt) > new Date();

    const handleBuyVip = async () => {
        try {
            setProcessing(true);
            const res = await paymentService.buyShopVipPackage();
            if (res.paymentUrl) {
                await WebBrowser.openBrowserAsync(res.paymentUrl);
                // When browser closes, refresh auth and pricing data
                await refreshShop();
                await fetchData();
            }
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Đã xảy ra lỗi.');
        } finally {
            setProcessing(false);
        }
    };

    const handleBuyPersonal = async () => {
        try {
            setProcessing(true);
            const res = await paymentService.buyPersonalPackage();
            if (res.paymentUrl) {
                await WebBrowser.openBrowserAsync(res.paymentUrl);
                // When browser closes, refresh auth and pricing data
                await refreshShop();
                await fetchData();
            }
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Đã xảy ra lỗi.');
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (price: number | undefined) => {
        return new Intl.NumberFormat('en-US').format(price || 0) + ' VND';
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

                {/* Gói Mở Cửa Hàng (Owner) */}
                <Card style={[styles.card, { borderColor: '#d1fae5', backgroundColor: '#f0fdf4' }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Chủ vườn vĩnh viễn</Text>
                        {isOwner && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Đang sử dụng</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.price}>{formatPrice(pricingConfig?.shopRegistrationPrice)}</Text>
                    <Text style={styles.desc}>Nâng cấp tài khoản lên chủ vườn, phù hợp người bán chuyên nghiệp.</Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureItem}><CheckCircle2 size={16} color="#10b981" /><Text style={styles.featureText}>Đăng bài không chờ duyệt</Text></View>
                        <View style={styles.featureItem}><CheckCircle2 size={16} color="#10b981" /><Text style={styles.featureText}>Tính năng Shop nâng cao</Text></View>
                    </View>

                    {isOwner ? (
                        <Button variant="outline" onPress={() => navigation.navigate('ShopDashboard')}>Vào Dashboard Chủ Vườn</Button>
                    ) : isAuthenticated ? (
                        <Button onPress={() => navigation.navigate('RegisterShop')}>Đăng kí mở Shop</Button>
                    ) : (
                        <Button onPress={() => CustomAlert('Yêu cầu', 'Vui lòng đăng nhập.')}>Đăng nhập để mở Shop</Button>
                    )}
                </Card>

                {/* Gói Nhà Vườn VIP */}
                <Card style={[styles.card, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Crown size={20} color="#d97706" />
                            <Text style={[styles.cardTitle, { color: '#92400e' }]}>Nhà vườn VIP</Text>
                        </View>
                        {isVipActive && (
                            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                                <Text style={[styles.badgeText, { color: '#b45309' }]}>VIP Kích Hoạt</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.price, { color: '#b45309' }]}>{formatPrice(vipPackage?.promotionPackagePrice)}</Text>
                    <Text style={styles.desc}>Gói {vipPackage?.promotionPackageDurationDays || 90} ngày. Ưu tiên hiển thị và nhận diện đặc biệt dành cho nhà vườn chuyên nghiệp.</Text>

                    {isOwner ? (
                        isVipActive ? (
                            <Button disabled style={{ backgroundColor: '#fbbf24' }}>ĐANG SỬ DỤNG</Button>
                        ) : (
                            <Button loading={processing} disabled={processing} onPress={handleBuyVip} style={{ backgroundColor: '#111827' }}>Kích hoạt VIP</Button>
                        )
                    ) : (
                        <Button variant="outline" onPress={() => navigation.navigate('RegisterShop')}>Mở Shop để mua VIP</Button>
                    )}
                </Card>

                {/* Gói Cánh Nhân */}
                {!isOwner && (
                    <Card style={[styles.card, { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Gói Cá Nhân (Tháng)</Text>
                            {isPersonalActive && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Đang sử dụng</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.price}>{formatPrice(pricingConfig?.personalMonthlyPrice)} <Text style={{ fontSize: 14, fontWeight: '400', color: '#64748b' }}>/ tháng</Text></Text>
                        <Text style={styles.desc}>Dành cho người chơi cây nhỏ lẻ nhưng đăng bài thường xuyên.</Text>

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
    card: {
        padding: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
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
