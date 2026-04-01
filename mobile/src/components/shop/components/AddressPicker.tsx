import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';

import { MapPin, Navigation } from 'lucide-react-native';
import Input from '../../Reused/Input/Input';

interface AddressPickerProps {
    address: string;
    onAddressChange: (addr: string) => void;
    onLocationSelect: (lat: number, lng: number) => void;
    label: string;
}

const AddressPicker = ({ address, onAddressChange, onLocationSelect, label }: AddressPickerProps) => {
    const [loading, setLoading] = useState(false);

    const getCurrentLocation = async () => {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            alert('Quyền truy cập vị trí bị từ chối');
            setLoading(false);
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        onLocationSelect(location.coords.latitude, location.coords.longitude);

        // Reverse Geocoding (Chuyển tọa độ thành tên địa chỉ)
        let address = await Location.reverseGeocodeAsync(location.coords);
        if (address.length > 0) {
            const formattedAddr = `${address[0].streetNumber || ''} ${address[0].street || ''}, ${address[0].subregion || ''}, ${address[0].region || ''}`;
            onAddressChange(formattedAddr.trim());
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Input
                label={label}
                placeholder="Nhập địa chỉ hoặc lấy vị trí hiện tại"
                value={address}
                icon={<MapPin size={18} color="#666" />}
                onChangeText={onAddressChange}
            />
            <TouchableOpacity
                style={styles.locationBtn}
                onPress={getCurrentLocation}
                disabled={loading}
            >
                <Navigation size={14} color="#10b981" />
                <Text style={styles.locationBtnText}>
                    {loading ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại của vườn"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    locationBtn: { flexDirection: 'row', alignItems: 'center', marginTop: -10, padding: 8 },
    locationBtnText: { color: '#10b981', fontSize: 12, fontWeight: '600', marginLeft: 4 }
});

export default AddressPicker;