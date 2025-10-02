import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authslice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});