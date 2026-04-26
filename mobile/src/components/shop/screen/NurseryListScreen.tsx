import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Crown, Store } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Card from '../../Reused/Card/Card';
import { ShopService } from '../service/shopService';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

type ShopListItem = {
  shopId: number;
  shopName?: string | null;
  shopLocation?: string | null;
  shopDescription?: string | null;
  shopLogoUrl?: string | null;
  shopPreviewImageUrl?: string | null;
  shopGalleryImages?: string[] | null;
  shopIsVipActive?: boolean;
};

const getShopCover = (shop: ShopListItem): string => {
  const url = shop.shopPreviewImageUrl || shop.shopGalleryImages?.[0] || shop.shopLogoUrl || '';
  return resolveImageUrl(url || '');
};

const NurseryListScreen = () => {
  const navigation = useNavigation<any>();
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShops = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await ShopService.getAllShops({ page: 1, limit: 50 });
      setShops(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const data = useMemo(() => shops.filter((s) => s && typeof s.shopId === 'number'), [shops]);

  return (
    <MobileLayout scrollEnabled={false} title="Nhà vườn">
      {loading ? (
        <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
      ) : (
        <FlatList
          data={data}
          numColumns={2}
          keyExtractor={(item, index) => String(item.shopId ?? index)}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => fetchShops(true)}
          renderItem={({ item }) => {
            const isVip = Boolean(item.shopIsVipActive);
            const cover = getShopCover(item);

            return (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate('PublicShopDetail', { shopId: item.shopId })}
                activeOpacity={0.9}
              >
                <Card style={[styles.card, isVip ? styles.vipCard : styles.normalCard]}>
                  <View style={[styles.thumbWrap, isVip ? styles.vipThumb : null]}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.thumb} />
                    ) : (
                      <Store color={isVip ? '#D97706' : '#10b981'} size={30} />
                    )}
                  </View>

                  <View style={styles.body}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.shopName, isVip ? styles.vipName : null]} numberOfLines={1}>
                        {item.shopName || 'Nhà vườn'}
                      </Text>
                      {isVip ? (
                        <View style={styles.vipBadge}>
                          <Crown size={12} color="#92400E" />
                          <Text style={styles.vipBadgeText}>VIP</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.location} numberOfLines={1}>
                      {item.shopLocation || 'Chưa cập nhật địa chỉ'}
                    </Text>

                    <Text style={styles.description} numberOfLines={2}>
                      {item.shopDescription || 'Nhà vườn chưa cập nhật mô tả.'}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có nhà vườn hoạt động</Text>
              <Text style={styles.emptyText}>Các nhà vườn đã được duyệt và kích hoạt sẽ hiển thị ở đây.</Text>
            </View>
          }
        />
      )}
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 14,
    paddingBottom: 100,
  },
  columnWrap: {
    gap: 12,
    paddingBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  card: {
    padding: 12,
    borderWidth: 1,
  },
  normalCard: {
    borderColor: '#E2E8F0',
  },
  vipCard: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  vipThumb: {
    borderColor: '#FBBF24',
    backgroundColor: '#FEF3C7',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  body: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  vipName: {
    color: '#92400E',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 1,
  },
  location: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 90,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 20,
  },
});

export default NurseryListScreen;

