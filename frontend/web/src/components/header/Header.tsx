import React, { useRef } from "react";
import { Link } from 'react-router-dom';
import "./Header.css";

interface HeaderProps {
  username: string | null;
  isAuthed: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, isAuthed }) => {
  const displayName = username?.trim() || 'Account';
  const rightClickCountRef = useRef(0);
  const rightClickTimerRef = useRef<number | null>(null);

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

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo" onContextMenu={handleLogoContextMenu}>
          <img src="/assets/logo.jpg" alt="ChessorTag" className="logo-image" />
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
