import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Phone, MessageSquare, Trash2,
  Search, Clock, ShieldCheck, Mail,
  ChevronRight, Plus
} from 'lucide-react';
import {
  getShopCollaborators,
  inviteCollaborator,
  removeCollaborator,
  type CollaboratorProfile
} from '../services/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ShopTeamManagement: React.FC = () => {
  const [team, setTeam] = useState<CollaboratorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [inviting, setInviting] = useState(false);
  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await getShopCollaborators();
      setTeam(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách đội ngũ');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    try {
      setInviting(true);
      await inviteCollaborator(identifier);
      toast.success('Đã gửi lời mời hợp tác!');
      setIdentifier('');
      setInviteModalOpen(false);
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gửi lời mời thất bại');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngừng hợp tác với ${name}?`)) return;

    try {
      await removeCollaborator(id);
      toast.success('Đã xóa thành viên');
      setTeam(prev => prev.filter(m => m.userId !== id));
    } catch (error) {
      toast.error('Xóa thành viên thất bại');
    }
  };

  const activeMembers = team.filter(m => m.relationshipStatus === 'active');
  const pendingMembers = team.filter(m => m.relationshipStatus === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <nav className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-3">
              <Link to="/owner-dashboard" className="hover:text-emerald-600 transition-colors uppercase tracking-wider">Dashboard</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 uppercase tracking-wider">Quản lý Đội ngũ</span>
            </nav>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <Users className="w-10 h-10 text-emerald-600" />
              Đội ngũ của tôi
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/collaborator/directory"
              className="px-6 py-4 bg-white text-slate-900 rounded-[1.25rem] font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Danh sách CTV
            </Link>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-6 py-4 bg-emerald-600 text-white rounded-[1.25rem] font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Mời nhanh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-10">
            {/* Active Team Section */}

            {/* Active Team Section */}
            <section>
              <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Thành viên chính thức ({activeMembers.length})
              </h2>

              {activeMembers.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Bạn chưa có cộng tác viên chính thức nào.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeMembers.map(member => (
                    <div
                      key={member.userId}
                      className="group bg-white rounded-[2rem] p-5 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center gap-6"
                    >
                      <img
                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=10b981&color=fff&size=100`}
                        alt={member.displayName}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-900">{member.displayName}</h3>
                        <p className="text-slate-400 text-sm font-medium">Bắt đầu từ: {new Date(member.joinedAt || '').toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <a
                          href={`https://zalo.me/${member.mobile}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 md:flex-none p-4 bg-sky-50 text-sky-600 rounded-2xl hover:bg-sky-100 transition-colors"
                          title="Zalo"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </a>
                        <a
                          href={`tel:${member.mobile}`}
                          className="flex-1 md:flex-none p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
                          title="Gọi điện"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleRemove(member.userId, member.displayName)}
                          className="flex-1 md:flex-none p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-colors"
                          title="Ngừng hợp tác"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending Section */}
            {pendingMembers.length > 0 && (
              <section>
                <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Đang chờ CTV chấp nhận ({pendingMembers.length})
                </h2>
                <div className="grid gap-4 opacity-75">
                  {pendingMembers.map(member => (
                    <div
                      key={member.userId}
                      className="bg-white rounded-[2rem] p-5 border border-slate-100 flex flex-col md:flex-row items-center gap-6"
                    >
                      <img
                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=e2e8f0&color=64748b&size=100`}
                        alt={member.displayName}
                        className="w-16 h-16 rounded-2xl object-cover grayscale"
                      />
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-400">{member.displayName}</h3>
                        <p className="text-slate-400 text-sm">Đã gửi lời mời lúc {new Date(member.joinedAt || '').toLocaleDateString('vi-VN')}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(member.userId, member.displayName)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all font-bold text-sm"
                      >
                        Hủy lời mời
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Invite Modal */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-3xl font-black text-slate-900 mb-2">Mời hợp tác</h3>
              <p className="text-slate-500 font-medium mb-8">
                Nhập số điện thoại hoặc email của CTV bạn muốn mời vào đội ngũ của mình.
              </p>

              <form onSubmit={handleInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-900 uppercase tracking-widest pl-2">Thông tin định danh</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Số điện thoại hoặc Email..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Gửi lời mời
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopTeamManagement;
