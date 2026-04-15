import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { 
  Store, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Search
} from 'lucide-react-native';
import ManagerService, { ShopModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const ShopManagementList = ({ navigation }: any) => {
  const [shops, setShops] = useState<ShopModerationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const data = await ManagerService.getShops();
      // Show only pending
      setShops(data.filter(s => s.status.toLowerCase() === 'pending'));
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id: number) => {
    CustomAlert('Xác minh cửa hàng', 'Xác nhận cửa hàng này đủ điều kiện hoạt động?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xác minh', 
        onPress: async () => {
          try {
            await ManagerService.verifyShop(id);
            setShops(shops.filter(s => s.id !== id));
            CustomAlert('Thành công', 'Cửa hàng đã được kích hoạt');
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể xác minh cửa hàng');
          }
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: ShopModerationData }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ShopManagementDetail', { shopId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.shopIconContainer}>
          <Store color="#3B82F6" size={28} />
        </View>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{item.name}</Text>
          <Text style={styles.ownerName}>Chủ sở hữu: {item.ownerName}</Text>
        </View>
        <ChevronRight color="#CBD5E1" size={20} />
      </View>

      <View style={styles.addressRow}>
        <Text style={styles.addressText} numberOfLines={1}>{item.ownerEmail}</Text>
        <Text style={styles.timeText}>{item.createdAt}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardActions}>
        <View style={styles.pendingBadge}>
          <Clock size={14} color="#D97706" />
          <Text style={styles.pendingText}>{item.status}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.verifyBtn}
          onPress={() => handleVerify(item.id)}
        >
          <ShieldCheck size={18} color="white" />
          <Text style={styles.verifyBtnText}>Duyệt & Kích hoạt</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý cửa hàng</Text>
        <TouchableOpacity onPress={fetchShops} style={styles.iconCircle}>
          <Search size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={shops}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchShops}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={64} color="#CBD5E1" strokeWidth={1} />
              <Text style={styles.emptyText}>Tất cả cửa hàng đã được duyệt!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 13,
    color: '#64748B',
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
    marginRight: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  verifyBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default ShopManagementList;
