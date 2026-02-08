import React, { useRef } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import "./Header.css";
import logoImage from "../../assets/logo.jpg";

interface HeaderProps {
  username: string | null;
  isAuthed: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, isAuthed }) => {
  const displayName = username?.trim() || 'Account';
  const rightClickCountRef = useRef(0);
  const rightClickTimerRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoContextMenu = () => {
    rightClickCountRef.current += 1;
    if (rightClickTimerRef.current) {
      window.clearTimeout(rightClickTimerRef.current);
    }
    rightClickTimerRef.current = window.setTimeout(() => {
      rightClickCountRef.current = 0;
      rightClickTimerRef.current = null;
    }, 1200);

    if (rightClickCountRef.current >= 5) {
      rightClickCountRef.current = 0;
      if (rightClickTimerRef.current) {
        window.clearTimeout(rightClickTimerRef.current);
        rightClickTimerRef.current = null;
      }
      window.open("https://catamaze.catachess.com", "_blank", "noopener,noreferrer");
    }
  };

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // If not authenticated, navigate to landing page (default Link behavior)
    if (!isAuthed) {
      return;
    }

    // Authenticated user logic
    if (location.pathname !== '/workspace-select') {
      return;
    }
    event.preventDefault();
    navigate('/workspace-select', { state: { resetWorkspace: Date.now() } });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <Link
          to={isAuthed ? "/workspace-select" : "/"}
          className="logo"
          onClick={handleLogoClick}
          onContextMenu={handleLogoContextMenu}
        >
          <img src={logoImage} alt="ChessorTag" className="logo-image" />
        </Link>
      </div>
      <nav className="header-center" />
      <div className="header-right">
        <Link to="/players" className="nav-link">Players</Link>
        <Link to="/about" className="nav-link">About</Link>
        {isAuthed ? (
          <Link to="/account" className="username">{displayName}</Link>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
