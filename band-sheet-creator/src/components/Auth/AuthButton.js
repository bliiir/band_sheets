import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

/**
 * Standalone authentication button component
 * Displays login/logout functionality and username when logged in
 */
const AuthButton = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser, logout, isAuthenticated } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Large, visible auth button */}
      <button
        className={`px-4 py-2 rounded-md shadow-lg text-white font-medium ${
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
