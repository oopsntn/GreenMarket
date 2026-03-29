import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicPosts, getCategories } from '../services/api';
import { Leaf, Search, ShoppingBag, Filter, MapPin, ListFilter, DollarSign } from 'lucide-react';

const VIETNAM_PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", 
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", 
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", 
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", 
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", 
  "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình", 
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", 
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", 
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", 
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", 
  "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", 
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", 
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const Home: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: "",
    maxPrice: "",
    categoryId: "",
    location: ""
  });

  // Debounce search input to avoid spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Categories on Mount
  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  const applyFilters = () => {
    setPage(1); // Reset page on filter
    setAppliedFilters({
      minPrice,
      maxPrice,
      categoryId: selectedCategoryId,
      location
    });
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategoryId("");
    setLocation("");
    setPage(1);
    setAppliedFilters({
      minPrice: "",
      maxPrice: "",
      categoryId: "",
      location: ""
    });
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice;
        if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice;
        if (appliedFilters.categoryId) params.categoryId = appliedFilters.categoryId;
        if (appliedFilters.location) params.location = appliedFilters.location;
        params.page = page;
        params.limit = 12;

        const response = await getPublicPosts(params);
        // Backend returns `{ data, meta }` or just array directly, robust check:
        setPosts(response.data.data || response.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [debouncedSearch, appliedFilters, page]);

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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full lg:w-1/4 shrink-0">
          <div className="glass p-6 rounded-3xl sticky top-24 border border-white/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-emerald-400">
              <ListFilter className="w-5 h-5" /> Bộ Lọc Cây
            </h2>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Danh mục</label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId("")}
                  className={`text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${selectedCategoryId === "" ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
                >
                  Tất cả danh mục
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.categoryId}
                    onClick={() => setSelectedCategoryId(cat.categoryId.toString())}
                    className={`text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${selectedCategoryId === cat.categoryId.toString() ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
                  >
                    {cat.categoryTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <label className="flex items-center gap-1 text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                <DollarSign className="w-4 h-4" /> Khoảng giá
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Từ..."
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Đến..."
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="mb-8">
              <label className="flex items-center gap-1 text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                <MapPin className="w-4 h-4" /> Vị trí
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-emerald-500 outline-none appearance-none"
              >
                <option value="">Toàn quốc</option>
                {VIETNAM_PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20 font-bold transition-all text-sm shrink-0"
              >
                Xóa
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition-all text-sm active:scale-95"
              >
                Lọc Kết Quả
              </button>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">
            {debouncedSearch ? `Kết quả tìm kiếm cho "${debouncedSearch}"` : "Tin rao mới nhất"}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-surface rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts && posts.length > 0 ? posts.map((post) => (
              <Link
                key={post.postId}
                to={`/posts/detail/${post.postSlug}`}
                className="group glass rounded-4xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 border border-white/5 hover:border-emerald-500/30 block"
              >
                <div className="aspect-square bg-slate-900 overflow-hidden relative">
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0].imageUrl.startsWith('http') ? post.images[0].imageUrl : `http://localhost:5000${post.images[0].imageUrl}`}
                      alt={post.postTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-800">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold mb-1 group-hover:text-emerald-400 transition-colors line-clamp-2 uppercase tracking-tight">
                    {post.postTitle}
                  </h3>
                  <div className="flex justify-between items-end">
                    <p className="text-emerald-500 font-black text-lg">
                      {Number(post.postPrice).toLocaleString()} <span className="text-[10px] font-medium text-slate-500 ml-1">đ</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Filter className="w-3 h-3" /> {post.postLocation || "Hà Nội"}
                    </p>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full text-center py-20 bg-surface rounded-3xl border border-dashed border-white/10 text-slate-500">
                Không tìm thấy kết quả phù hợp.
              </div>
            )}
          </div>
        )}

        {/* Pagination UI */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-3 rounded-xl bg-surface border border-white/10 text-white font-bold hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Trang trước
            </button>
            <span className="text-slate-400 font-medium bg-white/5 px-4 py-3 rounded-xl">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-3 rounded-xl bg-surface border border-white/10 text-white font-bold hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Trang sau
            </button>
          </div>
        )}
        </section>
      </div>
    </div>
  );
};

export default Home;
