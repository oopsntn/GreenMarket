import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Store, MapPin, Phone, MessageCircle, Info, ExternalLink } from 'lucide-react-native';

interface ShopHeaderProps {
    shop: any;
    isOwner: boolean;
    styles: any;
}

const ShopHeader = ({ shop, isOwner, styles }: ShopHeaderProps) => {
    if (!shop) return null;

    // Hàm mở bản đồ chuyên dụng trên Mobile
    const openMap = () => {
        const label = shop.shopName;
        const lat = shop.shopLat;
        const lng = shop.shopLng;
        const location = shop.shopLocation;

        const url = Platform.select({
            ios: lat && lng ? `maps:0,0?q=${label}@${lat},${lng}` : `maps:0,0?q=${location}`,
            android: lat && lng ? `geo:${lat},${lng}?q=${lat},${lng}(${label})` : `geo:0,0?q=${location}`,
        });

        if (url) Linking.openURL(url);
    };

    const makeCall = () => Linking.openURL(`tel:${shop.shopPhone}`);
    const openZalo = () => Linking.openURL(`https://zalo.me/${shop.shopPhone}`);

    return (
        <View style={styles.headerCard}>
            {/* Phần thông tin chính */}
            <View style={styles.headerTop}>
                <View style={styles.shopAvatar}>
                    <Store size={40} color="#10b981" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.shopName}>{shop.shopName}</Text>
                    <View style={styles.verifyBadge}>
                        <Text style={styles.verifyText}>NHÀ VƯỜN UY TÍN</Text>
                    </View>
                </View>
            </View>

            {/* Thông tin địa chỉ và SĐT */}
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <MapPin size={16} color="#10b981" />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {shop.shopLocation || 'Chưa cập nhật địa chỉ'}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Phone size={16} color="#10b981" />
                    <Text style={styles.infoText}>{shop.shopPhone || 'Chưa có SĐT'}</Text>
                </View>
            </View>

            {/* Mô tả vườn */}
            <View style={{ marginTop: 15, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 12 }}>
                <Text style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
                    "{shop.shopDescription || 'Nhà vườn chưa có mô tả chi tiết.'}"
                </Text>
            </View>

            {/* Phần Bản đồ & Nút bấm (Chỉ hiện khi có đủ data) */}
            <TouchableOpacity style={styles.mapPreview} onPress={openMap}>
                <View style={styles.mapOverlay}>
                    <ExternalLink size={16} color="#10b981" />
                    <Text style={styles.mapLinkText}>Xem trên Google Maps</Text>
                </View>
            </TouchableOpacity>

            {/* Phân chia nút bấm: Nếu là Khách thì hiện Zalo, nếu là Chủ thì hiện thông báo */}
            {!isOwner ? (
                <TouchableOpacity style={styles.zaloBtn} onPress={openZalo}>
                    <MessageCircle size={20} color="#fff" />
                    <Text style={styles.zaloBtnText}>Liên hệ qua Zalo</Text>
                </TouchableOpacity>
            ) : (
                <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
                    <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                        Bạn đang xem vườn với tư cách chủ vườn
                    </Text>
                </View>
            )}
        </View>
    );
};

export default ShopHeader;