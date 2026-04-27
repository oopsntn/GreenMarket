import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Leaf } from 'lucide-react-native';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Leaf color="#16a34a" size={48} />
        </View>

        <Text style={styles.titleLine1}>
          CHỢ <Text style={styles.titleBold}>BONSAI</Text>
        </Text>
        <Text style={styles.titleLine2}>
          HỮU <Text style={styles.titleBold}>TÌNH</Text>
        </Text>

        <Text style={styles.subtitle}>
          Nơi kết nối các nhà vườn uy tín và người yêu cây cảnh nghệ thuật trên toàn quốc. Trải nghiệm không gian mua sắm xanh, hiện đại và tin cậy.
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>BẮT ĐẦU KHÁM PHÁ  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faf8',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  titleLine1: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 2,
  },
  titleLine2: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: -4,
  },
  titleBold: {
    color: '#16a34a',
  },
  subtitle: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 24,
    color: '#64748b',
    textAlign: 'center',
  },
  startButton: {
    marginTop: 36,
    backgroundColor: '#16a34a',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 36,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default WelcomeScreen;
