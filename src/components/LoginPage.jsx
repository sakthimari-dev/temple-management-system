import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from "react-router-dom";
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const adminCredentials = {
    username: 'admin',
    password: 'admin123'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter username and password!');
      return;
    }

    if (
      username === adminCredentials.username &&
      password === adminCredentials.password
    ) {
    navigate("/admin");
    } else {
      setError('Invalid Username or Password!');
      setPassword('');
    }
  };

  const handleClear = () => {
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Temple Admin Login</h1>
        <p className="login-subtitle">Temple Management System</p>

        <form onSubmit={handleLogin} className="login-form">

          <div className="form-group">
            <label>Admin Username</label>
            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button type="submit" className="btn btn-login">
              Login
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="btn btn-clear"
            >
              Clear
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}