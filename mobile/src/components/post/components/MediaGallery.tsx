import React, { useState } from 'react';
import { View, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity, Linking, Text } from 'react-native';
import { Play } from 'lucide-react-native';
import { logMediaResolveError, resolveImageUrl } from '@/utils/resolveImageUrl';

const { width } = Dimensions.get('window');

export const MediaGallery = ({ media }: { media: any[] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

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
                renderItem={({ item }) => {
                    const resolvedUrl = resolveImageUrl(item.url, { debugLabel: `post-media-${item.type}` });

                    return (
                        <View style={styles.slide}>
                            {item.type === 'image' ? (
                                <Image
                                    source={{ uri: resolvedUrl }}
                                    style={styles.image}
                                    onError={(error) => logMediaResolveError('post-media-image', item.url, error?.nativeEvent)}
                                />
                            ) : (
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={[styles.image, styles.videoPlaceholder]}
                                    onPress={() => Linking.openURL(resolvedUrl)}
                                >
                                    <Play size={48} color="#fff" />
                                    <Text style={styles.videoHint}>Mở video</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
                keyExtractor={(item, index) => `${item.url}-${index}`}
            />
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
    videoPlaceholder: {
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoHint: {
        marginTop: 10,
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    pagination: { flexDirection: 'row', position: 'absolute', bottom: 12, alignSelf: 'center', gap: 6, zIndex: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
    activeDot: { backgroundColor: '#10b981', width: 12 },
    emptyContainer: { width: width, aspectRatio: 3 / 2, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    placeholderImage: { width: '100%', height: '100%', backgroundColor: '#e0e0e0' }
});
