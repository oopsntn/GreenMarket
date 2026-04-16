import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ProfileInfoCard = ({ registeredAt }: { registeredAt?: string }) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <Text style={styles.label}>THÀNH VIÊN TỪ</Text>
      <Text style={styles.value}>{registeredAt ? new Date(registeredAt).toLocaleDateString('vi-VN') : 'Mới'}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>TRẠNG THÁI</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Hoạt động</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1 },
  value: { fontSize: 13, color: '#4b5563' },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: '#059669', fontSize: 11, fontWeight: 'bold' }
});
