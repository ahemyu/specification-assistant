import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { FaUser, FaLock, FaEnvelope, FaUserPlus, FaSignInAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isAuthenticated,
    isAuthLoading,
    authError,
    login,
    register,
    setAuthError,
  } = useAppStore();

  const navigate = useNavigate();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);
    
    if (isLoginMode) {
      const success = await login(email, password);
      if (!success) {
        setError(authError || "Login failed");
      }
    } else {
      const success = await register(email, username, password);
      if (success) {
        // Switch to login mode after successful registration
        setIsLoginMode(true);
      } else {
        setError(authError || "Registration failed");
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setAuthError(null);
    setEmail("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-logo">
            <img src="/assets/trench-logo.png" alt="Trench Hub Logo" className="logo-image" />
          </div>
          <h1 className="login-title">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="login-subtitle">
            {isLoginMode ? "Sign in to access your PDF analysis tools" : "Get started with Specification Assistant"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaEnvelope className="form-icon" />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={isAuthLoading}
              className="form-input"
            />
          </div>

          {!isLoginMode && (
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <FaUser className="form-icon" />
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                minLength={3}
                required
                disabled={isAuthLoading}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FaLock className="form-icon" />
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
              disabled={isAuthLoading}
              className="form-input"
            />
          </div>

          {(error || authError) && (
            <div className="error-message">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isAuthLoading}
          >
            {isAuthLoading ? (
              <span className="loading-spinner"></span>
            ) : isLoginMode ? (
              <>
                <FaSignInAlt className="button-icon" />
                Sign In
              </>
            ) : (
              <>
                <FaUserPlus className="button-icon" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={toggleMode}
            className="toggle-mode-button"
            disabled={isAuthLoading}
          >
            {isLoginMode ? (
              <>
                New to Specification Assistant? <strong>Create an account</strong>
              </>
            ) : (
              <>
                Already have an account? <strong>Sign in</strong>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;