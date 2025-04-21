import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

/**
 * Authentication button component
 * Displays login/logout functionality and username when logged in
 * Designed to be used in the header
 */
const AuthButton = ({ className = '' }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser, logout, isAuthenticated } = useAuth();
  
  return (
    <div className={className}>
      <button
        className={`px-3 py-1.5 rounded text-white text-sm font-medium ${
          isAuthenticated ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={() => isAuthenticated ? logout() : setAuthModalOpen(true)}
      >
        {isAuthenticated 
          ? `Logout (${currentUser?.username || 'User'})` 
          : 'Login / Register'}
      </button>
      
      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default AuthButton;
