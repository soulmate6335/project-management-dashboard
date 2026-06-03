// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more slice reducers here as you build features:
    // projects: projectsReducer,
    // tasks: tasksReducer,
    // notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the serializable check (e.g. for Date objects)
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

// Inferred types — always derive from the store itself, never hard-code them.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;