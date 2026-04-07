import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';

import { MapPin, Navigation } from 'lucide-react-native';
import Input from '../../Reused/Input/Input';
import CustomAlert from '../../../utils/AlertHelper';

interface AddressPickerProps {
    address: string;
    onAddressChange: (addr: string) => void;
    onLocationSelect: (addr: string, lat: number, lng: number) => void;
    label: string;
}

const AddressPicker = ({ address, onAddressChange, onLocationSelect, label }: AddressPickerProps) => {
    const [loading, setLoading] = useState(false);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                CustomAlert('Notice', 'Location access was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });


            const { latitude, longitude } = location.coords;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'GreenMarketApp' // Nominatim yêu cầu User-Agent
                    }
                }
            );
            const data = await response.json();

            if (data && data.display_name) {
                const formattedAddr = data.display_name; // Địa chỉ đầy đủ từ OSM

                // Cập nhật state
                onLocationSelect(formattedAddr, latitude, longitude);
                onAddressChange(formattedAddr);
            } else {
                // Nếu không lấy được địa chỉ, ít nhất vẫn lấy được tọa độ
                onLocationSelect("Custom Location", latitude, longitude);
            }

        } catch (error) {
            console.error(error);
            CustomAlert('Error', 'Unable to get the current location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Input
                label={label}
                placeholder="Enter an address or use the current location"
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
                    {loading ? 'Getting location...' : "Use the shop's current location"}
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
