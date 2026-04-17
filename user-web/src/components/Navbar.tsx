import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Leaf,
  ShoppingBag,
  Store,
  User,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Newspaper,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationCenter from "./NotificationCenter";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, shop, isAuthenticated, logout } = useAuth();

  const isGardenOwner = shop?.shopStatus === "active";
  const displayIdentity =
    isGardenOwner && shop?.shopName
      ? shop.shopName
      : user?.userDisplayName?.trim() || user?.userMobile || "Người dùng";

  const guestNavItems = [
    { label: "Trang chủ", path: "/home", icon: ShoppingBag },
    { label: "Danh sách nhà vườn", path: "/shops", icon: Store },
    { label: "Tin tức", path: "/news", icon: Newspaper },
  ];

  const baseNavItems = [
    { label: "Chợ bonsai", path: "/home", icon: ShoppingBag },
    { label: "Danh sách nhà vườn", path: "/shops", icon: Store },
    { label: "Tin tức", path: "/news", icon: Newspaper },
    { label: "Đăng tin", path: "/create-post", icon: PlusCircle },
  ];

  const navItems = !isAuthenticated
    ? guestNavItems
    : isGardenOwner
      ? [
        ...baseNavItems,
        { label: "Dashboard", path: "/owner-dashboard", icon: LayoutDashboard },
        { label: shop?.shopName || "Nhà vườn", path: "/my-posts", icon: Store },
      ]
      : [
        ...baseNavItems,
        { label: "Cá nhân", path: "/my-posts", icon: User },
      ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/home" className="flex items-center gap-2 group">
          <Leaf className="text-emerald-500 group-hover:rotate-12 transition-transform" />
          <span className="text-xl font-bold tracking-tighter">GreenMarket</span>
        </Link>

        <div className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-600",
                location.pathname === item.path ? "text-emerald-600" : "text-slate-500",
                isGardenOwner && item.label === shop?.shopName ? "text-emerald-600" : "",
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
                    <div className="text-sm font-medium text-slate-700">{displayIdentity}</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Nghệ nhân</div>
                    <div className="text-sm font-medium text-slate-700">{displayIdentity}</div>
                  </>
                )}
              </Link>
              
              <NotificationCenter />

              <button
                onClick={logout}
                className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
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
