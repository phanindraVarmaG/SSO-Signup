// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LdapCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user?: any;
}

export interface UserProfile {
  userId: string;
  email: string;
  username?: string;
  provider?: string;
  displayName?: string;
  department?: string;
  title?: string;
}

// Authentication API calls
export const authAPI = {
  // Email/password login
  async loginWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  // LDAP login
  async loginWithLdap(credentials: LdapCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/ldap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'LDAP login failed');
    }

    return response.json();
  },

  // Get user profile
  async getProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  // Register new user
  async register(userData: { email: string; password: string; confirmPassword: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },
};

// Google OAuth URL
export const getGoogleOAuthUrl = () => `${API_BASE_URL}/auth/google`;

// Token management utilities
export const tokenUtils = {
  getToken: () => localStorage.getItem('access_token'),
  setToken: (token: string) => localStorage.setItem('access_token', token),
  removeToken: () => localStorage.removeItem('access_token'),
  isAuthenticated: () => !!localStorage.getItem('access_token'),
};