import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { HealthIndicator } from '../../system/components/HealthIndicator.jsx';
import { Button } from './Button.jsx';
import { LogOut, User, Video } from 'lucide-react';
import '../styles/navbar.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Video size={16} />
          </div>
          <span className="navbar-brand-name">PeerLink</span>
        </Link>
        {isAuthenticated && (
          <nav className="navbar-nav">
            <Link to="/rooms" className="navbar-link">
              Rooms
            </Link>
          </nav>
        )}
      </div>

      <div className="navbar-right">
        <HealthIndicator />

        {isAuthenticated ? (
          <div className="navbar-user-actions">
            <Link to="/profile" className="navbar-user-btn" title="View Profile">
              <div className="navbar-avatar">{user?.firstName?.[0] || 'U'}</div>
              <span className="navbar-username">{user?.firstName}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              isIcon
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </Button>
          </div>
        ) : (
          <div className="navbar-auth-actions">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="solid" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
