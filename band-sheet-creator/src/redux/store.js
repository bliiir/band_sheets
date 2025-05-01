import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './slices/navigationSlice';

const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    // Additional slices will go here as we expand Redux usage
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these paths
        ignoredActions: ['navigation/setNavigationState'],
        ignoredPaths: ['navigation.navigateOptions'],
      },
    }),
});

export default store;
