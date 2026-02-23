import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';

export default function ForcedPasswordChange() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
    // Check for 'from' parameter in URL query string (e.g., ?from=/system-admin)
    const fromParam = searchParams.get('from');
    
    // Check for state passed through navigation (e.g., location.state?.from?.pathname)
    const fromLocation = (location.state as any)?.from;
    const fromState = fromLocation?.pathname || fromLocation;
    
    // Use whichever is available, prioritizing query param
    const destination = fromParam || fromState;
    
    if (destination) {
      setIntendedDestination(destination);
      console.log(`Password change required. User was trying to access: ${destination}`);
    } else {
      console.log('No previously attempted destination found. Will redirect based on role.');
    }
  }, [searchParams, location]);

  // Check password strength
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

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

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

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await api.fetchWithAuth('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setGlobalError(errorData.detail || 'Failed to change password');
        setLoading(false);
        return;
      }

      // Password changed successfully
      // Clear the force password reset flag
      localStorage.removeItem('forcePasswordReset');
      
      // Update user object to reflect password change
      const user = auth.getCurrentUser();
      if (user) {
        user.force_password_reset = false;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      // Determine redirect destination
      let redirectPath = intendedDestination || '/agent_dashboard'; // Default fallback
      
      if (intendedDestination) {
        // User was trying to access a specific page
        // Verify they have permission for that page
        if (intendedDestination === '/system-admin' || intendedDestination.startsWith('/system-admin')) {
          // Trying to access admin page
          if (!auth.isAdmin()) {
            // User doesn't have admin permission, redirect to main dashboard
            console.warn('User lacks admin permission for intended destination. Redirecting to dashboard.');
            redirectPath = '/agent_dashboard';
          } else {
            redirectPath = intendedDestination;
          }
        } else {
          // For other pages (agent_dashboard, etc.), allow redirect
          redirectPath = intendedDestination;
        }
      } else {
        // No intended destination - use role-based default
        redirectPath = auth.isAdmin() ? '/system-admin' : '/agent_dashboard';
      }
      
      console.log(`Password changed successfully. Redirecting to: ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred while changing password');
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-300';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.97 5.95m-6.02 0A6 6 0 015 9m10 0h.01M5 9a6 6 0 1110.325 4.997m0 0h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h1>
          <p className="text-gray-600">
            You must change your password before accessing Vega.
          </p>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{globalError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors(prev => ({ ...prev, currentPassword: '' }));
              }}
              placeholder="Enter your current password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.currentPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              placeholder="Enter new password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Password Strength</span>
                  <span className="text-xs font-medium text-gray-600">{getStrengthText()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}

            {/* Password Requirements */}
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{newPassword.length >= 8 ? '✓' : '○'}</span>
                  At least 8 characters
                </li>
                <li className={`flex items-center ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                  One uppercase letter
                </li>
                <li className={`flex items-center ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                  One number
                </li>
                <li className={`flex items-center ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[!@#$%^&*]/.test(newPassword) ? '✓' : '○'}</span>
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="Confirm your new password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            
            {/* Password Match Status */}
            {confirmPassword && (
              <div className="mt-2">
                {newPassword === confirmPassword ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Passwords match</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Passwords do not match</span>
                  </div>
                )}
              </div>
            )}
            
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
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
