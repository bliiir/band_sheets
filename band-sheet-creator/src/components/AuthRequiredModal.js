import React from 'react';

/**
 * Modal that appears when unauthenticated users try to save
 * Prompts them to log in or create an account
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onLogin - Function to call when user clicks Login
 * @param {Function} props.onRegister - Function to call when user clicks Register
 */
function AuthRequiredModal({ isOpen, onClose, onLogin, onRegister }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-2">You need to log in or create an account to save your work.</p>
        <p className="mb-6 text-gray-600">All your sheets will be securely stored and accessible from any device.</p>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-end">
          <button 
            onClick={onLogin} 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Log In
          </button>
          <button 
            onClick={onRegister} 
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Create Account
          </button>
          <button 
            onClick={onClose} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthRequiredModal;
