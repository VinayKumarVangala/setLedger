import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const tokenData = localStorage.getItem('accessToken');
        if (userData && tokenData) {
          setUser(JSON.parse(userData));
          setAccessToken(tokenData);
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
      // For demo purposes, accept any email/password
      if (email && password) {
        const mockUser = {
          id: 1,
          name: 'Demo User',
          email: email,
          orgId: 'ORG1000',
          displayId: 'ORG1000-1',
          orgDisplayId: 'ORG1000',
          role: 'admin'
        };
        
        const accessToken = 'demo-token-' + Date.now();
        
        // Store in memory and localStorage
        setAccessToken(accessToken);
        setUser(mockUser);
        
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('accessToken', accessToken);
        
        return { success: true, user: mockUser };
      } else {
        return { success: false, error: { message: 'Email and password are required' } };
      }
    } catch (error) {
      return { success: false, error: { message: 'Login failed' } };
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
        
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        
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
        
        localStorage.setItem('accessToken', accessToken);
        
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

    // Clear state and localStorage
    setUser(null);
    setAccessToken(null);
    
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
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