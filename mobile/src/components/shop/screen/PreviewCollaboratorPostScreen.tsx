import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { MapPin, Maximize2, ShieldCheck, Eye, Store, ExternalLink } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { postService } from '../../post/service/postService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { MediaGallery } from '../../post/components/MediaGallery';
import Card from '../../Reused/Card/Card';
import Button from '../../Reused/Button/Button';

interface Props {
  route: any;
  navigation: any;
}

const PreviewCollaboratorPostScreen = ({ route, navigation }: Props) => {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { postId } = route.params;

  useEffect(() => {
    loadData();
  }, [postId]);

  const loadData = async () => {
    try {
      // Vì không can thiệp backend, ta lấy tất cả bài đăng của shop/user và filter
      const posts = await postService.getMyPosts();
      const targetPost = posts.find((p: any) => p.postId === postId);
      
      if (targetPost) {
        setPost(targetPost);
      } else {
        setPost(null);
        console.error('PreviewCollaboratorPostScreen: Không tìm thấy bài đăng trong danh sách my-posts');
      }
    } catch (e) {
      console.error("PreviewCollaboratorPostScreen loadData error: ", e);
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    const lat = post?.shop?.shopLat || post?.postLat;
    const lng = post?.shop?.shopLng || post?.postLng;
    const addr = post?.shop?.shopLocation || post?.postLocation;
    const label = encodeURIComponent(post?.postTitle || 'Vị trí cây cảnh');

    if (Platform.OS === 'web') {
      const webUrl = lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
      Linking.openURL(webUrl);
      return;
    }

    let url = '';
    if (Platform.OS === 'ios') {
      url = lat && lng
        ? `maps:0,0?q=${label}@${lat},${lng}`
        : `maps:0,0?q=${encodeURIComponent(addr)}`;
    } else {
      url = lat && lng
        ? `geo:${lat},${lng}?q=${lat},${lng}(${label})`
        : `geo:0,0?q=${encodeURIComponent(addr)}`;
    }

    Linking.openURL(url).catch(() => {
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
      Linking.openURL(fallbackUrl);
    });
  };

  if (loading) return <View style={styles.center}><Text>Đang tải chi tiết bài đăng...</Text></View>;
  if (!post) return <View style={styles.center}><Text>Không tìm thấy thông tin bài đăng hoặc lỗi tải dữ liệu.</Text></View>;

  const normalizeMediaUrl = (raw: unknown): string => {
    if (!raw) return '';
    if (typeof raw === 'string') return resolveImageUrl(raw);
    if (typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      const url =
        (typeof record.imageUrl === 'string' && record.imageUrl) ||
        (typeof record.videoUrl === 'string' && record.videoUrl) ||
        (typeof record.url === 'string' && record.url) ||
        '';
      return resolveImageUrl(url);
    }
    return resolveImageUrl(String(raw));
  };

  const media = [
    ...(post?.images || []).map((i: any) => ({ type: 'image', url: normalizeMediaUrl(i) })),
    ...(post?.videos || []).map((v: any) => ({ type: 'video', url: normalizeMediaUrl(v) })),
  ];

  return (
    <MobileLayout
      title="Xem trước bài đăng"
      headerStyle="default"
      backButton={() => navigation.goBack()}
      scrollEnabled={true}
    >
      <MediaGallery media={media} />

      <View style={styles.container}>
        <View style={styles.mainInfo}>
          <Text style={styles.postTitle}>{post?.postTitle}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.verifyBadge}>
              <ShieldCheck size={14} color="#f59e0b" />
              <Text style={[styles.verifyText, { color: '#f59e0b' }]}>Đang chờ duyệt</Text>
            </View>
            <View style={styles.metaBadge}>
              <Eye size={14} color="#8c8c8c" />
              <Text style={styles.metaText}>{post?.postViewCount || 0} lượt xem</Text>
            </View>
          </View>
        </View>

        {post?.attributes && post.attributes.length > 0 && (
          <Card style={styles.sectionCard} shadow padding="medium">
            <View style={styles.sectionHeader}>
              <Maximize2 size={18} color="#52c41a" />
              <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            </View>
            <View style={styles.attrGrid}>
              {post.attributes.map((attr: any, index: number) => (
                <View key={index} style={styles.attrItem}>
                  <Text style={styles.attrLabel}>{attr.attributeTitle || attr.name || `Thuộc tính ${attr.attributeId}`}</Text>
                  <Text style={styles.attrValue}>{attr.value}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {post?.shop && (
          <Card
            style={styles.shopCard}
            padding="medium"
          >
            <View style={styles.shopContent}>
              <View style={styles.shopAvatar}>
                <Store size={24} color="#52c41a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{post.shop.shopName}</Text>
                <Text style={styles.shopSub}>Cửa hàng sở hữu</Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.sectionCard} padding="medium">
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#52c41a" />
            <Text style={styles.sectionTitle}>Vị trí</Text>
          </View>
          <Text style={styles.locationText}>{post?.shop?.shopLocation || post?.postLocation}</Text>
          <Button
            variant="outline"
            size="small"
            style={{ marginTop: 12, borderColor: '#d9d9d9' }}
            textStyle={{ color: '#595959' }}
            onPress={openMap}
          >
            Mở trong bản đồ
          </Button>
        </Card>

        <View style={{ height: 40 }} />
      </View>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainInfo: {
    marginBottom: 20,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#262626',
    lineHeight: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  verifyText: { fontSize: 12, marginLeft: 4, fontWeight: '600' },
  metaBadge: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#8c8c8c', fontSize: 12, marginLeft: 4 },
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attrItem: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  attrLabel: { fontSize: 11, color: '#8c8c8c', marginBottom: 2 },
  attrValue: { fontSize: 13, color: '#262626', fontWeight: '600' },
  shopCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  shopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f6ffed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopName: { fontSize: 16, fontWeight: '700', color: '#262626' },
  shopSub: { fontSize: 12, color: '#8c8c8c' },
  locationText: { fontSize: 14, color: '#595959' },
});

export default PreviewCollaboratorPostScreen;
