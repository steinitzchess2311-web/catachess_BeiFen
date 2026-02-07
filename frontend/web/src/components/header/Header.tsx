import React from 'react';
import { Link } from 'react-router-dom';
import "./Header.css";

interface HeaderProps {
  username: string | null;
  isAuthed: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, isAuthed }) => {
  const displayName = username?.trim() || 'Account';

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo">
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
