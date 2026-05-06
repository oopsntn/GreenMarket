import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, Send, ShieldCheck, X } from 'lucide-react-native';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';
import { ShopService } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';

interface EmailVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  currentEmail?: string;
  isVerified?: boolean;
  onVerified: (email: string) => void;
}

type Step = 'INPUT_EMAIL' | 'OTP_SENT';

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  onClose,
  currentEmail = '',
  isVerified = false,
  onVerified,
}) => {
  const [step, setStep] = useState<Step>('INPUT_EMAIL');
  const [email, setEmail] = useState(currentEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

  const handleClose = () => {
    setStep('INPUT_EMAIL');
    setEmail(currentEmail);
    setOtp('');
    onClose();
  };

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) return CustomAlert('Lỗi', 'Vui lòng nhập địa chỉ email');
    if (!emailRegex.test(trimmed)) return CustomAlert('Lỗi', 'Định dạng email không hợp lệ');

    setLoading(true);
    try {
      await ShopService.requestVerifyOTP(trimmed, 'email');
      setStep('OTP_SENT');
      CustomAlert('Đã gửi', `Mã OTP đã được gửi đến ${trimmed}. Vui lòng kiểm tra hộp thư, kể cả mục Spam.`);
    } catch (error: any) {
      CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) return CustomAlert('Lỗi', 'Vui lòng nhập mã OTP');
    if (trimmedOtp.length < 4) return CustomAlert('Lỗi', 'Mã OTP không hợp lệ');

    setLoading(true);
    try {
      await ShopService.verifyEmail(email.trim(), trimmedOtp);
      CustomAlert('Thành công', `Email ${email.trim()} đã được xác thực.`);
      onVerified(email.trim());
      handleClose();
    } catch (error: any) {
      CustomAlert('Lỗi', error?.response?.data?.error || 'OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setStep('INPUT_EMAIL');
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
              <View style={styles.headerLeft}>
                <Mail size={20} color="#10b981" />
                <Text style={styles.title}>Xác thực Email cửa hàng</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {isVerified && (
              <View style={styles.verifiedBanner}>
                <ShieldCheck size={16} color="#10b981" />
                <Text style={styles.verifiedText}>Email hiện tại đã được xác thực</Text>
              </View>
            )}

            <Text style={styles.subtitle}>
              {step === 'INPUT_EMAIL'
                ? 'Nhập email bạn muốn liên kết với cửa hàng. Một mã OTP sẽ được gửi đến email này.'
                : `Nhập mã OTP 6 số đã gửi đến ${email.trim()}`}
            </Text>

            {step === 'INPUT_EMAIL' && (
              <View style={styles.section}>
                <Input
                  label="Địa chỉ email"
                  placeholder="Example: shop@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  type="email-address"
                  icon={<Mail size={18} color="#94a3b8" />}
                />
                <Button
                  onPress={handleSendOtp}
                  loading={loading}
                  disabled={loading || !email.trim()}
                  fullWidth
                  style={styles.actionBtn}
                  icon={<Send size={16} color="#fff" />}
                >
                  Gửi mã OTP
                </Button>
              </View>
            )}

            {step === 'OTP_SENT' && (
              <View style={styles.section}>
                <Input
                  label="Mã OTP"
                  placeholder="Nhập 6 chữ số"
                  value={otp}
                  onChangeText={setOtp}
                  type="number-pad"
                  icon={<ShieldCheck size={18} color="#94a3b8" />}
                />
                <View style={styles.otpActions}>
                  <Button
                    variant="outline"
                    style={styles.resendButton}
                    onPress={handleResendOtp}
                    disabled={loading}
                  >
                    Gửi lại OTP
                  </Button>
                  <Button
                    style={styles.confirmButton}
                    onPress={handleVerifyOtp}
                    loading={loading}
                    disabled={loading || !otp.trim()}
                  >
                    Xác nhận
                  </Button>
                </View>
              </View>
            )}

            {loading && step !== 'INPUT_EMAIL' ? (
              <View style={styles.loadingHint}>
                <ActivityIndicator color="#10b981" />
              </View>
            ) : null}
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
    minHeight: 380,
    maxHeight: '84%',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 20,
  },
  section: {
    gap: 0,
  },
  actionBtn: {
    backgroundColor: '#10b981',
    marginTop: 8,
  },
  otpActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  resendButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
  loadingHint: {
    paddingTop: 12,
    alignItems: 'center',
  },
});

export default EmailVerificationModal;
