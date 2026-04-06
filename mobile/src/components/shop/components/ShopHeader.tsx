import React, { useMemo } from 'react'
import { FlatList, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Camera, ExternalLink, MapPin, MessageCircle, Phone, Play, Store, User } from 'lucide-react-native'

interface ShopHeaderProps {
    shop: any;
    isOwner: boolean;
    styles?: any;
}

const ShopHeader = ({ shop, isOwner }: ShopHeaderProps) => {
    const gallery = useMemo(() => {
        if (!shop.shopGalleryImages) return [];
        return typeof shop.shopGalleryImages === 'string'
            ? shop.shopGalleryImages.split('|')
            : shop.shopGalleryImages;
    }, [shop.shopGalleryImages]);

    if (!shop) return null

    const openMap = () => {
        if (!shop.shopLocation && (!shop.shopLat || !shop.shopLng)) {
            return
        }

        const label = shop.shopName || 'Shop'
        const lat = shop.shopLat
        const lng = shop.shopLng
        const location = shop.shopLocation || label

        const url = Platform.select({
            ios: lat && lng ? `maps:0,0?q=${label}@${lat},${lng}` : `maps:0,0?q=${location}`,
            android: lat && lng ? `geo:${lat},${lng}?q=${lat},${lng}(${label})` : `geo:0,0?q=${location}`,
        })

        if (url) {
            Linking.openURL(url)
        }
    }

    const makeCall = () => {
        if (shop.shopPhone) {
            Linking.openURL(`tel:${shop.shopPhone}`)
        }
    }

    const openZalo = () => {
        if (shop.shopPhone) {
            Linking.openURL(`https://zalo.me/${shop.shopPhone}`)
        }
    }

    return (
        <View style={styles.headerCard}>
            {shop.shopCoverUrl ? (
                <Image source={{ uri: shop.shopCoverUrl }} style={styles.coverImage} />
            ) : null}

            {/* 2. Thay vì 1 ảnh bìa, hãy hiện Slider nếu có Gallery */}
            {gallery.length > 0 ? (
                <FlatList
                    data={gallery}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Image source={{ uri: item }} style={styles.coverImage} />
                    )}
                />
            ) : shop.shopCoverUrl ? (
                <Image source={{ uri: shop.shopCoverUrl }} style={styles.coverImage} />
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
                            {shop.shopStatus === 'active' ? 'ACTIVE' : 'PENDING APPROVAL'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <MapPin size={16} color="#10b981" />
                    <Text style={styles.infoText} numberOfLines={2}>
                        {shop.shopLocation || 'Address not updated'}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Phone size={16} color="#10b981" />
                    <Text style={styles.infoText}>
                        {shop.shopPhone || 'No phone number yet'}
                    </Text>
                </View>
            </View>

            <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                    {shop.shopDescription || 'This shop does not have a detailed description yet.'}
                </Text>
            </View>

            {shop.shopLocation || (shop.shopLat && shop.shopLng) ? (
                <TouchableOpacity style={styles.mapPreview} onPress={openMap}>
                    <ExternalLink size={16} color="#10b981" />
                    <Text style={styles.mapLinkText}>Open location in maps</Text>
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
                        <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.zaloBtn} onPress={openZalo}>
                        <MessageCircle size={18} color="#fff" />
                        <Text style={styles.zaloBtnText}>Zalo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.ownerNote}>
                    <Text style={styles.ownerNoteText}>You are viewing this shop as the owner.</Text>
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
        width: '100%',
        height: 140,
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
