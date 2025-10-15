import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import sidebarReducer from './sidebarSlice';
import basketReducer from './basketSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  // You can specify which reducers to persist, e.g., whitelist: ['basket']
  // For now, persisting both sidebar and basket
};

// Create persisted reducers
const persistedSidebarReducer = persistReducer(persistConfig, sidebarReducer);
const persistedBasketReducer = persistReducer(persistConfig, basketReducer);

export const store = configureStore({
  reducer: {
    sidebar: persistedSidebarReducer,
    basket: persistedBasketReducer,
    // Add your slices here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
