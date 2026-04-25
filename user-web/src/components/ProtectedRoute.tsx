import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRuleForPath, RESTRICTED_ROLES_ON_WEB } from '../config/routeRules';
import toast from 'react-hot-toast';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[]; // Kept for backward compatibility if needed
}> = ({ children, allowedRoles: manualAllowedRoles }) => {
  const { isAuthenticated, user, shop, loading } = useAuth();
  const location = useLocation();
  const rules = getRuleForPath(location.pathname);

  useEffect(() => {
    if (loading) return;

    // Check rules and show toast if blocked
    if (isAuthenticated) {
      const isSpecialistRole = RESTRICTED_ROLES_ON_WEB.includes(user?.businessRoleCode || '');
      const allowedRoles = rules?.allowedRoles || manualAllowedRoles;
      const hasActiveShop = shop !== null && shop.shopStatus === 'active';

      let blockMessage = '';

      if (isSpecialistRole) {
        blockMessage = "Tài khoản nghiệp vụ hiện chỉ hỗ trợ trên ứng dụng di động. Vui lòng tải app để tiếp tục.";
      } else if (rules?.requiresShop && !hasActiveShop) {
        blockMessage = rules.deniedMessage || "Trang này yêu cầu hồ sơ Nhà vườn đang hoạt động.";
      } else if (rules?.requiresNoShop && hasActiveShop) {
        blockMessage = rules.deniedMessage || "Chủ vườn vui lòng sử dụng bảng điều khiển nhà vườn.";
      } else if (allowedRoles && !allowedRoles.includes(user?.businessRoleCode || '')) {
        blockMessage = rules?.deniedMessage || "Bạn không có quyền truy cập chức năng này.";
      }

      if (blockMessage) {
        toast.error(blockMessage, { id: `blocked-${location.pathname}` });
      }
    }
  }, [isAuthenticated, user, shop, loading, location.pathname, rules, manualAllowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mr-3"></div>
        Đang kiểm tra bảo mật...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Final check for redirection
  const isSpecialistRole = RESTRICTED_ROLES_ON_WEB.includes(user?.businessRoleCode || '');
  const allowedRoles = rules?.allowedRoles || manualAllowedRoles;
  const hasActiveShop = shop !== null && shop.shopStatus === 'active';

  const isBlocked = 
    isSpecialistRole ||
    (rules?.requiresShop && !hasActiveShop) || 
    (rules?.requiresNoShop && hasActiveShop) || 
    (allowedRoles && !allowedRoles.includes(user?.businessRoleCode || ''));

  if (isBlocked) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
