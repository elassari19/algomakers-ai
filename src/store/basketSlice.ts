import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pair } from '@/generated/prisma';

interface BasketItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  pair: Pair;
  plan: {
    id: string;
    period: string;
    months: number;
    price: number;
    discount?: number;
  };
}

interface BasketState {
  items: BasketItem[];
}

const initialState: BasketState = {
  items: [],
};

const basketSlice = createSlice({
  name: 'basket',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<BasketItem>) => {
      const newItem = action.payload;
      const newPairId = newItem.id.split('-')[0]; // Extract pair ID from item ID (format: pairId-planId)

      // Find existing item with the same pair ID
      const existingIndex = state.items.findIndex(item => {
        const existingPairId = item.id.split('-')[0];
        return existingPairId === newPairId;
      });

      if (existingIndex !== -1) {
        // Replace the existing item with the new one
        state.items[existingIndex] = newItem;
      } else {
        // Add new item if pair not already in basket
        state.items.push(newItem);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearBasket: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearBasket } = basketSlice.actions;
export default basketSlice.reducer;