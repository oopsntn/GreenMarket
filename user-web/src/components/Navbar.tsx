import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, ShoppingBag, Store, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Chợ Bonsai', path: '/', icon: ShoppingBag },
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
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400",
                location.pathname === item.path ? "text-emerald-500" : "text-slate-400"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-lg shadow-emerald-900/20">
          Đăng tin
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
