import { useState, useCallback } from 'react';

/**
 * Custom hook that returns a function to force a component to re-render
 * @returns {Function} Function that when called will force the component to re-render
 */
const useForceUpdate = () => {
  const [, setCounter] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setCounter(prev => prev + 1);
  }, []);
  
  return forceUpdate;
};

export default useForceUpdate;
