import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { organizationService } from '../services/api';
import envConfig from '../config/env';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    // Decode token to show invitation details
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setInvitationData(payload);
    } catch (error) {
      toast.error('Invalid invitation link');
      navigate('/login');
    }
  }, [token, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await organizationService.acceptInvitation({
        token,
        password: data.password
      });
      
      // Store tokens
      localStorage.setItem(envConfig.auth.jwtStorageKey, response.data.tokens.accessToken);
      localStorage.setItem(envConfig.auth.refreshTokenKey, response.data.tokens.refreshToken);
      
      toast.success('Welcome to the team! Your account has been activated.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🏦 setLedger</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Accept Invitation</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your registration to join the team
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Invitation Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Organization:</strong> {invitationData.orgID}</p>
              <p><strong>Your Name:</strong> {invitationData.name}</p>
              <p><strong>Email:</strong> {invitationData.email}</p>
              <p><strong>Role:</strong> 
                <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {invitationData.role?.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Create Password *
              </label>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Password must contain uppercase, lowercase, number and special character'
                  }
                })}
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must contain uppercase, lowercase, number and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <input
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (value, { password }) => 
                    value === password || 'Passwords do not match'
                })}
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  {...register('acceptTerms', { required: 'You must accept the terms' })}
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-gray-700">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting Invitation...
                  </div>
                ) : (
                  'Accept Invitation & Join Team'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This invitation will expire in 7 days. If you have any questions,
              contact your organization administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAccept;