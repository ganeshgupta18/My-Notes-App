import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('nnotes_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user session:', err);
        localStorage.removeItem('nnotes_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data);
        localStorage.setItem('nnotes_user', JSON.stringify(res.data));
      }
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name, email, password, profileImage) => {
    try {
      const res = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        profileImage,
      });
      if (res.data.success) {
        setUser(res.data);
        localStorage.setItem('nnotes_user', JSON.stringify(res.data));
      }
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nnotes_user');
  };

  const updateProfile = async (formData) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const res = await axios.put('/api/profile', formData, config);
      if (res.data.success) {
        // Keep the existing token, merge other profile fields
        const updatedUser = {
          ...user,
          name: res.data.name,
          email: res.data.email,
          profileImage: res.data.profileImage,
        };
        setUser(updatedUser);
        localStorage.setItem('nnotes_user', JSON.stringify(updatedUser));
      }
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const deleteAccount = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const res = await axios.delete('/api/profile', config);
      if (res.data.success) {
        logout();
      }
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const getHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        getHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
