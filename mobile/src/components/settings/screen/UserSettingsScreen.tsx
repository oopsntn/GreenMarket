import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Bell, LayoutDashboard, LogOut, User, ChevronRight, QrCode } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService } from '../../notification/service/notificationService';

const UserSettingsScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadUnreadCount = async () => {
        try {
          const count = await notificationService.getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('Failed to load unread count:', error);
        }
      };

      loadUnreadCount();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', onPress: () => { } },
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

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleManagementCenterPress = () => {
    navigation.navigate('ManagementCenter');
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  const handleSupportPress = () => {
    navigation.navigate('UserSupportRequest');
  };

  const handleQrLoginPress = () => {
    navigation.navigate('QrLoginScanner');
  };

  return (
    <MobileLayout
      title="Cài đặt"
      headerStyle="default"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Settings Options */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Tài khoản</Text>
          </View>

          {/* Profile Menu Item */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleProfilePress}
          >
            <View style={styles.menuItemLeft}>
              <User size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Hồ sơ cá nhân</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>

          {/* Management Center Menu Item */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleManagementCenterPress}
          >
            <View style={styles.menuItemLeft}>
              <LayoutDashboard size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Trung tâm quản lý</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNotificationsPress}
          >
            <View style={styles.menuItemLeft}>
              <Bell size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Thông báo</Text>
            </View>
            <View style={styles.menuItemRight}>
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
              <ChevronRight size={20} color="#d1d5db" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleQrLoginPress}
          >
            <View style={styles.menuItemLeft}>
              <QrCode size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Quét mã QR đăng nhập Web</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSupportPress}
          >
            <View style={styles.menuItemLeft}>
              <LayoutDashboard size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Gửi yêu cầu hỗ trợ</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>

          {/* Logout Menu Item */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color="#ff4d4f" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Đăng xuất</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={[styles.section, styles.footer]}>
          <Text style={styles.appVersion}>GreenMarket v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 GreenMarket. Đã đăng ký bản quyền.</Text>
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
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 6,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
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
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#d1d5db',
    textAlign: 'center',
  },
});

export default UserSettingsScreen;
