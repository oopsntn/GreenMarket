import React, { useState, useMemo } from 'react'
import { Dimensions, FlatList, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Camera, ExternalLink, MapPin, MessageCircle, Phone, Play, Store, User } from 'lucide-react-native'
import { ShopService } from '../service/shopService'

interface ShopHeaderProps {
    shop: any;
    isOwner: boolean;
    styles?: any;
}

const SCREEN_W = Dimensions.get('window').width

const ShopHeader = ({ shop, isOwner }: ShopHeaderProps) => {
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)

    // gallery đã được normalize thành string[] trong shopService
    const gallery: string[] = useMemo(() => {
        if (!shop.shopGalleryImages) return []
        if (Array.isArray(shop.shopGalleryImages)) return shop.shopGalleryImages.filter(Boolean)
        if (typeof shop.shopGalleryImages === 'string')
            return shop.shopGalleryImages.split('|').map(s => s.trim()).filter(Boolean)
        return []
    }, [shop.shopGalleryImages])

    if (!shop) return null

    const primaryPhone = shop.shopPhone || shop.phones?.[0] || ''

    const openMap = () => {
        if (!shop.shopLocation && (!shop.shopLat || !shop.shopLng)) {
            return
        }

        const label = encodeURIComponent(shop.shopName || 'Shop')
        const lat = parseFloat(shop.shopLat)
        const lng = parseFloat(shop.shopLng)
        const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
        const location = encodeURIComponent(shop.shopLocation || label)

        //1. Chay tren trinh duyet web thi mo Google Maps voi query la dia chi hoac lat/lng
        if (Platform.OS === 'web') {
            const url = 'https://www.google.com/maps/search/?api=1&query='
            let webUrl = `${url}${location}`
            if (hasCoords) {
                webUrl = `${url}${lat},${lng}`
            }
            Linking.openURL(webUrl)
            return;
        }

        //2. Chay tren Mobile thi mo app Maps mac dinh tren may voi query la dia chi hoac lat/lng
        let mobileUrl = ''
        if (Platform.OS === 'ios') {
            mobileUrl = hasCoords ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}` : `http://maps.apple.com/?q=${location}`
        } else if (Platform.OS === 'android') {
            mobileUrl = hasCoords ? `geo:${lat},${lng}?q=${label}` : `geo:0,0?q=${location}`
        }
        //Neu may khong co app Maps mac dinh thi mo Google Maps tren trinh duyet
        Linking.openURL(mobileUrl).catch(() => {
            const fallbackUrl = hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${location}`
            Linking.openURL(fallbackUrl)
        })

    }

    const makeCall = () => {
        if (primaryPhone) {
            Linking.openURL(`tel:${primaryPhone.replace(/\s+/g, '')}`)
            if (!isOwner && shop?.shopId) {
                ShopService.recordShopContactClick(shop.shopId).catch(console.error)
            }
        }
    }

    const openZalo = () => {
        if (primaryPhone) {
            Linking.openURL(`https://zalo.me/${primaryPhone.replace(/\s+/g, '')}`)
            if (!isOwner && shop?.shopId) {
                ShopService.recordShopContactClick(shop.shopId).catch(console.error)
            }
        }
    }

    return (
        <View style={styles.headerCard}>
            {gallery.length > 0 ? (
                <View>
                    <FlatList
                        data={gallery}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => index.toString()}
                        onMomentumScrollEnd={(e) => {
                            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)
                            setActiveGalleryIndex(idx)
                        }}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={[styles.coverImage, { width: SCREEN_W }]}
                                resizeMode="cover"
                            />
                        )}
                    />
                    {gallery.length > 1 && (
                        <View style={styles.dotRow}>
                            {gallery.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === activeGalleryIndex && styles.dotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            ) : shop.shopCoverUrl ? (
                <Image source={{ uri: shop.shopCoverUrl }} style={[styles.coverImage, { width: SCREEN_W }]} resizeMode="cover" />
            ) : null}

            <View style={styles.headerTop}>
                <View style={styles.shopAvatar}>
                    {shop.shopLogoUrl ? (
                        <Image source={{ uri: shop.shopLogoUrl }} style={styles.logoImage} />
                    ) : (
                        <Store size={36} color="#10b981" />
                    )}
                </View>

                <View style={styles.headerInfo}>
                    <Text style={styles.shopName}>{shop.shopName}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {shop.shopStatus === 'active' ? 'HOẠT ĐỘNG' : 'CHỜ DUYỆT'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <MapPin size={16} color="#10b981" />
                    <Text style={styles.infoText} numberOfLines={2}>
                        {shop.shopLocation || 'Chưa cập nhật địa chỉ'}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Phone size={16} color="#10b981" />
                    <Text style={styles.infoText}>
                        {primaryPhone || 'Chưa có số điện thoại'}
                    </Text>
                </View>
            </View>

            <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                    {shop.shopDescription || 'Cửa hàng này chưa có mô tả chi tiết.'}
                </Text>
            </View>

            {shop.shopLocation || (shop.shopLat && shop.shopLng) ? (
                <TouchableOpacity style={styles.mapPreview} onPress={openMap}>
                    <ExternalLink size={16} color="#10b981" />
                    <Text style={styles.mapLinkText}>Mở vị trí trên bản đồ</Text>
                </TouchableOpacity>
            ) : null}

            {/* 3. Social Media Icons (Bổ sung nếu có link FB/Insta) */}
            <View style={styles.socialMediaRow}>
                {shop.shopFacebook && (
                    <TouchableOpacity onPress={() => Linking.openURL(shop.shopFacebook)}>
                        <User size={20} color="#1877F2" />
                    </TouchableOpacity>
                )}
                {shop.shopInstagram && (
                    <TouchableOpacity onPress={() => Linking.openURL(shop.shopInstagram)}>
                        <Camera size={20} color="#E1306C" />
                    </TouchableOpacity>
                )}
                {shop.shopYoutube && (
                    <TouchableOpacity onPress={() => Linking.openURL(shop.shopYoutube)}>
                        <Play size={20} color="#FF0000" />
                    </TouchableOpacity>
                )}
                {/* Tương tự cho Instagram, Youtube */}
            </View>

            {!isOwner ? (
                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.callBtn} onPress={makeCall}>
                        <Phone size={18} color="#10b981" />
                        <Text style={styles.callBtnText}>Gọi điện</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.zaloBtn} onPress={openZalo}>
                        <MessageCircle size={18} color="#fff" />
                        <Text style={styles.zaloBtnText}>Zalo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.ownerNote}>
                    <Text style={styles.ownerNoteText}>Bạn đang xem với tư cách chủ cửa hàng.</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    coverImage: {
        height: 160,
    },
    dotRow: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 18,
    },
    shopAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 14,
    },
    shopName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 11,
        color: '#15803d',
        fontWeight: '800',
    },
    infoGrid: {
        paddingHorizontal: 18,
        paddingTop: 16,
        gap: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        lineHeight: 18,
        color: '#475569',
    },
    descriptionBox: {
        margin: 18,
        marginTop: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
    },
    descriptionText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#475569',
    },
    mapPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 18,
        marginBottom: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        backgroundColor: '#f0fdf4',
    },
    mapLinkText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10b981',
    },
    contactRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#10b981',
        backgroundColor: '#fff',
    },
    callBtnText: {
        color: '#10b981',
        fontWeight: '700',
    },
    zaloBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#10b981',
    },
    zaloBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    ownerNote: {
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    ownerNoteText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
    },
    socialMediaRow: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        gap: 15,
        marginBottom: 10,
    },

})

export default ShopHeader
