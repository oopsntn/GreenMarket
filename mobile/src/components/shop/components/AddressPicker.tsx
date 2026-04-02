import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';

import { MapPin, Navigation } from 'lucide-react-native';
import Input from '../../Reused/Input/Input';
import CustomAlert from '../../../utils/AlertHelper';

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
            onLocationSelect(latitude, longitude);

            const addressResult = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (addressResult.length > 0) {
                const addr = addressResult[0];
                const formattedAddr = [
                    addr.streetNumber,
                    addr.street,
                    addr.district,
                    addr.subregion,
                    addr.region
                ].filter(Boolean).join(', ');

                onAddressChange(formattedAddr);
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
