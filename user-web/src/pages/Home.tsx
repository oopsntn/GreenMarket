import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicPosts, getCategories } from '../services/api';
import { Leaf, Search, ShoppingBag, MapPin, ListFilter, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

const VIETNAM_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

const Home: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const minPriceInput = useCurrencyInput('');
  const maxPriceInput = useCurrencyInput('');
  const [location, setLocation] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    categoryId: '',
    location: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({
      minPrice: minPriceInput.rawValue,
      maxPrice: maxPriceInput.rawValue,
      categoryId: selectedCategoryId,
      location,
    });
  };

  const clearFilters = () => {
    minPriceInput.reset();
    maxPriceInput.reset();
    setSelectedCategoryId('');
    setLocation('');
    setPage(1);
    setAppliedFilters({
      minPrice: '',
      maxPrice: '',
      categoryId: '',
      location: '',
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
        setPosts(response.data.data || response.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [debouncedSearch, appliedFilters, page]);

  const renderPostCard = (post: any) => (
    <Link
      key={post.postId}
      to={`/posts/detail/${post.postSlug}`}
      className="group bg-white rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 border border-slate-200 hover:border-emerald-500/30 block shadow-sm"
    >
      <div className="aspect-square bg-slate-50 overflow-hidden relative border-b border-slate-100">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[0].imageUrl.startsWith('http') ? post.images[0].imageUrl : `http://localhost:5000${post.images[0].imageUrl}`}
            alt={post.postTitle}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ShoppingBag className="w-12 h-12 group-hover:scale-110 transition-transform" />
          </div>
        )}

        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/50 text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-xl translate-y-2 group-hover:translate-y-0">
          Chi tiết
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-black mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2 uppercase tracking-tight text-slate-900 leading-tight">
          {post.postTitle}
        </h3>
        <div className="flex justify-between items-center">
          <p className="text-emerald-600 font-black text-xl">
            {Number(post.postPrice).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">VND</span>
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50 py-1 rounded-md border border-slate-100">
          <MapPin className="w-3 h-3 text-slate-400" /> {post.postLocation || 'Hà Nội'}
        </div>
      </div>
    </Link>
  );

  const renderPostGrid = (items: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.length > 0 ? (
        items.map((post) => renderPostCard(post))
      ) : (
        <div className="col-span-full text-center py-24 bg-white rounded-4xl border border-dashed border-slate-200 text-slate-400 shadow-sm">
          <Search className="w-16 h-16 mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Không tìm thấy kết quả</h3>
          <p className="text-sm font-medium">Hãy thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-background">
      <header className="mb-14">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mẫu cây ưng ý (Tùng la hán, Si, Sanh...)"
              className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 outline-none transition-all shadow-xl shadow-slate-200/20 text-slate-900 font-bold placeholder:text-slate-400 text-lg"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white p-8 rounded-4xl sticky top-24 border border-slate-200 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl -mr-12 -mt-12"></div>

            <h2 className="text-lg font-black mb-8 flex items-center gap-3 uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4">
              <ListFilter className="w-5 h-5 text-emerald-600" /> Bộ lọc tin
            </h2>

            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Danh mục</label>
              <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId('')}
                  className={`text-left px-5 py-3 rounded-2xl transition-all text-sm font-bold uppercase tracking-tight ${selectedCategoryId === '' ? 'bg-emerald-700 text-white shadow-xl shadow-emerald-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'}`}
                >
                  Tất cả cây
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => setSelectedCategoryId(cat.categoryId.toString())}
                    className={`text-left px-5 py-3 rounded-2xl transition-all text-sm font-bold uppercase tracking-tight ${selectedCategoryId === cat.categoryId.toString() ? 'bg-emerald-700 text-white shadow-xl shadow-emerald-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'}`}
                  >
                    {cat.categoryTitle}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Khoảng giá
              </label>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    ref={minPriceInput.inputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="Giá thấp nhất"
                    value={minPriceInput.displayValue}
                    onChange={minPriceInput.handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-900 font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">VND</span>
                </div>
                <div className="relative">
                  <input
                    ref={maxPriceInput.inputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="Giá cao nhất"
                    value={maxPriceInput.displayValue}
                    onChange={maxPriceInput.handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-900 font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">VND</span>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">
                <MapPin className="w-4 h-4 text-emerald-600" /> Vị trí vườn
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm text-slate-900 font-bold focus:border-emerald-500 focus:bg-white outline-none appearance-none cursor-pointer transition-all shadow-sm shadow-slate-100"
              >
                <option value="">Toàn quốc</option>
                {VIETNAM_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={clearFilters}
                className="px-5 py-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest transition-all border border-slate-100 active:scale-95"
              >
                Xóa
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl shadow-xl shadow-emerald-200/50 transition-all active:scale-95"
              >
                Lọc cây
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              {debouncedSearch ? (
                <span className="text-emerald-700 underline decoration-emerald-100 underline-offset-8">Kết quả cho "{debouncedSearch}"</span>
              ) : (
                'Khám phá tin mới'
              )}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[420px] bg-white rounded-4xl border border-slate-200 flex flex-col items-center justify-center gap-4 shadow-sm animate-pulse">
                  <div className="w-16 h-16 bg-slate-100 rounded-full"></div>
                  <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            renderPostGrid(posts)
          )}

          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-16 font-black uppercase text-xs tracking-widest">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="px-8 py-3 bg-white text-emerald-700 rounded-xl shadow-sm border border-slate-100">
                  Trang {page} <span className="text-slate-300 font-medium">/</span> {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
