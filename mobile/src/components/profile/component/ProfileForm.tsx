import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { Mail, MapPin, Phone, Store, User, FileText } from 'lucide-react-native'
import Input from '../../Reused/Input/Input'
import { ProfileFormData } from '../service/useProfile'

interface ProfileFormProps {
    formData: ProfileFormData
    setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>
    isShop: boolean
}

export const ProfileForm = ({ formData, setFormData, isShop }: ProfileFormProps) => {
    const handleChange = (field: keyof ProfileFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    {isShop ? 'SHOP NAME' : 'FULL NAME'}
                </Text>
                <Input
                    placeholder={isShop ? "Enter shop name..." : "Enter your full name..."}
                    value={isShop ? formData.shopName : formData.displayName}
                    onChangeText={(txt) => handleChange(isShop ? 'shopName' : 'displayName', txt)}
                    icon={isShop ? <Store size={18} color="#10b981" /> : <User size={18} color="#10b981" />}
                    required
                    style={styles.customInput}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <Input
                    placeholder="Contact phone number..."
                    value={isShop ? formData.shopPhone : formData.mobile}
                    disabled
                    onChangeText={(txt) => handleChange('shopPhone', txt)}
                    icon={<Phone size={18} color="#10b981" />}
                    type="phone-pad"
                    style={[styles.customInput, styles.disabledInput]}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <Input
                    placeholder="example@gmail.com"
                    value={formData.email}
                    onChangeText={(txt) => handleChange('email', txt)}
                    icon={<Mail size={18} color="#10b981" />}
                    type="email-address"
                    style={styles.customInput}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RESIDENTIAL ADDRESS</Text>
                <Input
                    placeholder="Enter your address..."
                    value={isShop ? formData.shopLocation : formData.location}
                    onChangeText={(txt) => handleChange(isShop ? 'shopLocation' : 'location', txt)}
                    icon={<MapPin size={18} color="#10b981" />}
                    required={isShop}
                    style={styles.customInput}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    {isShop ? 'SHOP DESCRIPTION' : 'ABOUT ME'}
                </Text>
                <Input
                    placeholder={isShop ? "Tell us about your shop..." : "Write a few lines about yourself..."}
                    value={isShop ? formData.shopDescription : formData.bio}
                    multiline
                    numberOfLines={4}
                    onChangeText={(txt) => handleChange(isShop ? 'shopDescription' : 'bio', txt)}
                    icon={<FileText size={18} color="#10b981" />}
                    style={[styles.customInput, styles.textArea]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1.2,
        marginLeft: 4,
    },
    customInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 56,
    },
    disabledInput: {
        backgroundColor: '#f1f5f9',
        borderColor: '#f1f5f9',
        color: '#94a3b8',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
});
