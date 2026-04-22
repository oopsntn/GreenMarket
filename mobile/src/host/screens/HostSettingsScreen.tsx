import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, LogOut, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import MobileLayout from '../../components/Reused/MobileLayout/MobileLayout';
import { useAuth } from '../../context/AuthContext';

const HostSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <MobileLayout title="Cài đặt" headerStyle="default">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Account</Text>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.menuItemLeft}>
              <User size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Profile</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color="#ff4d4f" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sign out</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.footer]}>
          <Text style={styles.appVersion}>GreenMarket Host v1.0.0</Text>
        </View>
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f9fafb',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuItemDanger: {
    borderColor: '#ffcccb',
    backgroundColor: '#fff7f7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuItemTextDanger: {
    color: '#ff4d4f',
  },
  footer: {
    marginBottom: 32,
  },
  appVersion: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default HostSettingsScreen;

