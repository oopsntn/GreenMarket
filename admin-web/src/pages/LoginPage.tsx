import "./LoginPage.css";

function LoginPage() {
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

        <form className="login-form">
          <div className="login-form__group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your admin email"
            />
          </div>

          <div className="login-form__group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
            />
          </div>

          <div className="login-form__options">
            <label className="login-form__remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <button type="button" className="login-form__forgot">
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-form__submit">
            Sign In
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
