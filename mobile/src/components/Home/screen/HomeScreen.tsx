 import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Menu, Search, MapPin, Heart } from 'lucide-react-native';
import { postService } from '../../post/service/postService';
import { useNavigation } from '@react-navigation/native';
import FilterDrawer from '../components/FilterDrawer';
import { getServerBaseUrl } from '../../../config/api';
import { API_BASE_URL } from "../../../config/api";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 32 - 8) / 2; // 2 columns with padding

interface Post {
  postId: number;
  postSlug: string;
  postTitle: string;
  postPrice: number;
  postLocation?: string;
  images?: Array<{ imageUrl: string }>;
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    categoryId: '',
    location: '',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await postService.getCategories();
        setCategories(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: 10,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice;
        if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice;
        if (appliedFilters.categoryId) params.categoryId = appliedFilters.categoryId;
        if (appliedFilters.location) params.location = appliedFilters.location;

        const response = await postService.getPublicPosts(params);
        const postsData = response.data || [];
        setPosts(postsData);
        console.log('Posts fetched:', postsData.length, 'items with images:', postsData.filter((p: Post) => p.images?.length).length);

        if (response.meta?.totalPages) {
          setTotalPages(response.meta.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [debouncedSearch, appliedFilters, page]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      minPrice,
      maxPrice,
      categoryId: selectedCategoryId,
      location,
    });
    setShowDrawer(false);
  };

  const handleClearFilters = () => {
    setSelectedCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setPage(1);
    setAppliedFilters({
      minPrice: '',
      maxPrice: '',
      categoryId: '',
      location: '',
    });
    setShowDrawer(false);
  };

  const renderPostCard = ({ item }: { item: Post }) => {
    const imageUrl = item.images?.[0]?.imageUrl;
    let finalImageUrl = imageUrl
      ? imageUrl.startsWith('http')
        ? imageUrl
        : `http://${API_BASE_URL}:5000${imageUrl}`
      : null;

    // Replace localhost with actual machine IP for physical devices
    if (finalImageUrl?.includes('localhost')) {
      finalImageUrl = finalImageUrl.replace('localhost', '14.170.9.64');
    }

    console.log('Post:', item.postTitle, 'Image URL:', finalImageUrl);

    return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetail', { slug: item.postSlug })}
    >
      <View style={styles.imageContainer}>
        {finalImageUrl ? (
          <Image
            source={{ uri: finalImageUrl }}
            style={styles.postImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart size={20} color="#10b981" fill="#10b981" />
        </TouchableOpacity>
      </View>

      <View style={styles.postInfo}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.postTitle}
        </Text>
        <Text style={styles.postPrice}>
          {Number(item.postPrice).toLocaleString()} <Text style={styles.currencyText}>VND</Text>
        </Text>
        <View style={styles.locationContainer}>
          <MapPin size={12} color="#666" />
          <Text style={styles.locationText}>{item.postLocation || 'Hà Nội'}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Search and Menu */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowDrawer(true)}
          >
            <Menu size={28} color="#2e7d32" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm cây..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Posts Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderPostCard}
            keyExtractor={(item) => item.postId.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptySubText}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
          </View>
        )}

        {/* Filter Drawer */}
        <FilterDrawer
          visible={showDrawer}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          location={location}
          onLocationChange={setLocation}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          onClose={() => setShowDrawer(false)}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '600',
    color: '#111',
    fontSize: 14,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  postCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postInfo: {
    padding: 12,
  },
  postTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
    marginBottom: 6,
    lineHeight: 18,
  },
  postPrice: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 6,
  },
  currencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default HomeScreen;
