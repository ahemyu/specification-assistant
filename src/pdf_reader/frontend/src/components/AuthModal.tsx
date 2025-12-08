import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { FaTimes } from "react-icons/fa";

export const AuthModal: React.FC = () => {
  const showAuthModal = useAppStore((state) => state.showAuthModal);
  const authModalMode = useAppStore((state) => state.authModalMode);
  const isAuthLoading = useAppStore((state) => state.isAuthLoading);
  const authError = useAppStore((state) => state.authError);
  const setShowAuthModal = useAppStore((state) => state.setShowAuthModal);
  const setAuthModalMode = useAppStore((state) => state.setAuthModalMode);
  const login = useAppStore((state) => state.login);
  const register = useAppStore((state) => state.register);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authModalMode === "login") {
      const success = await login(email, password);
      if (success) {
        setEmail("");
        setPassword("");
      }
    } else {
      const success = await register(email, username, password);
      if (success) {
        setEmail("");
        setUsername("");
        setPassword("");
      }
    }
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setEmail("");
    setUsername("");
    setPassword("");
  };

  const switchMode = () => {
    setAuthModalMode(authModalMode === "login" ? "register" : "login");
    setEmail("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <FaTimes />
        </button>

        <h2 className="modal-title">
          {authModalMode === "login" ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              disabled={isAuthLoading}
            />
          </div>

          {authModalMode === "register" && (
            <div className="modal-form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                minLength={3}
                required
                disabled={isAuthLoading}
              />
            </div>
          )}

          <div className="modal-form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              minLength={8}
              required
              disabled={isAuthLoading}
            />
          </div>

          {authError && <div className="modal-error">{authError}</div>}

          <button type="submit" className="modal-submit-btn" disabled={isAuthLoading}>
            {isAuthLoading
              ? "Loading..."
              : authModalMode === "login"
              ? "Login"
              : "Register"}
          </button>
        </form>

        <div className="modal-footer-text">
          {authModalMode === "login" ? (
            <span>
              No account?{" "}
              <button type="button" onClick={switchMode} disabled={isAuthLoading}>
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button type="button" onClick={switchMode} disabled={isAuthLoading}>
                Login
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
