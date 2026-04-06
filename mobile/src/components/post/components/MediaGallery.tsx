// mobile/src/components/post/components/MediaGallery.tsx
import React, { useState } from 'react';
import { View, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Play } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const MediaGallery = ({ media }: { media: any[] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <View>
            <FlatList
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveIndex(index);
                }}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        {item.type === 'image' ? (
                            <Image source={{ uri: item.url }} style={styles.image} />
                        ) : (
                            <View style={[styles.image, styles.videoPlaceholder]}>
                                <Play size={48} color="#fff" />
                            </View>
                        )}
                    </View>
                )}
            />
            {/* Pagination Dots */}
            <div style={styles.pagination}>
                {media.map((_, i) => (
                    <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
                ))}
            </div>
        </View>
    );
};

const styles = StyleSheet.create({
    slide: { width: width, aspectRatio: 3 / 2 },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    videoPlaceholder: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    pagination: { flexDirection: 'row', position: 'absolute', bottom: 16, alignSelf: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    activeDot: { backgroundColor: '#10b981', width: 12 }
});