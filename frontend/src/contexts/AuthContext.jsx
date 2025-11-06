import React, { createContext, useContext, useState, useEffect } from 'react';
import offlineDataService from '../services/db';
import syncService from '../services/sync';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from IndexedDB
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authData = await offlineDataService.db.syncStatus
          .where('table').equals('auth').first();
        
        if (authData?.data) {
          setUser(authData.data.user);
          setAccessToken(authData.data.accessToken);
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Auto-refresh token before expiry (every 14 minutes for 15-minute tokens)
  useEffect(() => {
    if (accessToken) {
      const refreshInterval = setInterval(async () => {
        await refreshToken();
      }, 14 * 60 * 1000); // 14 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [accessToken]);

  const login = async (email, password, twoFactorToken = null) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password, twoFactorToken }),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken, user } = data.data;
        
        // Store in memory and IndexedDB
        setAccessToken(accessToken);
        setUser(user);
        
        await offlineDataService.db.syncStatus.put({
          table: 'auth',
          data: { accessToken, user },
          lastSync: new Date(),
          status: 'active'
        });
        
        return { success: true, user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: { message: 'Network error' } };
    }
  };

  const register = async (name, email, password, orgName) => {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, orgName }),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken, user } = data.data;
        
        setAccessToken(accessToken);
        setUser(user);
        
        await offlineDataService.db.syncStatus.put({
          table: 'auth',
          data: { accessToken, user },
          lastSync: new Date(),
          status: 'active'
        });
        
        return { success: true, user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: { message: 'Network error' } };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken } = data.data;
        setAccessToken(accessToken);
        
        // Update stored auth data
        const authData = await offlineDataService.db.syncStatus
          .where('table').equals('auth').first();
        
        if (authData) {
          await offlineDataService.db.syncStatus.update(authData.id, {
            data: { ...authData.data, accessToken },
            lastSync: new Date()
          });
        }
        
        return true;
      } else {
        // Refresh failed, logout user
        logout();
        return false;
      }
    } catch (error) {
      logout();
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      // Continue with logout even if API call fails
    }

    // Clear state and IndexedDB
    setUser(null);
    setAccessToken(null);
    
    try {
      await offlineDataService.db.syncStatus
        .where('table').equals('auth').delete();
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  };

  const setup2FA = async () => {
    try {
      const response = await fetch('/api/v1/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: { message: 'Network error' } };
    }
  };

  const verify2FA = async (token) => {
    try {
      const response = await fetch('/api/v1/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: { message: 'Network error' } };
    }
  };

  // API helper with automatic token refresh
  const apiCall = async (url, options = {}) => {
    const makeRequest = async (token) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        credentials: 'include',
      });
    };

    try {
      let response = await makeRequest(accessToken);
      
      // If token expired, try to refresh
      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          response = await makeRequest(accessToken);
        } else {
          throw new Error('Authentication failed');
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    setup2FA,
    verify2FA,
    refreshToken,
    apiCall,
    isAuthenticated: !!user && !!accessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};