import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, {
    Marker,
    MapPressEvent,
    MarkerDragStartEndEvent,
    Region,
    UrlTile,
} from 'react-native-maps';
import { CheckCircle2, MapPin, Navigation, Search, X } from 'lucide-react-native';

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

type Coordinate = {
    latitude: number;
    longitude: number;
}

const DEFAULT_DELTA = {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

const AddressPicker = ({
    label,
    address,
    onAddressChange,
    onLocationConfirmed,
}: AddressPickerProps) => {
    const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [resolvingMapLocation, setResolvingMapLocation] = useState(false);
    const [confirmedLocation, setConfirmedLocation] = useState<ConfirmedAddress | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [searchFallbackAddress, setSearchFallbackAddress] = useState('');
    const [mapRegion, setMapRegion] = useState<Region | null>(null);
    const [draftCoordinate, setDraftCoordinate] = useState<Coordinate | null>(null);

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
        setConfirmedLocation(payload);
        onAddressChange(payload.fullAddress);
        onLocationConfirmed(payload);
    };

    const openMapPicker = (lat: number, lng: number, fallbackAddress: string) => {
        setSearchFallbackAddress(fallbackAddress);
        setDraftCoordinate({ latitude: lat, longitude: lng });
        setMapRegion({
            latitude: lat,
            longitude: lng,
            ...DEFAULT_DELTA,
        });
        setMapVisible(true);
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

            setConfirmedLocation(null);
            openMapPicker(geo.lat, geo.lng, address.trim());
        } catch (error) {
            console.error('handleSearchOnMap failed:', error);
            CustomAlert('Lỗi', 'Không thể tìm vị trí từ địa chỉ đã nhập.');
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setDraftCoordinate({ latitude, longitude });
    };

    const handleMarkerDragEnd = (event: MarkerDragStartEndEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setDraftCoordinate({ latitude, longitude });
    };

    const handleConfirmMapLocation = async () => {
        if (!draftCoordinate) {
            CustomAlert('Thông báo', 'Vui lòng chọn một vị trí trên bản đồ.');
            return;
        }

        setResolvingMapLocation(true);
        try {
            const payload = await resolveConfirmedAddress(
                draftCoordinate.latitude,
                draftCoordinate.longitude,
                searchFallbackAddress
            );

            if (!payload) return;

            applyConfirmedLocation(payload);
            setMapVisible(false);
        } catch (error) {
            console.error('handleConfirmMapLocation failed:', error);
            CustomAlert('Lỗi', 'Không thể xác nhận vị trí đã chọn.');
        } finally {
            setResolvingMapLocation(false);
        }
    };

    const handleCloseMap = () => {
        if (resolvingMapLocation) return;
        setMapVisible(false);
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
                Hãy ưu tiên nhập địa chỉ shop rồi bấm "Tìm theo địa chỉ". Bản đồ sẽ mở ra để bạn chạm vào vị trí chính xác hoặc kéo ghim trước khi xác nhận.
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

            <Modal
                visible={mapVisible}
                animationType="slide"
                onRequestClose={handleCloseMap}
            >
                <View style={styles.mapModalContainer}>
                    <View style={styles.mapHeader}>
                        <View style={styles.mapHeaderTextWrap}>
                            <Text style={styles.mapTitle}>Chọn vị trí trên bản đồ</Text>
                            <Text style={styles.mapSubtitle}>
                                Chạm lên bản đồ hoặc kéo ghim để chốt đúng vị trí shop.
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={handleCloseMap} disabled={resolvingMapLocation}>
                            <X size={18} color="#0f172a" />
                        </TouchableOpacity>
                    </View>

                    {mapRegion && draftCoordinate ? (
                        <MapView
                            style={styles.map}
                            initialRegion={mapRegion}
                            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                            onPress={handleMapPress}
                        >
                            <UrlTile
                                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maximumZ={19}
                                flipY={false}
                                shouldReplaceMapContent={Platform.OS === 'android'}
                            />
                            <Marker
                                coordinate={draftCoordinate}
                                draggable
                                onDragEnd={handleMarkerDragEnd}
                            />
                        </MapView>
                    ) : (
                        <View style={styles.mapLoading}>
                            <ActivityIndicator size="large" color="#16a34a" />
                        </View>
                    )}

                    <View style={styles.mapFooter}>
                        {draftCoordinate ? (
                            <Text style={styles.mapCoordinateText}>
                                Pin hiện tại: {draftCoordinate.latitude.toFixed(6)}, {draftCoordinate.longitude.toFixed(6)}
                            </Text>
                        ) : null}

                        <View style={styles.mapActions}>
                            <TouchableOpacity
                                style={[styles.mapActionBtn, styles.mapCancelBtn]}
                                onPress={handleCloseMap}
                                disabled={resolvingMapLocation}
                            >
                                <Text style={styles.mapCancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.mapActionBtn, styles.mapConfirmBtn]}
                                onPress={handleConfirmMapLocation}
                                disabled={resolvingMapLocation}
                            >
                                {resolvingMapLocation ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.mapConfirmText}>Xác nhận vị trí</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    mapModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapHeader: {
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    mapHeaderTextWrap: {
        flex: 1,
        paddingRight: 12,
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    mapSubtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: '#64748b',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    map: {
        flex: 1,
    },
    mapLoading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    mapCoordinateText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 12,
    },
    mapActions: {
        flexDirection: 'row',
        gap: 10,
    },
    mapActionBtn: {
        flex: 1,
        minHeight: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapCancelBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    mapConfirmBtn: {
        backgroundColor: '#16a34a',
    },
    mapCancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    mapConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});

export default AddressPicker;
