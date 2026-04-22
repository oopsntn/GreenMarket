import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CalendarDays, Search } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { HostPublicContent, newsService } from '../service/newsService';

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const getCover = (item: HostPublicContent) => {
  const first = Array.isArray(item.hostContentMediaUrls) ? item.hostContentMediaUrls[0] : null;
  return first ? resolveImageUrl(first) : '';
};

const NewsListScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<HostPublicContent[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await newsService.getPublicContents({
        search: debouncedSearch || undefined,
        page: 1,
        limit: 20,
      });
      setItems(res.data);
    } catch (e) {
      console.error('Failed to fetch news:', e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const data = useMemo(() => items.filter((x) => x && typeof x.hostContentId === 'number'), [items]);

  return (
    <MobileLayout scrollEnabled={false} title="Tin tức">
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

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
            const cover = getCover(item);
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('NewsDetail', { hostContentId: item.hostContentId })}
              >
                <View style={styles.thumbWrap}>
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Text style={styles.thumbPlaceholderText}>No image</Text>
                    </View>
                  )}
                </View>

                <View style={styles.content}>
                  <View style={styles.metaRow}>
                    <CalendarDays size={12} color="#94A3B8" />
                    <Text style={styles.metaText}>{formatDate(item.hostContentCreatedAt)}</Text>
                    {item.hostContentCategory ? (
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{String(item.hostContentCategory)}</Text>
                      </View>
                    ) : null}
                  </View>

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
              <Text style={styles.emptyTitle}>Không có bài viết phù hợp</Text>
              <Text style={styles.emptyDesc}>Thử đổi từ khóa tìm kiếm hoặc quay lại sau.</Text>
            </View>
          }
        />
      )}
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontWeight: '700',
    color: '#0F172A',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  list: {
    padding: 14,
    paddingBottom: 100,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: 108,
    height: 92,
    backgroundColor: '#F1F5F9',
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbPlaceholderText: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  content: { flex: 1, paddingVertical: 10, paddingRight: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  catBadgeText: { fontSize: 9, fontWeight: '900', color: '#065F46', textTransform: 'uppercase' },
  title: { marginTop: 6, fontSize: 13, fontWeight: '900', color: '#0F172A' },
  desc: { marginTop: 4, fontSize: 11, fontWeight: '600', color: '#64748B', lineHeight: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyDesc: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
});

export default NewsListScreen;

