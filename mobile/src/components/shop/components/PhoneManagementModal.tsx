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
        if (!trimmed) return CustomAlert('Lỗi', 'Vui lòng nhập số điện thoại');
        if (!phoneRegex.test(trimmed)) return CustomAlert('Lỗi', 'Định dạng số điện thoại không hợp lệ');
        if (phones.includes(trimmed)) return CustomAlert('Lỗi', 'Số điện thoại đã tồn tại trong danh sách');
        if (phones.length >= 3) return CustomAlert('Lỗi', 'Chỉ có thể thêm tối đa 3 số điện thoại phụ');

        setLoading(true);
        try {
            await ShopService.requestVerifyOTP(trimmed, 'phone');
            CustomAlert('Thành công', 'Mã OTP đã được gửi đến số điện thoại');
            setStep('OTP');
        } catch (error: any) {
            console.error(error);
            CustomAlert('Lỗi', error.response?.data?.error || 'Yêu cầu OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) return CustomAlert('Lỗi', 'Vui lòng nhập mã OTP');

        setLoading(true);
        try {
            await ShopService.addPhone(newPhone.trim(), otp.trim());
            CustomAlert('Thành công', 'Đã thêm số điện thoại thành công');
            onPhonesChange([...phones, newPhone.trim()]);
            setNewPhone('');
            setOtp('');
            setStep('IDLE');
        } catch (error: any) {
            console.error(error);
            CustomAlert('Lỗi', error.response?.data?.error || 'Xác thực OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePhone = async (phone: string) => {
        Alert.alert(
            "Xóa số điện thoại",
            `Bạn có chắc chắn muốn xóa số ${phone}?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await ShopService.removePhone(phone);
                            CustomAlert('Thành công', 'Đã xóa số điện thoại');
                            onPhonesChange(phones.filter(p => p !== phone));
                        } catch (error: any) {
                            console.error(error);
                            CustomAlert('Lỗi', error.response?.data?.error || 'Xóa số điện thoại thất bại');
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
                        <Text style={styles.title}>Quản lý điện thoại phụ</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Bạn có thể thêm tối đa 3 số điện thoại phụ để khách hàng dễ liên hệ hơn.</Text>

                    <View style={styles.listContainer}>
                        {phones.length === 0 ? (
                            <Text style={styles.emptyText}>Chưa có số điện thoại phụ.</Text>
                        ) : (
                            phones.map((p: string, idx: number) => (
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
                                label="Thêm số điện thoại mới"
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
                                Lấy mã OTP
                            </Button>
                        </View>
                    )}

                    {step === 'OTP' && (
                        <View style={styles.addSection}>
                            <Text style={styles.infoText}>Nhập mã OTP đã được gửi đến {newPhone}</Text>
                            <Input
                                label="Mã OTP"
                                placeholder="Nhập mã 6 số"
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
                                    Hủy
                                </Button>
                                <Button 
                                    onPress={handleVerifyOtp} 
                                    loading={loading} 
                                    disabled={loading || !otp.trim()}
                                    style={{ flex: 1 }}
                                >
                                    Xác nhận
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
