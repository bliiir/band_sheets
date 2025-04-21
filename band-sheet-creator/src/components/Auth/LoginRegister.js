import React, { useState } from 'react';

/**
 * Self-contained Login and Registration component
 * Provides UI for user authentication without relying on contexts
 */
const LoginRegister = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Local storage keys
  const USER_KEY = 'band_sheets_user';
  const USERS_KEY = 'band_sheets_users';
  const TOKEN_KEY = 'token';

  // Check for existing user on mount
  useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Error loading user from localStorage:', err);
    }
  }, []);

  // Register a new user directly
  const registerUser = async (userData) => {
    console.log('Registering user:', userData);
    
    try {
      // Get existing users or create empty array
      let users = [];
      try {
        const savedUsers = localStorage.getItem(USERS_KEY);
        if (savedUsers) {
          users = JSON.parse(savedUsers);
        }
      } catch (err) {
        // If error, just use empty array
      }

      // Check if user exists
      if (users.some(u => u.email === userData.email || u.username === userData.username)) {
        throw new Error('User already exists');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        password: userData.password, // In production, this would be hashed
        createdAt: new Date().toISOString()
      };

      // Add to users array
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Create user session without password
      const userSession = { ...newUser };
      delete userSession.password;

      // Save current user and mock token
      localStorage.setItem(USER_KEY, JSON.stringify(userSession));
      localStorage.setItem(TOKEN_KEY, `mock_token_${newUser.id}`);

      return userSession;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Login user directly
  const loginUser = async (credentials) => {
    console.log('Logging in user:', credentials.email);
    
    try {
      // Get existing users
      let users = [];
      try {
        const savedUsers = localStorage.getItem(USERS_KEY);
        if (savedUsers) {
          users = JSON.parse(savedUsers);
        }
      } catch (err) {
        throw new Error('No users found');
      }

      // Find user
      const user = users.find(u => u.email === credentials.email);
      if (!user || user.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }

      // Create user session without password
      const userSession = { ...user };
      delete userSession.password;

      // Save current user and mock token
      localStorage.setItem(USER_KEY, JSON.stringify(userSession));
      localStorage.setItem(TOKEN_KEY, `mock_token_${user.id}`);

      return userSession;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      let userData;
      
      if (isLogin) {
        userData = await loginUser({ email, password });
        console.log('Login successful:', userData);
      } else {
        userData = await registerUser({ username, email, password });
        console.log('Registration successful:', userData);
      }
      
      setUser(userData);
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? 'Sign In' : 'Create Account'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

export default LoginRegister;
