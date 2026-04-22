import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation, Search, CheckCircle2 } from 'lucide-react-native';

import Input from '../../Reused/Input/Input';
import CustomAlert from '../../../utils/AlertHelper';
import {
    reverseGeocode,
    geocodeAddress,
} from '../service/addressService';

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

    const hasAddressInput = useMemo(() => address.trim().length > 0, [address]);

    const confirmByCoordinates = async (lat: number, lng: number, fallbackAddress?: string) => {
        const reversed = await reverseGeocode(lat, lng);

        if (!reversed?.full?.trim() && !fallbackAddress?.trim()) {
            CustomAlert('Lỗi', 'Không thể xác định địa chỉ từ vị trí đã chọn.');
            return;
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

        setConfirmedLocation(payload);
        onAddressChange(payload.fullAddress);
        onLocationConfirmed(payload);
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

            await confirmByCoordinates(latitude, longitude);
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

            await confirmByCoordinates(geo.lat, geo.lng, address.trim());
            CustomAlert('Thành công', 'Đã xác định vị trí từ địa chỉ nhập tay.');
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
                Hãy ưu tiên nhập địa chỉ shop rồi bấm "Tìm theo địa chỉ". Nút vị trí hiện tại chỉ nên dùng khi bạn đang đứng đúng tại shop.
            </Text>

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
    confirmAddress: {
        fontSize: 13,
        lineHeight: 18,
        color: '#14532d',
        fontWeight: '500',
    },
    coordinateText: {
        marginTop: 8,
        fontSize: 11,
        color: '#15803d',
        fontWeight: '700',
    },
});

export default AddressPicker;