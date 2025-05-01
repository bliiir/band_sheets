import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSheetById } from '../../services/SheetStorageService';

// Initial state for navigation
const initialState = {
  currentSheetId: null,
  loadedSheetId: null,
  navigationSource: null, // 'url', 'internal', 'history', 'setlist', etc.
  navigationInProgress: false,
  error: null,
  previousLocation: null,   // Tracks where navigation came from
  sheetHistory: [],         // Tracks sheet navigation history
  lastNavigationTimestamp: null // Timestamp of last navigation action
};

// Async thunk for loading a sheet
export const loadSheet = createAsyncThunk(
  'navigation/loadSheet',
  async ({ sheetId, source = 'internal' }, { rejectWithValue }) => {
    try {
      console.log(`[Redux] Loading sheet ${sheetId} from source: ${source}`);
      const sheet = await getSheetById(sheetId);
      
      if (!sheet) {
        throw new Error(`Sheet not found: ${sheetId}`);
      }
      
      return { 
        sheetId, 
        sheet,
        source
      };
    } catch (error) {
      console.error(`[Redux] Error loading sheet ${sheetId}:`, error);
      return rejectWithValue(error.message);
    }
  }
);

// Navigation slice
const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    // Update the navigation source
    setNavigationSource: (state, action) => {
      state.navigationSource = action.payload;
      console.log(`[Redux] Navigation source set to: ${action.payload}`);
    },
    
    // Set navigation in progress flag
    setNavigationInProgress: (state, action) => {
      state.navigationInProgress = action.payload;
      console.log(`[Redux] Navigation in progress: ${action.payload}`);
    },
    
    // Set the loaded sheet ID
    setLoadedSheetId: (state, action) => {
      state.loadedSheetId = action.payload;
      console.log(`[Redux] Loaded sheet ID set to: ${action.payload}`);
    },
    
    // Set the current sheet ID
    setCurrentSheetId: (state, action) => {
      // Only add to history if we're setting a valid sheet ID
      if (action.payload) {
        // Update the history array without duplicates
        if (state.currentSheetId && state.currentSheetId !== action.payload) {
          // Add previous ID to history if not already there
          if (!state.sheetHistory.includes(state.currentSheetId)) {
            state.sheetHistory = [...state.sheetHistory, state.currentSheetId];
          }
        }
        // Update timestamp for analytics and debugging
        state.lastNavigationTimestamp = Date.now();
      }
      
      state.currentSheetId = action.payload;
      console.log(`[Redux] Current sheet ID set to: ${action.payload}`);
    },
    
    // Update navigation state (for history tracking)
    setPreviousLocation: (state, action) => {
      state.previousLocation = action.payload;
      console.log(`[Redux] Previous location set to: ${action.payload}`);
    },
    
    // Reset navigation state
    resetNavigation: (state) => {
      console.log(`[Redux] Navigation state reset`);
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // Loading a sheet
      .addCase(loadSheet.pending, (state) => {
        state.navigationInProgress = true;
        state.error = null;
      })
      .addCase(loadSheet.fulfilled, (state, action) => {
        state.navigationInProgress = false;
        state.loadedSheetId = action.payload.sheetId;
        state.currentSheetId = action.payload.sheetId;
        state.navigationSource = action.payload.source;
        state.error = null;
      })
      .addCase(loadSheet.rejected, (state, action) => {
        state.navigationInProgress = false;
        state.error = action.payload || 'Failed to load sheet';
      });
  }
});

// Export actions
export const { 
  setNavigationSource, 
  setNavigationInProgress,
  setLoadedSheetId, 
  setCurrentSheetId, 
  setPreviousLocation,
  resetNavigation
} = navigationSlice.actions;

// Export selectors
export const selectCurrentSheetId = (state) => state.navigation.currentSheetId;
export const selectLoadedSheetId = (state) => state.navigation.loadedSheetId;
export const selectNavigationSource = (state) => state.navigation.navigationSource;
export const selectNavigationInProgress = (state) => state.navigation.navigationInProgress;
export const selectNavigationError = (state) => state.navigation.error;
export const selectPreviousLocation = (state) => state.navigation.previousLocation;

// Export reducer
export default navigationSlice.reducer;
