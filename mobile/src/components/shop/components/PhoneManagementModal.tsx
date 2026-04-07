import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { X, Plus, Trash2, ShieldCheck } from 'lucide-react-native';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';
import { ShopService } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';

interface PhoneManagementModalProps {
    visible: boolean;
    onClose: () => void;
    phones: string[];
    onPhonesChange: (newPhones: string[]) => void;
}

const PhoneManagementModal: React.FC<PhoneManagementModalProps> = ({ visible, onClose, phones, onPhonesChange }) => {
    const [loading, setLoading] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'IDLE' | 'OTP'>('IDLE');

    const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;

    const handleRequestOtp = async () => {
        const trimmed = newPhone.trim();
        if (!trimmed) return CustomAlert('Error', 'Please enter a phone number');
        if (!phoneRegex.test(trimmed)) return CustomAlert('Error', 'Invalid phone number format');
        if (phones.includes(trimmed)) return CustomAlert('Error', 'Phone number already exists in your list');
        if (phones.length >= 3) return CustomAlert('Error', 'You can only add up to 3 secondary phone numbers');

        setLoading(true);
        try {
            await ShopService.requestVerifyOTP(trimmed, 'phone');
            CustomAlert('Success', 'OTP has been sent to your phone number');
            setStep('OTP');
        } catch (error: any) {
            console.error(error);
            CustomAlert('Error', error.response?.data?.error || 'Failed to request OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) return CustomAlert('Error', 'Please enter the OTP');

        setLoading(true);
        try {
            await ShopService.addPhone(newPhone.trim(), otp.trim());
            CustomAlert('Success', 'Phone number added successfully');
            onPhonesChange([...phones, newPhone.trim()]);
            setNewPhone('');
            setOtp('');
            setStep('IDLE');
        } catch (error: any) {
            console.error(error);
            CustomAlert('Error', error.response?.data?.error || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePhone = async (phone: string) => {
        Alert.alert(
            "Remove Phone",
            `Are you sure you want to remove ${phone}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await ShopService.removePhone(phone);
                            CustomAlert('Success', 'Phone number removed');
                            onPhonesChange(phones.filter(p => p !== phone));
                        } catch (error: any) {
                            console.error(error);
                            CustomAlert('Error', error.response?.data?.error || 'Failed to remove phone');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancelOptions = () => {
        setStep('IDLE');
        setNewPhone('');
        setOtp('');
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Manage Secondary Phones</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>You can add up to 3 secondary phone numbers to help buyers contact you.</Text>

                    <View style={styles.listContainer}>
                        {phones.length === 0 ? (
                            <Text style={styles.emptyText}>No secondary phones added yet.</Text>
                        ) : (
                            phones.map((p, idx) => (
                                <View key={idx} style={styles.phoneItem}>
                                    <View style={styles.phoneInfo}>
                                        <ShieldCheck size={18} color="#10b981" style={{marginRight: 8}}/>
                                        <Text style={styles.phoneText}>{p}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemovePhone(p)} disabled={loading}>
                                        <Trash2 size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>

                    {phones.length < 3 && step === 'IDLE' && (
                        <View style={styles.addSection}>
                            <Input
                                label="Add new phone number"
                                placeholder="09xxxx..."
                                value={newPhone}
                                onChangeText={setNewPhone}
                                type="phone-pad"
                            />
                            <Button 
                                onPress={handleRequestOtp} 
                                loading={loading} 
                                disabled={loading || !newPhone.trim()}
                                icon={<Plus size={16} color="#fff" />}
                            >
                                Get OTP
                            </Button>
                        </View>
                    )}

                    {step === 'OTP' && (
                        <View style={styles.addSection}>
                            <Text style={styles.infoText}>Enter the OTP sent to {newPhone}</Text>
                            <Input
                                label="OTP Code"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChangeText={setOtp}
                                type="number-pad"
                            />
                            <View style={styles.actionRow}>
                                <Button 
                                    onPress={handleCancelOptions} 
                                    variant="outline" 
                                    style={{ flex: 1, marginRight: 8 }}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onPress={handleVerifyOtp} 
                                    loading={loading} 
                                    disabled={loading || !otp.trim()}
                                    style={{ flex: 1 }}
                                >
                                    Verify
                                </Button>
                            </View>
                        </View>
                    )}

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 20,
    },
    listContainer: {
        marginBottom: 24,
    },
    emptyText: {
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    phoneItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    phoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phoneText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    addSection: {
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        paddingTop: 16,
    },
    infoText: {
        fontSize: 14,
        color: '#3b82f6',
        marginBottom: 10,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 10,
    }
});

export default PhoneManagementModal;
