import React, { useEffect, useState } from 'react';
import { getPublicPosts } from '../services/api';
import { Leaf, Search, ShoppingBag, Filter } from 'lucide-react';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");

  // Debounce search input to avoid spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const applyFilters = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (appliedMinPrice) params.minPrice = appliedMinPrice;
        if (appliedMaxPrice) params.maxPrice = appliedMaxPrice;

        const response = await getPublicPosts(params);
        // Backend returns `{ data, meta }` or just array directly, robust check:
        setPosts(response.data.data || response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [debouncedSearch, appliedMinPrice, appliedMaxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <header className="mb-16 text-center">
        <div className="flex justify-center mb-6">
          <Leaf className="w-16 h-16 text-emerald-500" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Chợ <span className="text-emerald-500">Bonsai</span> Hữu Tình
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Nơi hội tụ những tác phẩm nghệ thuật xanh, kết nối nhà vườn và những người yêu cây cảnh trên toàn quốc.
        </p>

        {/* Search Bar & Filters */}
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cây (Tùng la hán, Si, Sanh...)"
              className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl border border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>


        </div>
      </header>

      {/* Product Grid */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">
            {debouncedSearch ? `Kết quả tìm kiếm cho "${debouncedSearch}"` : "Tin rao mới nhất"}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-surface rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {posts && posts.length > 0 ? posts.map((post) => (
              <div key={post.postId} className="group glass rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="aspect-square bg-slate-900 overflow-hidden relative">
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0].imageUrl} alt={post.postTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-800">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {post.postTitle}
                  </h3>
                  <div className="flex justify-between items-end">
                    <p className="text-emerald-500 font-bold text-xl">
                      {Number(post.postPrice).toLocaleString()} đ
                    </p>
                    <p className="text-xs text-slate-500">
                      {post.postLocation || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-20 bg-surface rounded-3xl border border-dashed border-white/10 text-slate-500">
                Không tìm thấy kết quả phù hợp.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
