import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
    ViewStyle,
    KeyboardAvoidingView
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
// Nếu dùng Expo: npx expo install expo-linear-gradient
import { LinearGradient } from 'react-native-linear-gradient';

interface MobileLayoutProps {
    title?: string;
    children: React.ReactNode;
    bottom?: React.ReactNode;
    backButton?: () => void;
    rightAction?: React.ReactNode;
    headerStyle?: 'default' | 'transparent' | 'gradient';
    containerStyle?: ViewStyle;
    scrollEnabled?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
    title,
    children,
    bottom,
    backButton,
    rightAction,
    headerStyle = 'default',
    containerStyle
}) => {

    // Hàm render Header tùy biến theo style
    const renderHeader = () => {
        const isGradient = headerStyle === 'gradient';
        const isTransparent = headerStyle === 'transparent';

        const HeaderWrapper = isGradient ? LinearGradient : View;
        const wrapperProps = isGradient
            ? { colors: ['#52c41a', '#2e7d32'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
            : {};

        return (
            <HeaderWrapper
                {...wrapperProps}
                style={[
                    styles.header,
                    isTransparent && styles.headerTransparent,
                    !isGradient && !isTransparent && styles.headerDefault
                ]}
            >
                <View style={styles.headerContent}>
                    {backButton && (
                        <TouchableOpacity onPress={backButton} style={styles.backButton}>
                            <ChevronLeft size={28} color={headerStyle === 'default' ? '#fff' : '#333'} />
                        </TouchableOpacity>
                    )}

                    <Text style={[
                        styles.headerTitle,
                        { color: headerStyle === 'default' ? '#fff' : '#333' }
                    ]}>
                        {title}
                    </Text>

                    {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
                </View>
            </HeaderWrapper>
        );
    };

    return (
        <View style={styles.container}>
            {/* Cấu hình thanh trạng thái (Pin, Sóng, Giờ) */}
            <StatusBar barStyle={headerStyle === 'default' ? 'light-content' : 'dark-content'} />

            <SafeAreaView style={{ flex: 0, backgroundColor: headerStyle === 'default' ? '#2e7d32' : '#fff' }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                {title && renderHeader()}

                {/* Body */}
                <ScrollView
                    style={[styles.body, containerStyle]}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>

                {/* Bottom Navigation / Footer */}
                {bottom && <View style={styles.bottomWrapper}>{bottom}</View>}
            </KeyboardAvoidingView>

            {/* Đảm bảo phần dưới cùng không bị che bởi vạch home của iPhone */}
            <SafeAreaView style={{ flex: 0, backgroundColor: '#fff' }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 10,
        ...Platform.select({
            android: { paddingTop: 12 }, // Android bù đắp thêm chút padding
        }),
    },
    headerDefault: {
        backgroundColor: '#2e7d32',
    },
    headerTransparent: {
        backgroundColor: 'transparent',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center', // Căn giữa tiêu đề (đặc trưng Mobile)
    },
    backButton: {
        paddingRight: 12,
        zIndex: 1,
    },
    rightAction: {
        paddingLeft: 12,
        zIndex: 1,
    },
    body: {
        flex: 1,
    },
    bottomWrapper: {
        // Có thể thêm shadow nếu muốn Bottom nổi lên
        backgroundColor: '#fff',
    },
});

export default MobileLayout;