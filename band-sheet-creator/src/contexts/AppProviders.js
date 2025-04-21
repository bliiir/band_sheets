import React from 'react';
import { AuthProvider } from './AuthContext';
import { EditingProvider } from './EditingContext';
import { SheetDataProvider } from './SheetDataContext';
import { UIStateProvider } from './UIStateContext';

/**
 * AppProviders component that wraps the application with all context providers
 * This centralizes all state management for the application
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap with providers
 */
const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <UIStateProvider>
        <SheetDataProvider>
          <EditingProvider>
            {children}
          </EditingProvider>
        </SheetDataProvider>
      </UIStateProvider>
    </AuthProvider>
  );
};

export default AppProviders;
