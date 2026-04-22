import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ListOrdered, Package, Trash2 } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';

const ManagementCenterScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <MobileLayout title="Trung tâm quản lý" scrollEnabled={true}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate('Packages')}
          activeOpacity={0.9}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }]}>
              <Package size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Xem gói dịch vụ</Text>
              <Text style={styles.rowDesc}>Các gói ưu tiên & dịch vụ.</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate('MyPost')}
          activeOpacity={0.9}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
              <ListOrdered size={18} color="#0F172A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Danh sách tin đã đăng</Text>
              <Text style={styles.rowDesc}>Quản lý các tin cá nhân/cửa hàng.</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate('PostTrash')}
          activeOpacity={0.9}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Trash2 size={18} color="#B91C1C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Thùng rác bài đăng</Text>
              <Text style={styles.rowDesc}>Khôi phục các tin đã ẩn.</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 100,
    gap: 12,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
  },
  rowItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  rowDesc: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default ManagementCenterScreen;

