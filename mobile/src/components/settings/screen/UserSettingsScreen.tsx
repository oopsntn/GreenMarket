import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LayoutDashboard, LogOut, User, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';

const UserSettingsScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Sign out',
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

  return (
    <MobileLayout
      title="Settings"
      headerStyle="default"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Settings Options */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Account</Text>
          </View>

          {/* Profile Menu Item */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleProfilePress}
          >
            <View style={styles.menuItemLeft}>
              <User size={20} color="#22C55E" />
              <Text style={styles.menuItemText}>Profile</Text>
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

          {/* Logout Menu Item */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color="#ff4d4f" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sign out</Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={[styles.section, styles.footer]}>
          <Text style={styles.appVersion}>GreenMarket v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 GreenMarket. All rights reserved.</Text>
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
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#d1d5db',
    textAlign: 'center',
  },
});

export default UserSettingsScreen;
