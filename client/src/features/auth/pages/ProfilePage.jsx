import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../../shared/hooks/useToast.js';
import { Input } from '../../shared/components/Input.jsx';
import { Button } from '../../shared/components/Button.jsx';
import { formatDate } from '../../shared/utils/formatters.js';
import { User, AlertCircle, Check } from 'lucide-react';
import '../styles/auth.css';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverError, setServerError] = useState('');

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'U';

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setServerError('First and last name are required');
      return;
    }

    setIsUpdating(true);
    setServerError('');

    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      setServerError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar-row">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h1 className="profile-details-name">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="profile-details-email">{user?.email}</p>
          </div>
        </div>

        {serverError && (
          <div className="auth-error-banner" role="alert" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-row-2">
            <Input
              label="First name"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
            />
            <Input
              label="Last name"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <label className="input-label" style={{ marginBottom: '6px', display: 'block' }}>
              Email address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="input-field"
              style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Account created: {formatDate(user?.createdAt)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button type="submit" variant="solid" isLoading={isUpdating}>
              <Check size={16} />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
