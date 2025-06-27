import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Component that renders all notifications from the NotificationContext
 * Displays notifications in the bottom-right corner of the screen
 */
export default function Notification() {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {notifications.map(notification => {
        // Determine background color based on notification type
        const bgColor = notification.type === 'success' 
          ? 'bg-green-500' 
          : notification.type === 'error' 
            ? 'bg-red-500' 
            : notification.type === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500'; // info type
              
        return (
          <div 
            key={notification.id}
            className={`${bgColor} text-white p-4 rounded shadow-lg flex justify-between items-center min-w-[220px]`}
            onClick={() => dismissNotification(notification.id)}
            role="alert"
          >
            <span>{notification.message}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
