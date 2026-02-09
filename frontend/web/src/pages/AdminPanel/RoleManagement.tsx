/**
 * RoleManagement - Admin panel for managing user roles
 * Only accessible to admin users
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { api } from '@ui/assets/api';

interface User {
  id: string;
  identifier: string;
  username: string | null;
  role: string;
  is_active: boolean;
}

/**
 * Admin panel for managing user roles
 */
const RoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const roles = ['student', 'teacher', 'editor', 'admin'];
  const roleColors = {
    admin: '#d32f2f',
    editor: '#1976d2',
    teacher: '#388e3c',
    student: '#757575'
  };
  const roleIcons = {
    admin: '👑',
    editor: '✏️',
    teacher: '👨‍🏫',
    student: '🎓'
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('catachess_token') || sessionStorage.getItem('catachess_token');

      const queryParams = filter ? `?role_filter=${filter}` : '';
      const response = await api.request(`/admin/roles/users${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      if (err.status === 403) {
        setError('You need admin role to access this page');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  // Update user role
  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('catachess_token') || sessionStorage.getItem('catachess_token');

      await api.request('/admin/roles/update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          new_role: newRole
        })
      });

      // Refresh user list
      await fetchUsers();

      // Close dialog
      setSelectedUser(null);
      setNewRole('');
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  // Quick promote to admin
  const quickPromoteToAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to promote ${email} to admin?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('catachess_token') || sessionStorage.getItem('catachess_token');

      await api.request('/admin/roles/promote-to-admin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to promote user');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        User Role Management
      </h1>
      <p style={{ color: '#5a5a5a', marginBottom: '32px' }}>
        Manage user roles and permissions
      </p>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === '' ? '#8b7355' : '#f0f0f0',
            color: filter === '' ? 'white' : '#2c2c2c',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          All Users
        </button>
        {roles.map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === role ? '#8b7355' : '#f0f0f0',
              color: filter === role ? 'white' : '#2c2c2c',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {roleIcons[role as keyof typeof roleIcons]} {role}
          </button>
        ))}
      </div>

      {/* User Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a5a5a' }}>
          Loading users...
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Username</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>{user.identifier}</td>
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>{user.username || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: roleColors[user.role as keyof typeof roleColors],
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {roleIcons[user.role as keyof typeof roleIcons]} {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      color: user.is_active ? '#388e3c' : '#d32f2f',
                      fontWeight: 600
                    }}>
                      {user.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}
                      >
                        Change Role
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => quickPromoteToAdmin(user.identifier)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          👑 Promote to Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#5a5a5a'
            }}>
              No users found
            </div>
          )}
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog.Root open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <Dialog.Portal>
          <Dialog.Overlay style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998
          }} />
          <Dialog.Content style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
            zIndex: 9999
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <Dialog.Title style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Change User Role
              </Dialog.Title>
              <Dialog.Close asChild>
                <button style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '8px'
                }}>
                  <Cross2Icon width={20} height={20} />
                </button>
              </Dialog.Close>
            </div>

            {selectedUser && (
              <div>
                <p style={{ marginBottom: '16px', color: '#5a5a5a' }}>
                  <strong>Email:</strong> {selectedUser.identifier}<br />
                  <strong>Username:</strong> {selectedUser.username || '-'}<br />
                  <strong>Current Role:</strong> {selectedUser.role}
                </p>

                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  New Role:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {roleIcons[role as keyof typeof roleIcons]} {role}
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Dialog.Close asChild>
                    <button style={{
                      padding: '12px 24px',
                      backgroundColor: '#f0f0f0',
                      color: '#2c2c2c',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleUpdateRole}
                    disabled={updating || newRole === selectedUser.role}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#8b7355',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      opacity: updating || newRole === selectedUser.role ? 0.5 : 1,
                      fontWeight: 500
                    }}
                  >
                    {updating ? 'Updating...' : 'Update Role'}
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default RoleManagement;
