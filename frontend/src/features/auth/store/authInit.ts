import { setCredentials } from './authSlice';
import type { Store } from '@reduxjs/toolkit';

export function initializeAuth(store: Store) {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');

  if (token && user) {
    try {
      store.dispatch(
        setCredentials({
          token,
          user: JSON.parse(user),
        })
      );
    } catch {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
  }
}