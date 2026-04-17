import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LogOut, User } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import MobileLayout from '../../components/Reused/MobileLayout/MobileLayout';

const ManagerSettingsScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất không?',
      [
        { text: 'Hủy', onPress: () => {} },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <MobileLayout title="Cài đặt" headerStyle="default">
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={32} color="#fff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.userDisplayName || 'Manager'}</Text>
              <Text style={styles.userPhone}>{user?.userMobile}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Account</Text>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <LogOut size={20} color="#ff4d4f" />
            <Text style={styles.menuItemText}>Sign out</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemSubtext}>Your data stays safe</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.footer]}>
          <Text style={styles.appVersion}>GreenMarket Quản lý v1.0.0</Text>
          <Text style={styles.copyright}>� 2024 GreenMarket. All rights reserved.</Text>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  menuItemRight: {
    alignItems: 'flex-end',
  },
  menuItemSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  footer: {
    marginBottom: 32,
  },
  appVersion: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#d1d5db',
    textAlign: 'center',
  },
});

export default ManagerSettingsScreen;
