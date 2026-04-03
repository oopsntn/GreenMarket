import { Camera, User } from 'lucide-react-native';
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';


interface ProfileAvatarProps {
    uri: string;
    onPickImage: () => void;
}

export const ProfileAvatar = ({ uri, onPickImage }: ProfileAvatarProps) => (
    <View style={styles.container}>
        <TouchableOpacity onPress={onPickImage} style={styles.wrapper}>
            {uri ? (
                <Image source={{ uri }} style={styles.image} />
            ) : (
                <View style={styles.placeholder}>
                    <User color="#10b981" size={40} />
                </View>
            )}
            <View style={styles.cameraBadge}>
                <Camera color="#fff" size={14} />
            </View>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: { alignItems: 'center', marginVertical: 24 },
    wrapper: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f3f4f6', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    image: { width: 110, height: 110, borderRadius: 55 },
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cameraBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#10b981', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#fff' }
});