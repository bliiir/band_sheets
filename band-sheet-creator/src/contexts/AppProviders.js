import React from 'react';
import { AuthProvider } from './AuthContext';
import { EditingProvider } from './EditingContext';
import { SheetDataProvider } from './SheetDataContext';
import { UIStateProvider } from './UIStateContext';
import { SetlistProvider } from './SetlistContext';
import { NavigationProvider } from './NavigationContext';
import { ActionsProvider } from './ActionsContext';
import { NotificationProvider } from './NotificationContext';

/**
 * AppProviders component that wraps the application with all context providers
 * This centralizes all state management for the application
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap with providers
 */
const AppProviders = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <UIStateProvider>
          <NavigationProvider>
            <SheetDataProvider>
              <SetlistProvider>
                <EditingProvider>
                  <ActionsProvider>
                    {children}
                  </ActionsProvider>
                </EditingProvider>
              </SetlistProvider>
            </SheetDataProvider>
          </NavigationProvider>
        </UIStateProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default AppProviders;
