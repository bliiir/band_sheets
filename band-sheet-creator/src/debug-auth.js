/**
 * Authentication Debugging Tool
 * Run this in the console to diagnose authentication state across all detection methods
 */

import { getAuthToken, isAuthenticated } from './utils/AuthUtils';
import { getCurrentUser } from './services/ApiService';

// This function can be called from the browser console
window.debugAuthentication = async () => {
  console.group('🔍 Authentication Debugging');
  
  // 1. Check direct localStorage token
  const localStorageToken = localStorage.getItem('token');
  console.log('1. Direct localStorage token exists:', !!localStorageToken);
  if (localStorageToken) {
    console.log(`   - Token length: ${localStorageToken.length}`);
    console.log(`   - First 10 chars: ${localStorageToken.substring(0, 10)}...`);
  }
  
  // 2. Check via AuthUtils.getAuthToken()
  const authToken = getAuthToken();
  console.log('2. AuthUtils.getAuthToken() result:', !!authToken);
  if (authToken) {
    console.log(`   - Token length: ${authToken.length}`);
    console.log(`   - First 10 chars: ${authToken.substring(0, 10)}...`);
  }
  
  // 3. Check via isAuthenticated()
  const authStatus = isAuthenticated();
  console.log('3. AuthUtils.isAuthenticated() result:', authStatus);
  
  // 4. Check cookies
  const allCookies = document.cookie;
  console.log('4. All cookies:', allCookies);
  const clientTokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('clientToken='));
  console.log('   - clientToken cookie exists:', !!clientTokenCookie);
  
  // 5. Try to validate token via API
  try {
    console.log('5. Attempting API validation with getCurrentUser()...');
    const user = await getCurrentUser();
    console.log('   - API validation result:', !!user);
    if (user) {
      console.log('   - User data:', user);
    }
  } catch (error) {
    console.error('   - API validation error:', error);
  }
  
  console.groupEnd();
  return 'Authentication debugging complete - check console output';
};

// This will make the function available in the browser console
console.log('🔑 Authentication debugging tool loaded - type debugAuthentication() in console to run');

export default window.debugAuthentication;
