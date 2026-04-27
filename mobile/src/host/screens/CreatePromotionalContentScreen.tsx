import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Eye, Image as ImageIcon, Plus, Send, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../../utils/AlertHelper';
import { hostService, HostContent } from '../services/hostService';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

const MAX_INLINE_IMAGE_PICK = 5;
const DEFAULT_HOST_CONTENT_CATEGORY = 'Tin tức';
const BODY_IMAGE_MARKDOWN_PATTERN = /!\[[^\]]*\]\(([^)]+)\)/g;

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

type MediaItem = {
  uri: string;
  source: 'local' | 'remote';
};

type BodyEditorState = {
  text: string;
  imageUrls: string[];
};

const parseBodyForEditor = (rawBody: string | null | undefined): BodyEditorState => {
  const source = typeof rawBody === 'string' ? rawBody : '';

  if (!source.trim()) {
    return {
      text: '',
      imageUrls: [],
    };
  }

  const imageUrls = [...source.matchAll(BODY_IMAGE_MARKDOWN_PATTERN)]
    .map((match) => (match[1] || '').trim())
    .filter(Boolean);

  const text = source
    .replace(BODY_IMAGE_MARKDOWN_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    text,
    imageUrls,
  };
};

const buildBodyForSubmit = (text: string, imageUrls: string[]) => {
  const normalizedText = text.trim();
  const normalizedImages = imageUrls
    .map((item) => item.trim())
    .filter(Boolean);

  const markdownImages = normalizedImages
    .map((url) => `![](${url})`)
    .join('\n\n');

  if (normalizedText && markdownImages) {
    return `${normalizedText}\n\n${markdownImages}`;
  }

  return normalizedText || markdownImages;
};

const resolveFirstCoverImage = (content?: HostContent): MediaItem | null => {
  const firstImage = content?.hostContentMediaUrls?.[0];
  if (!firstImage) {
    return null;
  }

  return {
    uri: firstImage,
    source: 'remote',
  };
};

const CreatePromotionalContentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editContent = route.params?.editContent as HostContent | undefined;
  const isEditMode = Boolean(editContent?.hostContentId);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Dashboard');
  };

  const [title, setTitle] = useState(editContent?.hostContentTitle || '');
  const [description, setDescription] = useState(editContent?.hostContentDescription || '');
  const initialBodyEditorState = useMemo(
    () => parseBodyForEditor(editContent?.hostContentBody),
    [editContent?.hostContentBody],
  );
  const [bodyText, setBodyText] = useState(initialBodyEditorState.text);
  const [bodyImageUrls, setBodyImageUrls] = useState<string[]>(initialBodyEditorState.imageUrls);
  const [coverImage, setCoverImage] = useState<MediaItem | null>(resolveFirstCoverImage(editContent));
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingBodyImages, setUploadingBodyImages] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [bodyUploadError, setBodyUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isBusy = submitting || uploadingBodyImages || uploadingCoverImage;

  useEffect(() => {
    if (!editContent?.hostContentId) {
      return;
    }

    const parsedBody = parseBodyForEditor(editContent.hostContentBody);

    setTitle(editContent.hostContentTitle || '');
    setDescription(editContent.hostContentDescription || '');
    setBodyText(parsedBody.text);
    setBodyImageUrls(parsedBody.imageUrls);
    setCoverImage(resolveFirstCoverImage(editContent));
    setBodyUploadError(null);
    setShowPreview(false);
  }, [editContent?.hostContentId]);

  const requestMediaPermission = async (): Promise<boolean> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      CustomAlert('Thông báo', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return false;
    }

    return true;
  };

  const pickImagesFromLibrary = async (selectionLimit: number): Promise<string[]> => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) {
      return [];
    }

    return result.assets.map((asset) => asset.uri).slice(0, selectionLimit);
  };

  const handlePickCoverImage = async () => {
    if (isBusy) {
      return;
    }

    const picked = await pickImagesFromLibrary(1);
    if (picked.length === 0) {
      return;
    }

    setCoverImage({
      uri: picked[0],
      source: 'local',
    });
  };

  const handleInsertImageIntoBody = async () => {
    if (isBusy) {
      return;
    }

    const picked = await pickImagesFromLibrary(MAX_INLINE_IMAGE_PICK);
    if (picked.length === 0) {
      return;
    }

    setBodyUploadError(null);
    setUploadingBodyImages(true);
    try {
      const uploaded = await hostService.uploadMedia(picked);
      const nextUrls = (uploaded.urls || []).map((url) => url.trim()).filter(Boolean);
      setBodyImageUrls((prev) => [...prev, ...nextUrls]);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể tải ảnh nội dung.'
          : 'Không thể tải ảnh nội dung.';

      setBodyUploadError(message);
    } finally {
      setUploadingBodyImages(false);
    }
  };

  const removeBodyImage = (index: number) => {
    if (isBusy) {
      return;
    }

    setBodyImageUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const removeCoverImage = () => {
    if (isBusy) {
      return;
    }

    setCoverImage(null);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBodyText('');
    setBodyImageUrls([]);
    setCoverImage(null);
    setBodyUploadError(null);
    setShowPreview(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      CustomAlert('Thiếu thông tin', 'Vui lòng nhập tiêu đề nội dung quảng bá.');
      return;
    }

    if (!description.trim()) {
      CustomAlert('Thiếu thông tin', 'Vui lòng nhập mô tả ngắn cho nội dung quảng bá.');
      return;
    }

    if (!bodyText.trim() && bodyImageUrls.length === 0) {
      CustomAlert('Thiếu thông tin', 'Vui lòng nhập nội dung quảng bá hoặc thêm ảnh nội dung.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCoverUrl =
        coverImage?.source === 'remote'
          ? coverImage.uri
          : null;

      if (coverImage?.source === 'local') {
        setUploadingCoverImage(true);
        try {
          const uploadedCover = await hostService.uploadMedia([coverImage.uri]);
          finalCoverUrl = uploadedCover.urls?.[0] || null;
        } finally {
          setUploadingCoverImage(false);
        }
      }

      const finalMediaUrls = finalCoverUrl ? [finalCoverUrl] : [];
      const bodyValue = buildBodyForSubmit(bodyText, bodyImageUrls);

      if (isEditMode && editContent?.hostContentId) {
        await hostService.updateContent(editContent.hostContentId, {
          title: title.trim(),
          description: description.trim(),
          body: bodyValue,
          category: DEFAULT_HOST_CONTENT_CATEGORY,
          mediaUrls: finalMediaUrls,
        });

        CustomAlert('Đã cập nhật', 'Tin tức đã được cập nhật thành công.', [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate('Dashboard');
            },
          },
        ]);
      } else {
        await hostService.createContent({
          title: title.trim(),
          description: description.trim(),
          body: bodyValue,
          category: DEFAULT_HOST_CONTENT_CATEGORY,
          mediaUrls: finalMediaUrls,
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
      }
    } catch (error: unknown) {
      setUploadingCoverImage(false);
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể lưu nội dung quảng bá.'
          : 'Không thể lưu nội dung quảng bá.';

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
            <ArrowLeft color="#FFFFFF" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Chỉnh sửa tin tức' : 'Tạo nội dung quảng bá'}</Text>
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

            <Text style={styles.label}>Mô tả ngắn</Text>
            <TextInput
              style={[styles.input, styles.summaryTextArea]}
              placeholder="Tóm tắt ngắn gọn nội dung bạn muốn quảng bá"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Nội dung quảng bá (có thể chèn ảnh)</Text>
            <TextInput
              style={[styles.input, styles.contentTextArea]}
              placeholder="Nhập nội dung chi tiết. Bạn có thể chèn ảnh minh họa vào nội dung."
              multiline
              textAlignVertical="top"
              value={bodyText}
              onChangeText={setBodyText}
            />

            {uploadingBodyImages ? (
              <View style={styles.bodyUploadLoadingBox}>
                <ActivityIndicator color="#166534" size="small" />
                <Text style={styles.bodyUploadLoadingText}>Đang tải ảnh nội dung...</Text>
              </View>
            ) : null}

            {bodyUploadError ? (
              <Text style={styles.bodyUploadErrorText}>{bodyUploadError}</Text>
            ) : null}

            {bodyImageUrls.length > 0 ? (
              <View style={styles.bodyImageGrid}>
                {bodyImageUrls.map((url, index) => (
                  <View key={`${url}_${index}`} style={styles.bodyImageItem}>
                    <Image
                      source={{ uri: resolveImageUrl(url) }}
                      style={styles.bodyImagePreview}
                      resizeMode="contain"
                    />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeBodyImage(index)}
                      disabled={isBusy}
                    >
                      <X color="white" size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.bodyImageActionRow}>
              <TouchableOpacity
                style={[styles.bodyImageBtn, isBusy && styles.disabledBtn]}
                onPress={handleInsertImageIntoBody}
                disabled={isBusy}
              >
                {uploadingBodyImages ? (
                  <ActivityIndicator color="#166534" size="small" />
                ) : (
                  <ImageIcon color="#166534" size={16} />
                )}
                <Text style={styles.bodyImageBtnText}>Chèn ảnh vào nội dung</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Ảnh bìa bài đăng</Text>
            {coverImage ? (
              <View style={styles.coverPreviewCard}>
                <Image
                  source={{ uri: coverImage.source === 'local' ? coverImage.uri : resolveImageUrl(coverImage.uri) }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={removeCoverImage}
                  disabled={isBusy}
                >
                  <X color="white" size={12} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.coverPlaceholder}>
                <ImageIcon color="#64748B" size={20} />
                <Text style={styles.coverPlaceholderText}>Chưa có ảnh bìa</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addCoverBtn, isBusy && styles.disabledBtn]}
              onPress={handlePickCoverImage}
              disabled={isBusy}
            >
              <Plus color="#166534" size={16} />
              <Text style={styles.addCoverText}>{coverImage ? 'Thay ảnh bìa' : 'Chọn ảnh bìa'}</Text>
            </TouchableOpacity>

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
                style={[styles.submitBtn, isBusy && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text style={styles.submitText}>{isEditMode ? 'Lưu thay đổi' : 'Đăng nội dung'}</Text>
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

              <Text style={styles.previewLabel}>Mô tả ngắn</Text>
              <Text style={styles.previewValue}>{description || '(Chưa nhập)'}</Text>

              <Text style={styles.previewLabel}>Nội dung chi tiết</Text>
              <Text style={styles.previewValue}>{bodyText || '(Chưa nhập)'}</Text>

              <Text style={styles.previewLabel}>Ảnh nội dung</Text>
              <Text style={styles.previewValue}>
                {bodyImageUrls.length > 0 ? `${bodyImageUrls.length} ảnh` : 'Chưa có ảnh nội dung'}
              </Text>

              {bodyImageUrls.length > 0 ? (
                <View style={styles.previewImageGrid}>
                  {bodyImageUrls.map((url, index) => (
                    <Image
                      key={`preview-body-image-${index}`}
                      source={{ uri: resolveImageUrl(url) }}
                      style={styles.previewInlineImage}
                      resizeMode="contain"
                    />
                  ))}
                </View>
              ) : null}

              <Text style={styles.previewLabel}>Ảnh bìa</Text>
              <Text style={styles.previewValue}>{coverImage ? 'Đã chọn 1 ảnh bìa' : 'Chưa chọn ảnh bìa'}</Text>
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
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingTop: 14 + STATUS_BAR_OFFSET,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2e7d32',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
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
  summaryTextArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  contentTextArea: {
    minHeight: 160,
    paddingTop: 10,
  },
  bodyUploadLoadingBox: {
    marginTop: 10,
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bodyUploadLoadingText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  bodyUploadErrorText: {
    marginTop: 8,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  bodyImageGrid: {
    marginTop: 10,
    gap: 8,
  },
  bodyImageItem: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  bodyImagePreview: {
    width: '100%',
    height: 260,
    backgroundColor: '#E2E8F0',
  },
  bodyImageActionRow: {
    marginTop: 10,
  },
  bodyImageBtn: {
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bodyImageBtnText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  coverPreviewCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  coverPlaceholderText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  addCoverBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addCoverText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
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
    lineHeight: 20,
  },
  previewImageGrid: {
    marginTop: 8,
    gap: 8,
  },
  previewInlineImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
});

export default CreatePromotionalContentScreen;
