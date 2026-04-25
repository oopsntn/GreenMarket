import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RotateCcw, Trash2 } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { postService } from '../service/postService';
import CustomAlert from '../../../utils/AlertHelper';

const PostTrashScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await postService.getMyPosts();
      setPosts(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to load trashed posts:', e);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const trashed = useMemo(() => posts.filter((p) => p?.postStatus === 'hidden'), [posts]);

  const handleRestore = async (postId: number) => {
    try {
      await postService.restorePost(postId);
      CustomAlert('Thành công', 'Đã khôi phục bài đăng.');
      await load(true);
    } catch (e) {
      console.error('Restore failed:', e);
      CustomAlert('Lỗi', 'Không thể khôi phục bài đăng.');
    }
  };

  return (
    <MobileLayout title="Thùng rác" scrollEnabled={false} backButton={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={trashed}
          keyExtractor={(item, index) => String(item?.postId ?? index)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item?.postTitle || 'Bài đăng'}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  ID: {item?.postId}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={() => handleRestore(Number(item.postId))}
                activeOpacity={0.9}
              >
                <RotateCcw size={16} color="#065F46" />
                <Text style={styles.restoreText}>Khôi phục</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Trash2 size={42} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Thùng rác trống</Text>
              <Text style={styles.emptyDesc}>Các bài đăng đã ẩn sẽ hiển thị ở đây.</Text>
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
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
  },
  title: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  sub: { marginTop: 4, fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  restoreBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  restoreText: { fontSize: 11, fontWeight: '900', color: '#065F46' },
  emptyTitle: { marginTop: 6, fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyDesc: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
});

export default PostTrashScreen;

