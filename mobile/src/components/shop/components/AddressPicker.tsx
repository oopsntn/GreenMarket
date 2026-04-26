import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { CheckCircle2, MapPin, Navigation, Search } from 'lucide-react-native';

import Input from '../../Reused/Input/Input';
import CustomAlert from '../../../utils/AlertHelper';
import { geocodeAddress, reverseGeocode } from '../service/addressService';

export interface ConfirmedAddress {
    fullAddress: string;
    province?: string;
    district?: string;
    ward?: string;
    specific?: string;
    lat: number;
    lng: number;
}

interface AddressPickerProps {
    label: string;
    address: string;
    onAddressChange: (addr: string) => void;
    onLocationConfirmed: (data: ConfirmedAddress) => void;
}

const AddressPicker = ({
    label,
    address,
    onAddressChange,
    onLocationConfirmed,
}: AddressPickerProps) => {
    const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [confirmedLocation, setConfirmedLocation] = useState<ConfirmedAddress | null>(null);
    const [candidateLocation, setCandidateLocation] = useState<ConfirmedAddress | null>(null);

    const hasAddressInput = useMemo(() => address.trim().length > 0, [address]);

    const resolveConfirmedAddress = async (lat: number, lng: number, fallbackAddress?: string) => {
        const reversed = await reverseGeocode(lat, lng);

        if (!reversed?.full?.trim() && !fallbackAddress?.trim()) {
            CustomAlert('Lỗi', 'Không thể xác định địa chỉ từ vị trí đã chọn.');
            return null;
        }

        const payload: ConfirmedAddress = {
            fullAddress: reversed?.full?.trim() || fallbackAddress!.trim(),
            province: reversed?.province || '',
            district: reversed?.district || '',
            ward: reversed?.ward || '',
            specific: reversed?.specific || '',
            lat,
            lng,
        };

        return payload;
    };

    const applyConfirmedLocation = (payload: ConfirmedAddress) => {
        setCandidateLocation(null);
        setConfirmedLocation(payload);
        onAddressChange(payload.fullAddress);
        onLocationConfirmed(payload);
    };

    const openPreviewMap = async (lat: number, lng: number) => {
        const query = encodeURIComponent(`${lat},${lng}`);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        await WebBrowser.openBrowserAsync(mapUrl);
    };

    const handleUseCurrentLocation = async () => {
        setLoadingCurrentLocation(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                CustomAlert('Thông báo', 'Bạn chưa cấp quyền truy cập vị trí.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;
            const payload = await resolveConfirmedAddress(latitude, longitude);

            if (!payload) return;

            applyConfirmedLocation(payload);
            CustomAlert('Thành công', 'Đã lấy vị trí hiện tại và cập nhật địa chỉ.');
        } catch (error) {
            console.error('getCurrentLocation failed:', error);
            CustomAlert('Lỗi', 'Không thể lấy vị trí hiện tại.');
        } finally {
            setLoadingCurrentLocation(false);
        }
    };

    const handleSearchOnMap = async () => {
        if (!address.trim()) {
            CustomAlert('Thông báo', 'Vui lòng nhập địa chỉ trước khi tìm.');
            return;
        }

        setLoadingSearch(true);

        try {
            const geo = await geocodeAddress(address.trim());

            if (!geo) {
                CustomAlert(
                    'Không tìm thấy vị trí',
                    'Không thể xác định tọa độ từ địa chỉ đã nhập. Vui lòng nhập chi tiết hơn.'
                );
                return;
            }

            const payload = await resolveConfirmedAddress(geo.lat, geo.lng, address.trim());

            if (!payload) return;

            setConfirmedLocation(null);
            setCandidateLocation(payload);
            await openPreviewMap(payload.lat, payload.lng);
        } catch (error) {
            console.error('handleSearchOnMap failed:', error);
            CustomAlert('Lỗi', 'Không thể tìm vị trí từ địa chỉ đã nhập.');
        } finally {
            setLoadingSearch(false);
        }
    };

    return (
        <View style={styles.container}>
            <Input
                label={label}
                placeholder="Nhập địa chỉ shop"
                value={address}
                icon={<MapPin size={18} color="#666" />}
                onChangeText={(text: string) => {
                    onAddressChange(text);
                    setConfirmedLocation(null);
                    setCandidateLocation(null);
                }}
            />

            <View style={styles.actionGroup}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.searchBtn]}
                    onPress={handleSearchOnMap}
                    disabled={loadingSearch || loadingCurrentLocation || !hasAddressInput}
                >
                    {loadingSearch ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                        <Search size={16} color="#2563eb" />
                    )}
                    <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>
                        {loadingSearch ? 'Đang tìm...' : 'Tìm theo địa chỉ'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.gpsBtn]}
                    onPress={handleUseCurrentLocation}
                    disabled={loadingSearch || loadingCurrentLocation}
                >
                    {loadingCurrentLocation ? (
                        <ActivityIndicator size="small" color="#10b981" />
                    ) : (
                        <Navigation size={16} color="#10b981" />
                    )}
                    <Text style={[styles.actionBtnText, { color: '#10b981' }]}>
                        {loadingCurrentLocation ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.hintText}>
                Hãy ưu tiên nhập địa chỉ shop rồi bấm "Tìm theo địa chỉ". Hệ thống sẽ mở bản đồ ngoài app để bạn kiểm tra pin trước khi xác nhận. Nút vị trí hiện tại chỉ nên dùng khi bạn đang đứng đúng tại shop.
            </Text>

            {candidateLocation ? (
                <View style={styles.candidateBox}>
                    <View style={styles.confirmHeader}>
                        <MapPin size={16} color="#2563eb" />
                        <Text style={[styles.confirmTitle, styles.candidateTitle]}>Vị trí tìm được từ địa chỉ</Text>
                    </View>

                    <Text style={[styles.confirmAddress, styles.candidateAddress]}>{candidateLocation.fullAddress}</Text>

                    <Text style={[styles.coordinateText, styles.candidateCoordinate]}>
                        Tọa độ: {candidateLocation.lat.toFixed(6)}, {candidateLocation.lng.toFixed(6)}
                    </Text>

                    <View style={styles.candidateActions}>
                        <TouchableOpacity
                            style={[styles.inlineActionBtn, styles.inlineActionSecondary]}
                            onPress={() => openPreviewMap(candidateLocation.lat, candidateLocation.lng)}
                        >
                            <Text style={[styles.inlineActionText, styles.inlineActionSecondaryText]}>Mở lại bản đồ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.inlineActionBtn, styles.inlineActionPrimary]}
                            onPress={() => applyConfirmedLocation(candidateLocation)}
                        >
                            <Text style={[styles.inlineActionText, styles.inlineActionPrimaryText]}>Xác nhận vị trí này</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {confirmedLocation ? (
                <View style={styles.confirmBox}>
                    <View style={styles.confirmHeader}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <Text style={styles.confirmTitle}>Đã xác nhận vị trí</Text>
                    </View>

                    <Text style={styles.confirmAddress}>{confirmedLocation.fullAddress}</Text>

                    <Text style={styles.coordinateText}>
                        Tọa độ: {confirmedLocation.lat.toFixed(6)}, {confirmedLocation.lng.toFixed(6)}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    actionGroup: {
        flexDirection: 'row',
        gap: 10,
        marginTop: -6,
        marginBottom: 8,
    },
    actionBtn: {
        flex: 1,
        minHeight: 42,
        borderRadius: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
    },
    searchBtn: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    gpsBtn: {
        backgroundColor: '#ecfdf5',
        borderColor: '#a7f3d0',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    hintText: {
        marginTop: 4,
        fontSize: 11,
        lineHeight: 16,
        color: '#64748b',
    },
    candidateBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    confirmBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    confirmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    confirmTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#166534',
    },
    candidateTitle: {
        color: '#1d4ed8',
    },
    confirmAddress: {
        fontSize: 13,
        lineHeight: 18,
        color: '#14532d',
        fontWeight: '500',
    },
    candidateAddress: {
        color: '#1e3a8a',
    },
    coordinateText: {
        marginTop: 8,
        fontSize: 11,
        color: '#15803d',
        fontWeight: '700',
    },
    candidateCoordinate: {
        color: '#2563eb',
    },
    candidateActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    inlineActionBtn: {
        flex: 1,
        minHeight: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    inlineActionPrimary: {
        backgroundColor: '#2563eb',
    },
    inlineActionSecondary: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#93c5fd',
    },
    inlineActionText: {
        fontSize: 12,
        fontWeight: '800',
    },
    inlineActionPrimaryText: {
        color: '#fff',
    },
    inlineActionSecondaryText: {
        color: '#2563eb',
    },
});

export default AddressPicker;
