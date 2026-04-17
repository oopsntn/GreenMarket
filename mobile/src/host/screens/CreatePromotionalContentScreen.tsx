import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Eye, Image as ImageIcon, Plus, Send, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../../utils/AlertHelper';
import { hostService, HostContentTargetType } from '../services/hostService';

const TARGET_OPTIONS: Array<{ label: string; value: HostContentTargetType }> = [
  { label: 'Post', value: 'post' },
  { label: 'Shop', value: 'shop' },
  { label: 'External', value: 'external' },
];

const MAX_MEDIA = 5;

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const CreatePromotionalContentScreen = () => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Dashboard');
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [targetType, setTargetType] = useState<HostContentTargetType>('external');
  const [targetId, setTargetId] = useState('');
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const descriptionWithCta = useMemo(() => {
    const base = description.trim();
    const cta = ctaLink.trim();

    if (!cta) {
      return base;
    }

    return `${base}\n\nCTA: ${cta}`;
  }, [description, ctaLink]);

  const handlePickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      CustomAlert('Thông báo', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_MEDIA,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets.map((asset) => asset.uri);
    setMediaUris((prev) => [...prev, ...picked].slice(0, MAX_MEDIA));
  };

  const removeMedia = (index: number) => {
    setMediaUris((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCtaLink('');
    setTargetType('external');
    setTargetId('');
    setMediaUris([]);
    setShowPreview(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      CustomAlert('Thiếu thông tin', 'Vui lòng nhập tiêu đề nội dung quảng bá.');
      return;
    }

    if (!description.trim()) {
      CustomAlert('Thiếu thông tin', 'Vui lòng nhập nội dung quảng bá.');
      return;
    }

    const parsedTargetId = Number(targetId);
    const canUseTargetId = Number.isFinite(parsedTargetId) && parsedTargetId > 0;

    setSubmitting(true);
    try {
      setUploading(true);
      const uploaded = mediaUris.length > 0 ? await hostService.uploadMedia(mediaUris) : { urls: [] };
      setUploading(false);

      await hostService.createContent({
        title: title.trim(),
        description: descriptionWithCta,
        targetType,
        ...(canUseTargetId ? { targetId: parsedTargetId } : {}),
        mediaUrls: uploaded.urls,
      });

      CustomAlert('Đã gửi kiểm duyệt', 'Nội dung của bạn đang chờ manager duyệt. Sau khi duyệt, bài sẽ hiển thị trên dashboard.', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            navigation.navigate('Dashboard');
          },
        },
      ]);
    } catch (error: unknown) {
      setUploading(false);
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể tạo nội dung quảng bá.'
          : 'Không thể tạo nội dung quảng bá.';

      CustomAlert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ArrowLeft color="#0F172A" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo nội dung quảng bá</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề nội dung"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />

            <Text style={styles.label}>Nội dung quảng bá</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả ngắn gọn nội dung bạn muốn quảng bá"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Link CTA (tuỳ chọn)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              value={ctaLink}
              onChangeText={setCtaLink}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              Hệ thống backend hiện chưa có field CTA riêng, app sẽ lưu CTA vào phần mô tả để đảm bảo không mất dữ liệu.
            </Text>

            <Text style={styles.label}>Đối tượng nội dung</Text>
            <View style={styles.targetRow}>
              {TARGET_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setTargetType(option.value)}
                  style={[
                    styles.targetBtn,
                    targetType === option.value && styles.targetBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.targetText,
                      targetType === option.value && styles.targetTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(targetType === 'post' || targetType === 'shop') ? (
              <>
                <Text style={styles.label}>Target ID (tuỳ chọn)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 12"
                  keyboardType="number-pad"
                  value={targetId}
                  onChangeText={setTargetId}
                />
              </>
            ) : null}

            <Text style={styles.label}>Tệp đính kèm ({mediaUris.length}/{MAX_MEDIA})</Text>
            <View style={styles.mediaGrid}>
              {mediaUris.map((uri, index) => (
                <View key={`${uri}_${index}`} style={styles.mediaItem}>
                  <ImageIcon color="#64748B" size={20} />
                  <Text style={styles.mediaName} numberOfLines={1}>
                    {`Ảnh ${index + 1}`}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeMedia(index)}
                  >
                    <X color="white" size={12} />
                  </TouchableOpacity>
                </View>
              ))}

              {mediaUris.length < MAX_MEDIA ? (
                <TouchableOpacity style={styles.addMediaBtn} onPress={handlePickMedia}>
                  <Plus color="#16A34A" size={18} />
                  <Text style={styles.addMediaText}>Thêm media</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.previewBtn, showPreview && styles.previewBtnActive]}
                onPress={() => setShowPreview((prev) => !prev)}
              >
                <Eye size={16} color={showPreview ? 'white' : '#166534'} />
                <Text style={[styles.previewText, showPreview && styles.previewTextActive]}>
                  Preview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, (submitting || uploading) && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={submitting || uploading}
              >
                {(submitting || uploading) ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text style={styles.submitText}>Đăng nội dung</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {showPreview ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview nội dung</Text>
              <Text style={styles.previewLabel}>Tiêu đề</Text>
              <Text style={styles.previewValue}>{title || '(Chưa nhập)'}</Text>

              <Text style={styles.previewLabel}>Nội dung</Text>
              <Text style={styles.previewValue}>{description || '(Chưa nhập)'}</Text>

              <Text style={styles.previewLabel}>CTA</Text>
              <Text style={styles.previewValue}>{ctaLink || '(Không có)'}</Text>

              <Text style={styles.previewLabel}>Media</Text>
              <Text style={styles.previewValue}>{`${mediaUris.length} file`}</Text>

              <Text style={styles.previewLabel}>Target</Text>
              <Text style={styles.previewValue}>{`${targetType}${targetId ? ` #${targetId}` : ''}`}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 14 + STATUS_BAR_OFFSET,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  label: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  helperText: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  targetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 9,
  },
  targetBtnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF5',
  },
  targetText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  targetTextActive: {
    color: '#166534',
  },
  mediaGrid: {
    marginTop: 4,
    gap: 8,
  },
  mediaItem: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  mediaName: {
    flex: 1,
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#16A34A',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
  },
  addMediaText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  previewBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
  },
  previewBtnActive: {
    backgroundColor: '#166534',
  },
  previewText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },
  previewTextActive: {
    color: 'white',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  previewCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 14,
  },
  previewTitle: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 10,
  },
  previewLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
  },
  previewValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default CreatePromotionalContentScreen;
