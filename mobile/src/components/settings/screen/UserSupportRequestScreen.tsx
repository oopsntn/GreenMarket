import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import CustomAlert from '../../../utils/AlertHelper';
import { api } from '../../../config/api';

const UserSupportRequestScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      CustomAlert('Lỗi', 'Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/user/support', {
        title: title.trim(),
        description: description.trim(),
      });
      CustomAlert('Thành công', 'Yêu cầu hỗ trợ của bạn đã được gửi. Chúng tôi sẽ xử lý sớm nhất có thể.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Lỗi khi gửi yêu cầu hỗ trợ:', error?.response?.data || error?.message);
      CustomAlert('Lỗi', 'Không thể gửi yêu cầu hỗ trợ lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Gửi yêu cầu hỗ trợ" headerStyle="default" backButton={() => navigation.goBack()}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải. Đội ngũ hỗ trợ sẽ liên hệ bạn sớm nhất.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tiêu đề vấn đề</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Lỗi khi thanh toán, Không nhận được hàng..."
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nội dung chi tiết</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết vấn đề của bạn ở đây..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>GỬI YÊU CẦU</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default UserSupportRequestScreen;
