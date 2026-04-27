import React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

type ManagerHeaderProps = {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
};

const ManagerHeader = ({ title, onBack, rightAction }: ManagerHeaderProps) => {
  const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View style={styles.topArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
      <SafeAreaView style={styles.topArea}>
        <View style={[styles.header, { paddingTop: 10 + Math.max(0, statusBarOffset - 6) }]}>
          <View style={styles.headerContent}>
            <View style={styles.side}>
              {onBack ? (
                <TouchableOpacity
                  onPress={onBack}
                  style={styles.backButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={28} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>

            <View style={[styles.side, styles.sideRight]}>{rightAction}</View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  topArea: {
    backgroundColor: '#2e7d32',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 56,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

export default ManagerHeader;
