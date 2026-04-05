import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, ShoppingBag, Store, User, LogOut, PlusCircle, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, shop, isAuthenticated, logout } = useAuth();

  const displayIdentity = user?.userDisplayName?.trim() || user?.userMobile || 'Người dùng';
  const isGardenOwner = shop?.shopStatus === 'active';

  const guestNavItems = [
    { label: 'Trang chủ', path: '/', icon: ShoppingBag },
    { label: 'Danh sách nhà vườn', path: '/shops', icon: Store },
  ];

  const baseNavItems = [
    { label: 'Chợ bonsai', path: '/', icon: ShoppingBag },
    { label: 'Danh sách nhà vườn', path: '/shops', icon: Store },
    { label: 'Đăng tin', path: '/create-post', icon: PlusCircle },
    { label: 'Bài đã lưu', path: '/saved-posts', icon: Heart },
  ];

  const navItems = !isAuthenticated
    ? guestNavItems
    : isGardenOwner
      ? [
        ...baseNavItems,
        { label: shop?.shopName || 'Nhà vườn', path: '/my-posts', icon: Store },
      ]
      : [
        ...baseNavItems,
        { label: 'Lên shop', path: '/register-shop', icon: Store },
        { label: 'Cá nhân', path: '/my-posts', icon: User },
      ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <Leaf className="text-emerald-500 group-hover:rotate-12 transition-transform" />
          <span className="text-xl font-bold tracking-tighter">GreenMarket</span>
        </Link>

        <div className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400',
                location.pathname === item.path ? 'text-emerald-500' : 'text-slate-400',
                isGardenOwner && item.label === shop?.shopName ? 'text-emerald-400' : ''
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="hidden lg:block text-right hover:opacity-80 transition-opacity">
                {isGardenOwner ? (
                  <>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Chủ vườn</div>
                    <div className="text-sm font-medium text-slate-300">{displayIdentity}</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Nghệ nhân</div>
                    <div className="text-sm font-medium text-slate-300">{displayIdentity}</div>
                  </>
                )}
              </Link>
              <button
                onClick={logout}
                className="glass p-2 rounded-xl text-slate-400 hover:text-red-400 transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
