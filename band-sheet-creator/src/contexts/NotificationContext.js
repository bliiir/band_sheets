import React, { createContext, useContext, useState, useCallback } from 'react';
import logger from '../services/LoggingService';

// Create context
const NotificationContext = createContext();

// Generate a unique ID for each notification
const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Provider component for the notification system
 */
export function NotificationProvider({ children }) {
  // Array of notification objects
  const [notifications, setNotifications] = useState([]);

  // Add a notification with optional timeout (default 3000ms)
  const showNotification = useCallback((message, type = 'success', timeout = 3000) => {
    logger.debug('NotificationService', `Showing ${type} notification: ${message}`);
    
    const id = generateId();
    
    // Add new notification to the array
    setNotifications(prev => [
      ...prev,
      { id, message, type, timestamp: Date.now() }
    ]);
    
    // Remove notification after timeout
    if (timeout > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, timeout);
    }
    
    return id;
  }, []);
  
  // Remove a specific notification by id
  const dismissNotification = useCallback((id) => {
    logger.debug('NotificationService', `Dismissing notification: ${id}`);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    logger.debug('NotificationService', 'Clearing all notifications');
    setNotifications([]);
  }, []);

  // Context value
  const value = {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook for using the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
