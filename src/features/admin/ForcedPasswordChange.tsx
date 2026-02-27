import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';
import { useTheme } from '../../state/ThemeContext';

export default function ForcedPasswordChange() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);

  // Determine the page user was trying to access
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const fromLocation = (location.state as any)?.from;
    const fromState = fromLocation?.pathname || fromLocation;
    const destination = fromParam || fromState;
    if (destination) {
      setIntendedDestination(destination);
      console.log(`Password change required. User was trying to access: ${destination}`);
    } else {
      console.log('No previously attempted destination found. Will redirect based on role.');
    }
  }, [searchParams, location]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    setPasswordStrength(strength);
    return strength;
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setNewPassword(pwd);
    checkPasswordStrength(pwd);
    setErrors(prev => ({ ...prev, newPassword: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword.trim()) newErrors.currentPassword = 'Current password is required';
    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character (!@#$%^&*)';
    }
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    try {
      const response = await api.fetchWithAuth('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setGlobalError(errorData.detail || 'Failed to change password');
        setLoading(false);
        return;
      }
      localStorage.removeItem('forcePasswordReset');
      const user = auth.getCurrentUser();
      if (user) { user.force_password_reset = false; localStorage.setItem('user', JSON.stringify(user)); }
      let redirectPath = intendedDestination || '/agent_dashboard';
      if (intendedDestination) {
        if (intendedDestination === '/system-admin' || intendedDestination.startsWith('/system-admin')) {
          if (!auth.isAdmin()) { redirectPath = '/agent_dashboard'; }
          else { redirectPath = intendedDestination; }
        } else { redirectPath = intendedDestination; }
      } else {
        const loginSource = localStorage.getItem('loginSource');
        if (loginSource === 'system-admin-login' && auth.isAdmin()) { redirectPath = '/system-admin'; }
        else { redirectPath = '/agent_dashboard'; }
      }
      console.log(`Password changed successfully. Redirecting to: ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred while changing password');
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return isDark ? '#334155' : '#d1d5db';
    if (passwordStrength === 1) return '#ef4444';
    if (passwordStrength === 2) return '#f59e0b';
    if (passwordStrength === 3) return '#3b82f6';
    return '#10b981';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  const inputCls = (hasError: boolean) => ({
    width: '100%',
    padding: '8px 16px',
    border: `1px solid ${hasError ? '#ef4444' : isDark ? '#1e2d45' : '#d1d5db'}`,
    borderRadius: '8px',
    background: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#111827',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  } as React.CSSProperties);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0d1117 0%, #0f1923 50%, #0d1117 100%)'
          : 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
      }}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-xl p-8"
        style={{
          background: isDark ? '#1a2234' : '#ffffff',
          border: isDark ? '1px solid #1e2d45' : 'none',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: isDark ? 'rgba(99,102,241,0.15)' : '#e0e7ff' }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: isDark ? '#818cf8' : '#4f46e5' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.97 5.95m-6.02 0A6 6 0 015 9m10 0h.01M5 9a6 6 0 1110.325 4.997m0 0h.01" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: isDark ? '#f1f5f9' : '#111827' }}
          >
            Change Your Password
          </h1>
          <p style={{ color: isDark ? '#64748b' : '#4b5563' }}>
            You must change your password before accessing Vega.
          </p>
        </div>

        {/* Global Error */}
        {globalError && (
          <div
            className="mb-6 p-4 rounded-md"
            style={{
              background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
              border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
            }}
          >
            <p style={{ color: isDark ? '#fca5a5' : '#b91c1c', fontSize: '14px' }}>{globalError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: isDark ? '#94a3b8' : '#374151' }}
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setErrors(prev => ({ ...prev, currentPassword: '' })); }}
              placeholder="Enter your current password"
              style={inputCls(!!errors.currentPassword)}
              onFocus={e => { e.currentTarget.style.borderColor = isDark ? '#6366f1' : '#6366f1'; e.currentTarget.style.boxShadow = isDark ? '0 0 0 2px rgba(99,102,241,0.2)' : '0 0 0 2px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.currentPassword ? '#ef4444' : isDark ? '#1e2d45' : '#d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: isDark ? '#94a3b8' : '#374151' }}
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              placeholder="Enter new password"
              style={inputCls(!!errors.newPassword)}
              onFocus={e => { e.currentTarget.style.borderColor = isDark ? '#6366f1' : '#6366f1'; e.currentTarget.style.boxShadow = isDark ? '0 0 0 2px rgba(99,102,241,0.2)' : '0 0 0 2px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.newPassword ? '#ef4444' : isDark ? '#1e2d45' : '#d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
            />

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: isDark ? '#64748b' : '#4b5563' }}>Password Strength</span>
                  <span className="text-xs font-medium" style={{ color: isDark ? '#64748b' : '#4b5563' }}>{getStrengthText()}</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: isDark ? '#1e2d45' : '#e5e7eb' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(passwordStrength / 4) * 100}%`, background: getStrengthColor() }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.newPassword}</p>
            )}

            {/* Password Requirements */}
            <div
              className="mt-3 p-3 rounded-md"
              style={{ background: isDark ? '#111827' : '#f9fafb' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: isDark ? '#94a3b8' : '#374151' }}>Requirements:</p>
              <ul className="text-xs space-y-1">
                {[
                  [newPassword.length >= 8, 'At least 8 characters'],
                  [/[A-Z]/.test(newPassword), 'One uppercase letter'],
                  [/[0-9]/.test(newPassword), 'One number'],
                  [/[!@#$%^&*]/.test(newPassword), 'One special character (!@#$%^&*)'],
                ].map(([met, label], i) => (
                  <li key={i} className="flex items-center" style={{ color: met ? '#10b981' : isDark ? '#64748b' : '#6b7280' }}>
                    <span className="mr-2">{met ? '✓' : '○'}</span>
                    {label as string}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: isDark ? '#94a3b8' : '#374151' }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
              placeholder="Confirm your new password"
              style={inputCls(!!errors.confirmPassword)}
              onFocus={e => { e.currentTarget.style.borderColor = isDark ? '#6366f1' : '#6366f1'; e.currentTarget.style.boxShadow = isDark ? '0 0 0 2px rgba(99,102,241,0.2)' : '0 0 0 2px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.confirmPassword ? '#ef4444' : isDark ? '#1e2d45' : '#d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
            />

            {/* Password Match Status */}
            {confirmPassword && (
              <div className="mt-2">
                {newPassword === confirmPassword ? (
                  <div className="flex items-center" style={{ color: '#10b981' }}>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Passwords match</span>
                  </div>
                ) : (
                  <div className="flex items-center" style={{ color: '#ef4444' }}>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Passwords do not match</span>
                  </div>
                )}
              </div>
            )}

            {errors.confirmPassword && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-medium py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
            style={{
              background: loading ? (isDark ? '#334155' : '#9ca3af') : (isDark ? '#4f46e5' : '#4f46e5'),
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}