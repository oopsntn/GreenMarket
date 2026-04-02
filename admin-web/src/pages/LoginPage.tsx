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
        setError("This account is not allowed to access admin web.");
        return;
      }

      setAdminSession(response.token, response.admin, rememberMe);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      clearAdminSession();
      setError(err instanceof Error ? err.message : "Login failed.");
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
            <h1>GreenMarket Admin</h1>
            <p>Sign in to manage the marketplace system</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your admin email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="login-form__group">
            <label htmlFor="password">Password</label>

            <div className="login-form__password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="login-form__toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
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
              <span>Remember me</span>
            </label>

            <button type="button" className="login-form__forgot">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="login-form__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-card__footer">
          <span>GreenMarket Administration Portal</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
