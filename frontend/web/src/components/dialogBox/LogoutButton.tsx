import React, { useState, useRef, useEffect } from 'react';
import { api } from '@ui/assets/api';
import './LogoutButton.css';

const TOKEN_KEY = 'catachess_token';
const USER_ID_KEY = 'catachess_user_id';

interface LogoutButtonProps {
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  const [showDialog, setShowDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLogoutClick = () => {
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const handleConfirm = async () => {
    try {
      // Call logout API
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_ID_KEY);

      // Call optional callback
      if (onLogout) {
        onLogout();
      }

      // Redirect to login
      window.location.assign('/login');
    }
  };

  // Handle click outside dialog
  useEffect(() => {
    if (!showDialog) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDialog(false);
      }
    };

    // Add event listener with a small delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDialog]);

  return (
    <div className="logout-button-wrapper">
      <button
        ref={buttonRef}
        className="logout-button"
        onClick={handleLogoutClick}
      >
        Log out
      </button>
      {showDialog && (
        <div ref={dialogRef} className="logout-dialog">
          <p className="logout-dialog-text">Are you sure you want to log out?</p>
          <div className="logout-dialog-buttons">
            <button className="logout-dialog-btn logout-btn-no" onClick={handleCancel}>
              No
            </button>
            <button className="logout-dialog-btn logout-btn-yes" onClick={handleConfirm}>
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoutButton;
