import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Crown, Plus, Send, ShieldCheck, Star, Trash2, X } from 'lucide-react-native';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';
import { ShopService } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';

interface PhoneManagementModalProps {
  visible: boolean;
  onClose: () => void;
  phones: string[];
  shopEmail?: string;
  shopEmailVerified?: boolean;
  onPhonesChange: (newPhones: string[]) => void;
}

type Step = 'IDLE' | 'ADD_OTP' | 'SET_PRIMARY_OTP';

const PhoneManagementModal: React.FC<PhoneManagementModalProps> = ({
  visible,
  onClose,
  phones,
  shopEmail,
  shopEmailVerified,
  onPhonesChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('IDLE');
  const [newPhone, setNewPhone] = useState('');
  const [addOtp, setAddOtp] = useState('');
  const [targetPrimary, setTargetPrimary] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;

  const resetState = () => {
    setStep('IDLE');
    setNewPhone('');
    setAddOtp('');
    setTargetPrimary('');
    setEmailOtp('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestAddOtp = async () => {
    const trimmed = newPhone.trim();
    if (!trimmed) return CustomAlert('Lỗi', 'Vui lòng nhập số điện thoại');
    if (!phoneRegex.test(trimmed)) return CustomAlert('Lỗi', 'Định dạng số điện thoại không hợp lệ');
    if (phones.includes(trimmed)) return CustomAlert('Lỗi', 'Số điện thoại đã tồn tại trong danh sách');
    if (phones.length >= 3) return CustomAlert('Lỗi', 'Đã đạt giới hạn tối đa 3 số điện thoại');

    setLoading(true);
    try {
      await ShopService.requestVerifyOTP(trimmed, 'phone');
      CustomAlert('Đã gửi', `Mã OTP đã được gửi đến ${trimmed}`);
      setStep('ADD_OTP');
    } catch (error: any) {
      CustomAlert('Lỗi', error?.response?.data?.error || 'Yêu cầu OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddPhone = async () => {
    if (!addOtp.trim()) return CustomAlert('Lỗi', 'Vui lòng nhập mã OTP');

    setLoading(true);
    try {
      await ShopService.addPhone(newPhone.trim(), addOtp.trim());
      CustomAlert('Thành công', 'Đã thêm số điện thoại thành công');
      onPhonesChange([...phones, newPhone.trim()]);
      resetState();
    } catch (error: any) {
      CustomAlert('Lỗi', error?.response?.data?.error || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleInitSetPrimary = async (phone: string) => {
    if (!shopEmailVerified || !shopEmail) {
      CustomAlert(
        'Cần xác thực email',
        'Bạn cần xác thực email của cửa hàng trước khi đổi số điện thoại chính. Vào mục "Chỉnh sửa cửa hàng" để xác thực email.',
      );
      return;
    }

    setLoading(true);
    try {
      await ShopService.requestVerifyOTP(shopEmail, 'email');
      setTargetPrimary(phone);
      setStep('SET_PRIMARY_OTP');
      CustomAlert('Đã gửi', `Mã xác thực đã được gửi đến email ${shopEmail}.`);
    } catch (error: any) {
      CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể gửi mã xác thực về email');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetPrimary = async () => {
    if (!emailOtp.trim()) return CustomAlert('Lỗi', 'Vui lòng nhập mã OTP từ email');

    setLoading(true);
    try {
      const res = await ShopService.setPrimaryPhone(targetPrimary, emailOtp.trim());
      const newPhoneString: string = res?.shopPhone || targetPrimary;
      const reordered = newPhoneString.split('|').map((p: string) => p.trim()).filter(Boolean);
      onPhonesChange(reordered);
      CustomAlert(
        'Thành công',
        `Số ${targetPrimary} đã trở thành số điện thoại chính. Token hiện tại vẫn còn hiệu lực cho đến khi bạn đăng xuất và đăng nhập lại.`,
      );
      resetState();
    } catch (error: any) {
      CustomAlert('Lỗi', error?.response?.data?.error || 'Xác thực thất bại. Kiểm tra lại mã OTP email.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhone = (phone: string) => {
    if (phones[0] === phone) {
      CustomAlert('Không thể xóa', 'Không thể xóa số điện thoại chính. Hãy đổi số khác làm số chính trước.');
      return;
    }

    Alert.alert('Xóa số điện thoại', `Bạn có chắc muốn xóa số ${phone}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await ShopService.removePhone(phone);
            onPhonesChange(phones.filter((p) => p !== phone));
            CustomAlert('Thành công', 'Đã xóa số điện thoại');
          } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Xóa thất bại');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.modalContent}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Quản lý số điện thoại</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Tối đa 3 số điện thoại. Số <Text style={styles.strongText}>Chính</Text> dùng để đăng nhập OTP,
              2 số còn lại là dự phòng. Có thể đổi số dự phòng đã xác thực làm số chính
              (cần xác thực qua email cửa hàng).
            </Text>

            <View style={styles.listContainer}>
              {phones.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có số điện thoại nào.</Text>
              ) : (
                phones.map((p, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <View key={p} style={[styles.phoneItem, isPrimary && styles.primaryPhoneItem]}>
                      <View style={styles.phoneInfo}>
                        {isPrimary ? (
                          <Crown size={16} color="#d97706" style={styles.leadingIcon} />
                        ) : (
                          <ShieldCheck size={16} color="#10b981" style={styles.leadingIcon} />
                        )}
                        <View>
                          <Text style={[styles.phoneText, isPrimary && styles.primaryPhoneText]}>{p}</Text>
                          <Text style={[styles.phoneBadge, isPrimary ? styles.primaryBadge : styles.secondaryBadge]}>
                            {isPrimary ? '● Số chính · Đăng nhập OTP' : '○ Số dự phòng'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.phoneActions}>
                        {!isPrimary && step === 'IDLE' && (
                          <TouchableOpacity
                            style={styles.setPrimaryBtn}
                            onPress={() => handleInitSetPrimary(p)}
                            disabled={loading}
                          >
                            <Star size={14} color="#d97706" />
                          </TouchableOpacity>
                        )}

                        {!isPrimary && (
                          <TouchableOpacity
                            onPress={() => handleRemovePhone(p)}
                            disabled={loading}
                            style={styles.deleteBtn}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {phones.length < 3 && step === 'IDLE' && (
              <View style={styles.addSection}>
                <Input
                  label="Thêm số điện thoại mới"
                  placeholder="09xxxxxxxx"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  type="phone-pad"
                />
                <Button
                  onPress={handleRequestAddOtp}
                  loading={loading}
                  disabled={loading || !newPhone.trim()}
                  icon={<Plus size={16} color="#fff" />}
                  fullWidth
                >
                  Lấy mã OTP
                </Button>
              </View>
            )}

            {step === 'ADD_OTP' && (
              <View style={styles.addSection}>
                <Text style={styles.infoText}>
                  Nhập mã OTP đã gửi đến <Text style={styles.strongText}>{newPhone}</Text>
                </Text>
                <Input
                  label="Mã OTP xác thực số điện thoại"
                  placeholder="6 chữ số"
                  value={addOtp}
                  onChangeText={setAddOtp}
                  type="number-pad"
                />
                <View style={styles.actionRow}>
                  <Button variant="outline" style={styles.halfButton} onPress={resetState} disabled={loading}>
                    Hủy
                  </Button>
                  <Button style={styles.halfButton} onPress={handleConfirmAddPhone} loading={loading} disabled={loading || !addOtp.trim()}>
                    Xác nhận
                  </Button>
                </View>
              </View>
            )}

            {step === 'SET_PRIMARY_OTP' && (
              <View style={styles.addSection}>
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    Bạn đang đổi số điện thoại chính thành <Text style={styles.strongText}>{targetPrimary}</Text>.
                    {'\n'}
                    Nhập mã OTP đã gửi đến email <Text style={styles.strongText}>{shopEmail}</Text> để xác nhận.
                  </Text>
                </View>
                <Input
                  label="Mã OTP từ Email"
                  placeholder="6 chữ số"
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                  type="number-pad"
                  icon={<Send size={16} color="#94a3b8" />}
                />
                <View style={styles.actionRow}>
                  <Button variant="outline" style={styles.halfButton} onPress={resetState} disabled={loading}>
                    Hủy
                  </Button>
                  <Button
                    style={styles.primaryActionButton}
                    onPress={handleConfirmSetPrimary}
                    loading={loading}
                    disabled={loading || !emailOtp.trim()}
                  >
                    Đổi số chính
                  </Button>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '88%',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 20,
  },
  strongText: {
    fontWeight: '800',
    color: '#1e293b',
  },
  listContainer: {
    marginBottom: 16,
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
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  primaryPhoneItem: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leadingIcon: {
    marginRight: 8,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  primaryPhoneText: {
    color: '#92400e',
  },
  phoneBadge: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryBadge: {
    color: '#d97706',
  },
  secondaryBadge: {
    color: '#64748b',
  },
  phoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setPrimaryBtn: {
    padding: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 6,
  },
  addSection: {
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    marginBottom: 10,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
  primaryActionButton: {
    flex: 2,
    backgroundColor: '#d97706',
  },
  warningBox: {
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
});

export default PhoneManagementModal;
