import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera, User, ShieldCheck } from 'lucide-react-native';

interface ProfileAvatarProps {
    uri: string;
    onPickImage: () => void;
    isVerified?: boolean;
}

export const ProfileAvatar = ({ uri, onPickImage, isVerified = true }: ProfileAvatarProps) => (
    <View style={styles.container}>
        <View style={styles.avatarWrapper}>
            <TouchableOpacity 
                activeOpacity={0.85}
                onPress={onPickImage} 
                style={styles.imageContainer}
            >
                {uri ? (
                    <Image source={{ uri }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <User color="#10b981" size={48} />
                    </View>
                )}
                <View style={styles.cameraBadge}>
                    <Camera color="#fff" size={16} />
                </View>
            </TouchableOpacity>

            {isVerified && (
                <View style={styles.verifiedBadge}>
                    <ShieldCheck color="#fff" size={12} fill="#10b981" />
                </View>
            )}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: -60, // Pulled up into the header gradient
    },
    avatarWrapper: {
        position: 'relative',
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 40, // Square with soft corners (modern look)
        backgroundColor: '#fff',
        padding: 4,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 36,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#10b981',
        padding: 8,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#fff',
        elevation: 5,
    },
    verifiedBadge: {
        position: 'absolute',
        top: -6,
        left: -6,
        backgroundColor: '#10b981',
        padding: 6,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});