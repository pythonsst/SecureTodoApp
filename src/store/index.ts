// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import todoReducer from './todos/todoSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
