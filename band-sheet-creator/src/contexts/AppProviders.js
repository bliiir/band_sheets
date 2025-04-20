import React from 'react';
import { EditingProvider } from './EditingContext';

/**
 * AppProviders component that wraps the application with all context providers
 * This component can be expanded as we add more context providers
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap with providers
 */
const AppProviders = ({ children }) => {
  return (
    <EditingProvider>
      {children}
    </EditingProvider>
  );
};

export default AppProviders;
