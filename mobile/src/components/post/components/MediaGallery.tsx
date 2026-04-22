// mobile/src/components/post/components/MediaGallery.tsx
import React, { useState } from 'react';
import { View, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Play } from 'lucide-react-native';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const { width } = Dimensions.get('window');

export const MediaGallery = ({ media }: { media: any[] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // Filter out items without valid URLs
    const validMedia = media.filter(item => item?.url);

    if (!validMedia || validMedia.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.placeholderImage} />
            </View>
        );
    }

    return (
        <View style={styles.galleryWrapper}>
            <FlatList
                data={validMedia}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveIndex(index);
                }}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        {item.type === 'image' ? (
                            <Image
                                source={{ uri: resolveImageUrl(item.url) }}
                                style={styles.image}
                                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                            />
                        ) : (
                            <View style={[styles.image, styles.videoPlaceholder]}>
                                <Play size={48} color="#fff" />
                            </View>
                        )}
                    </View>
                )}
                keyExtractor={(item, index) => `${item.url}-${index}`}
            />
            {/* Pagination Dots */}
            {validMedia.length > 1 && (
                <View style={styles.pagination}>
                    {validMedia.map((_, i) => (
                        <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    galleryWrapper: { position: 'relative', marginBottom: 8 },
    slide: { width: width, aspectRatio: 3 / 2 },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    videoPlaceholder: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    pagination: { flexDirection: 'row', position: 'absolute', bottom: 12, alignSelf: 'center', gap: 6, zIndex: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
    activeDot: { backgroundColor: '#10b981', width: 12 },
    emptyContainer: { width: width, aspectRatio: 3 / 2, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    placeholderImage: { width: '100%', height: '100%', backgroundColor: '#e0e0e0' }
});