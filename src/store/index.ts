import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from './sidebarSlice';
import basketReducer from './basketSlice';

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    basket: basketReducer,
    // Add your slices here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
