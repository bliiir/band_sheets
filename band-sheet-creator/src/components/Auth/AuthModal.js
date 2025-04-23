import React from 'react';
import LoginRegister from './LoginRegister';

/**
 * Simple Modal dialog for authentication
 * Completely rebuilt to avoid event propagation issues
 */
const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Stop propagation for the modal content
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Modal backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {/* Modal content */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md relative"
        onClick={handleModalClick}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
          onClick={onClose}
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Login form */}
        <div className="p-6">
          <LoginRegister onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
