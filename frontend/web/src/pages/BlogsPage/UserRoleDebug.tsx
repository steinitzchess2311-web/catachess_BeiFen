/**
 * UserRoleDebug - Debug component to display current user's role
 * Temporarily show in corner to verify permissions
 */

import React, { useState, useEffect } from 'react';
import { api } from '@ui/assets/api';

/**
 * Debug badge showing current user role
 * Remove this component after debugging
 */
const UserRoleDebug: React.FC = () => {
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    role?: string;
    id?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('catachess_token') || sessionStorage.getItem('catachess_token');

        if (!token) {
          setUserInfo(null);
          setLoading(false);
          return;
        }

        const response = await api.request("/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserInfo({
          username: response.username,
          role: response.role,
          id: response.id
        });
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) return null;
  if (!userInfo) return null;

  const isPrivileged = userInfo.role === 'editor' || userInfo.role === 'admin';

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '12px 16px',
        backgroundColor: isPrivileged ? '#4caf50' : '#ff9800',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '0.85rem',
        fontWeight: 600,
        zIndex: 9999,
        fontFamily: 'monospace'
      }}
    >
      <div style={{ marginBottom: '4px' }}>
        👤 {userInfo.username || 'Unknown'}
      </div>
      <div style={{ marginBottom: '4px' }}>
        🎭 Role: {userInfo.role || 'none'}
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
        ID: {userInfo.id?.substring(0, 8)}...
      </div>
      {!isPrivileged && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.3)',
          fontSize: '0.75rem'
        }}>
          ⚠️ Need 'editor' or 'admin' role
        </div>
      )}
    </div>
  );
};

export default UserRoleDebug;
