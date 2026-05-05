import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi";
import {
  clearAdminSession,
  hasAllowedAdminRole,
  hasActiveAdminSession,
  setAdminSession,
} from "../utils/adminSession";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasActiveAdminSession()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      if (!hasAllowedAdminRole(response.admin)) {
        setError("Tài khoản này không có quyền truy cập trang quản trị.");
        return;
      }

      setAdminSession(response.token, response.admin, rememberMe);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      clearAdminSession();
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__overlay" />

      <div className="login-card">
        <div className="login-card__brand">
          <div className="login-card__logo">GM</div>
          <div>
            <h1>Quản trị GreenMarket</h1>
            <p>Đăng nhập để quản lý hệ thống sàn giao dịch</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__group">
            <label htmlFor="email">Email quản trị</label>
            <input
              id="email"
              type="email"
              placeholder="Nhập email quản trị"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="login-form__group">
            <label htmlFor="password">Mật khẩu</label>

            <div className="login-form__password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="login-form__toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {error && <p className="login-form__error">{error}</p>}

          <div className="login-form__options">
            <label className="login-form__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <span className="login-form__forgot">
              Liên hệ quản trị hệ thống nếu bạn cần đặt lại mật khẩu.
            </span>
          </div>

          <button
            type="submit"
            className="login-form__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="login-card__footer">
          <span>Cổng quản trị GreenMarket</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
