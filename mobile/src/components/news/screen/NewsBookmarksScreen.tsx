import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { api } from '../../../config/api';
import { Bookmark } from 'lucide-react-native';

type HostPublicContent = {
  hostContentId: number;
  hostContentTitle: string;
  hostContentDescription?: string | null;
  hostContentCategory?: string | null;
  hostContentMediaUrls?: string[] | null;
  hostContentCreatedAt?: string | null;
};

const normalizeMediaUrls = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string' && x.length > 0) as string[];
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const NewsBookmarksScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<HostPublicContent[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get<{ data: HostPublicContent[] }>('/host/favorites');
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(
        rows.map((row: any) => ({
          ...row,
          hostContentMediaUrls: normalizeMediaUrls(row?.hostContentMediaUrls),
        })),
      );
    } catch (e) {
      console.error('Failed to fetch news bookmarks:', e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const data = useMemo(() => items.filter((x) => x && typeof x.hostContentId === 'number'), [items]);

  return (
    <MobileLayout title="Tin tức đã lưu" scrollEnabled={false} backButton={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.hostContentId)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => {
            const cover = item.hostContentMediaUrls?.[0] ? resolveImageUrl(item.hostContentMediaUrls[0]) : '';
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('NewsDetail', { hostContentId: item.hostContentId })}
              >
                <View style={styles.thumbWrap}>
                  {cover ? <Image source={{ uri: cover }} style={styles.thumb} /> : null}
                </View>
                <View style={styles.content}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.hostContentTitle}
                  </Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.hostContentDescription || 'Không có mô tả.'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Bookmark size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa lưu tin tức nào</Text>
              <Text style={styles.emptyDesc}>Bạn có thể lưu bài viết để xem lại nhanh tại đây.</Text>
            </View>
          }
        />
      )}
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  list: { padding: 14, paddingBottom: 100, gap: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbWrap: { width: 96, height: 84, backgroundColor: '#F1F5F9' },
  thumb: { width: '100%', height: '100%' },
  content: { flex: 1, paddingVertical: 10, paddingRight: 12 },
  title: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  desc: { marginTop: 4, fontSize: 11, fontWeight: '600', color: '#64748B', lineHeight: 16 },
  emptyTitle: { marginTop: 6, fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyDesc: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
});

export default NewsBookmarksScreen;

