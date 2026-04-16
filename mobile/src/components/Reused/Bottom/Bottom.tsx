import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    SafeAreaView
} from 'react-native';
import { Home, Search, Plus, Heart, User } from 'lucide-react-native';

interface BottomProps {
    currentRoute: string;
    onNavigate: (route: string) => void;
}

const Bottom: React.FC<BottomProps> = ({ currentRoute, onNavigate }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.bottomNav}>

                {/* Home */}
                <TouchableOpacity
                    style={styles.bottomItem}
                    onPress={() => onNavigate('home')}
                >
                    <Home size={22} color={currentRoute === 'home' ? '#52c41a' : '#8c8c8c'} />
                    <Text style={[styles.label, currentRoute === 'home' && styles.activeLabel]}>Trang chủ</Text>
                </TouchableOpacity>

                {/* Search */}
                <TouchableOpacity
                    style={styles.bottomItem}
                    onPress={() => onNavigate('search')}
                >
                    <Search size={22} color={currentRoute === 'search' ? '#52c41a' : '#8c8c8c'} />
                    <Text style={[styles.label, currentRoute === 'search' && styles.activeLabel]}>Tìm kiếm</Text>
                </TouchableOpacity>

                {/* Center Plus Button */}
                <View style={styles.centerContainer}>
                    <TouchableOpacity
                        style={styles.bottomItemCenter}
                        activeOpacity={0.8}
                        onPress={() => onNavigate('create')}
                    >
                        <Plus size={28} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Favorites */}
                <TouchableOpacity
                    style={styles.bottomItem}
                    onPress={() => onNavigate('favorites')}
                >
                    <Heart size={22} color={currentRoute === 'favorites' ? '#52c41a' : '#8c8c8c'} />
                    <Text style={[styles.label, currentRoute === 'favorites' && styles.activeLabel]}>Đã lưu</Text>
                </TouchableOpacity>

                {/* Profile */}
                <TouchableOpacity
                    style={styles.bottomItem}
                    onPress={() => onNavigate('profile')}
                >
                    <User size={22} color={currentRoute === 'profile' ? '#52c41a' : '#8c8c8c'} />
                    <Text style={[styles.label, currentRoute === 'profile' && styles.activeLabel]}>Cá nhân</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#fff', // Tránh bị đè bởi vạch home của iPhone
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 64,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        paddingHorizontal: 10,
    },
    bottomItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        color: '#8c8c8c',
        marginTop: 4,
        fontWeight: '500',
    },
    activeLabel: {
        color: '#52c41a',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomItemCenter: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#52c41a',
        justifyContent: 'center',
        alignItems: 'center',
        // Đẩy lên cao giống Web translateY(-12px)
        marginTop: -35,
        // Shadow
        ...Platform.select({
            ios: {
                shadowColor: '#52c41a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 8,
            },
        }),
    },
});

export default Bottom;