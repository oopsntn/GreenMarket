import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, ShoppingBag, Store, User, LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, shop, isAuthenticated, logout } = useAuth();

  const baseNavItems = [
    { label: 'Chợ Bonsai', path: '/', icon: ShoppingBag },
    { label: 'Đăng Tin', path: '/create-post', icon: PlusCircle },
  ];

  const navItems = shop
    ? [
        ...baseNavItems,
        { label: shop.shopName, path: '/my-posts', icon: Store },
      ]
    : [
        ...baseNavItems,
        { label: 'Lên Shop', path: '/register-shop', icon: Store },
        { label: 'Của Tôi', path: '/my-posts', icon: User },
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
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400",
                location.pathname === item.path ? "text-emerald-500" : "text-slate-400",
                // Highlight shop name in emerald if active shop
                shop && item.label === shop.shopName ? "text-emerald-400" : ""
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
              <div className="hidden lg:block text-right">
                {shop?.shopStatus === 'active' ? (
                  <>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Chủ Vườn</div>
                    <div className="text-sm font-medium text-slate-300">{user?.name || user?.mobile}</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Nghệ nhân</div>
                    <div className="text-sm font-medium text-slate-300">{user?.name || user?.mobile}</div>
                  </>
                )}
              </div>
              <button 
                onClick={logout}
                className="glass p-2 rounded-xl text-slate-400 hover:text-red-400 transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
