import React, { useState, useEffect } from 'react';
import {
  Users, Search, MapPin, CheckCircle, Clock,
  MessageSquare, Phone, Info, Star, ChevronRight,
  UserPlus, ChevronLeft
} from 'lucide-react';
import {
  getPublicCollaborators,
  inviteCollaborator,
  type CollaboratorProfile,
  type CollaboratorFullProfile,
  getPublicCollaboratorDetail
} from '../services/api';
import { toast } from 'react-hot-toast';

const CollaboratorDirectory: React.FC = () => {
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCollab, setSelectedCollab] = useState<CollaboratorProfile | null>(null);
  const [fullCollab, setFullCollab] = useState<CollaboratorFullProfile | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCollaborators();
  }, [page, searchQuery]);

  useEffect(() => {
    if (selectedCollab) {
      fetchDetail(selectedCollab.userId);
    } else {
      setFullCollab(null);
    }
  }, [selectedCollab]);

  const fetchDetail = async (id: number) => {
    try {
      setFetchingDetail(true);
      const res = await getPublicCollaboratorDetail(id);
      setFullCollab(res.data);
    } catch (error) {
      toast.error('Không thể tải chi tiết hồ sơ');
    } finally {
      setFetchingDetail(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const res = await getPublicCollaborators({ page, limit: 12 });
      setCollaborators(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      toast.error('Không thể tải danh sách cộng tác viên');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (user: CollaboratorProfile) => {
    try {
      setInvitingId(user.userId);
      await inviteCollaborator(user.email || user.mobile || user.userId.toString());
      toast.success(`Đã gửi lời mời tới ${user.displayName}`);
      // Refresh to update relationship status
      fetchCollaborators();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gửi lời mời thất bại');
    } finally {
      setInvitingId(null);
    }
  };

  const getStatusBadge = (status: CollaboratorProfile['relationshipStatus']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Đã hợp tác
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Đã mời
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header with Professional Gradient */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 pt-12 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Danh sách Cộng tác viên
          </h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg opacity-90">
            Tìm kiếm những người chụp ảnh có tâm, yêu cây cảnh để giúp quảng bá những cây Bonsai của bạn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center border border-slate-100 backdrop-blur-sm bg-white/95">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm cộng tác viên theo tên, kỹ năng hoặc địa điểm..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 w-full md:w-auto justify-center shadow-lg shadow-slate-200">
            Tìm kiếm
          </button>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collaborators.map((user) => (
              <div
                key={user.userId}
                className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-200/20 transition-all duration-500 transform hover:-translate-y-1 overflow-hidden relative"
              >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex items-start gap-5 relative mb-6">
                  <div className="relative">
                    <img
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=10b981&color=fff&size=128`}
                      alt={user.displayName}
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" title="Đang trực tuyến" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-emerald-600 transition-colors">
                        {user.displayName}
                      </h3>
                    </div>
                    {getStatusBadge(user.relationshipStatus)}
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-2 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-lg">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {user.location || "Việt Nam"}
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-sm line-clamp-3 mb-6 min-h-[4.5rem] leading-relaxed font-medium">
                  {user.bio || "Người cộng tác viên này chưa cập nhật giới thiệu cá nhân."}
                </p>

                {/* Tags/Categories (Mock for aesthetic) */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-wider">Nhiếp ảnh</span>
                  <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-wider">Viết lách</span>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col gap-3">
                  {user.relationshipStatus === 'active' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`https://zalo.me/${user.mobile}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3.5 bg-sky-50 text-sky-600 rounded-2xl font-bold text-sm hover:bg-sky-100 transition-colors border border-sky-100"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Zalo
                      </a>
                      <a
                        href={`tel:${user.mobile}`}
                        className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-colors border border-emerald-100"
                      >
                        <Phone className="w-4 h-4" />
                        Gọi điện
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInvite(user)}
                      disabled={invitingId === user.userId || user.relationshipStatus === 'pending'}
                      className={`
                        flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg
                        ${user.relationshipStatus === 'pending'
                          ? 'bg-slate-100 text-slate-400 shadow-none cursor-default'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 group-active:scale-[0.98]'
                        }
                      `}
                    >
                      {invitingId === user.userId ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                      ) : user.relationshipStatus === 'pending' ? (
                        <>
                          <Clock className="w-5 h-5" />
                          Đang chờ CTV
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Mời hợp tác
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedCollab(user)}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    <Info className="w-4 h-4" />
                    Xem chi tiết
                  </button>

                  {user.relationshipStatus !== 'active' && (
                    <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 font-medium bg-slate-50/50 py-1.5 rounded-xl">
                      <Info className="w-3 h-3" />
                      CTV cần chấp nhận để mở khóa thông tin liên hệ
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && collaborators.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Chưa tìm thấy cộng tác viên</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Hãy thử tìm kiếm với từ khóa khác hoặc quay lại sau nhé.
            </p>
          </div>
        )}

        {/* Pagination (Simplified) */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-12 h-12 rounded-xl font-bold transition-all ${page === i + 1
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Collaborator Detail Modal */}
      {selectedCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedCollab(null)} />
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl animate-in zoom-in duration-300">
            <button
              onClick={() => setSelectedCollab(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Info className="w-6 h-6 rotate-45" />
            </button>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <img
                src={selectedCollab.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCollab.displayName)}&background=10b981&color=fff&size=200`}
                alt={selectedCollab.displayName}
                className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-slate-50"
              />
              <div className="flex-1 pt-2">
                <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedCollab.displayName}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(selectedCollab.relationshipStatus)}
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedCollab.location || "Việt Nam"}
                  </span>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-2xl font-black text-emerald-600">{fetchingDetail ? '...' : (fullCollab?.stats.totalGardens || 0)}</p>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mt-1">Nhà vườn</p>
                  </div>
                  <div className="flex-1 p-4 bg-sky-50 rounded-2xl border border-sky-100 text-center">
                    <p className="text-2xl font-black text-sky-600">{fetchingDetail ? '...' : (fullCollab?.stats.totalPosts || 0)}</p>
                    <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest mt-1">Bài viết</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${selectedCollab.availabilityStatus === 'available' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <p className="text-sm font-bold text-slate-700">
                    {selectedCollab.availabilityNote || (selectedCollab.availabilityStatus === 'available' ? "Đang sẵn sàng nhận việc" : "Hiện bận")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 mb-10">
              <section>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-500" />
                  Giới thiệu bản thân
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {selectedCollab.bio || "Người cộng tác viên này chưa cập nhật giới thiệu cá nhân."}
                </p>
              </section>

              {/* Portfolio Section */}
              <section>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-500" />
                    Bộ sưu tập (Portfolio)
                  </span>
                  {!fetchingDetail && fullCollab?.portfolioPhotos.length === 0 && (
                    <span className="text-[10px] text-slate-400 normal-case font-medium">Chưa có tác phẩm mẫu</span>
                  )}
                </h3>

                {fetchingDetail ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-slate-50 rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {fullCollab?.portfolioPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-2xl overflow-hidden cursor-zoom-in border border-slate-100"
                        onClick={() => setPreviewImage(url)}
                      >
                        <img
                          src={url}
                          alt={`Portfolio ${idx}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Search className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-500" />
                  Kỹ năng chuyên môn
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-100 shadow-sm">Nhiếp ảnh sản phẩm</span>
                  <span className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-100 shadow-sm">Review nhà vườn</span>
                  <span className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-100 shadow-sm">Viết content story</span>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-4">
              {selectedCollab.relationshipStatus === 'active' ? (
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={`https://zalo.me/${selectedCollab.mobile}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 py-4 bg-sky-600 text-white rounded-[1.5rem] font-bold shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Liên hệ Zalo
                  </a>
                  <a
                    href={`tel:${selectedCollab.mobile}`}
                    className="flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Gọi điện ngay
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleInvite(selectedCollab);
                  }}
                  disabled={invitingId === selectedCollab.userId || selectedCollab.relationshipStatus === 'pending'}
                  className={`
                    w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-bold text-lg transition-all shadow-xl
                    ${selectedCollab.relationshipStatus === 'pending'
                      ? 'bg-slate-100 text-slate-400 shadow-none cursor-default'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.98]'
                    }
                  `}
                >
                  {invitingId === selectedCollab.userId ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                  ) : selectedCollab.relationshipStatus === 'pending' ? (
                    <>
                      <Clock className="w-6 h-6" />
                      Đã gửi lời mời hợp tác
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-6 h-6" />
                      Mời hợp tác ngay
                    </>
                  )}
                </button>
              )}

              {selectedCollab.relationshipStatus !== 'active' && (
                <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-2 font-medium bg-slate-50 py-3 rounded-2xl">
                  <Info className="w-4 h-4" />
                  Sau khi CTV chấp nhận, bạn mới có thể xem số điện thoại và email
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Full Size Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-300">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors"
          >
            <Info className="w-8 h-8 rotate-45" />
          </button>
          <img
            src={previewImage}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default CollaboratorDirectory;
