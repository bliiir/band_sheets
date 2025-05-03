import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import eventBus from '../../utils/EventBus';

/**
 * Global authentication modal that listens to event bus events
 * This allows any component to trigger the auth modal without
 * needing to directly render it
 */
const GlobalAuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { hideAuthModal } = useAuth();

  useEffect(() => {
    // Listen for show-auth-modal events from the auth context
    // The 'on' method returns an unsubscribe function that we'll call on cleanup
    const unsubscribe = eventBus.on('show-auth-modal', (shouldOpen) => {
      setIsOpen(shouldOpen);
    });

    // Clean up event listener on unmount by calling the unsubscribe function
    return unsubscribe;
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    hideAuthModal();
  };

  return <AuthModal isOpen={isOpen} onClose={handleClose} />;
};

export default GlobalAuthModal;
