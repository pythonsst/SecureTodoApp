// src/store/todos/todoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo } from '../../types';
import {
  addTodoThunk,
  deleteTodoThunk,
  loadTodosThunk,
  updateTodoThunk,
} from './todoThunks';

export interface TodoState {
  items: Todo[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  items: [],
  isLoading: false,
  error: null,
};

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    clearTodoError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // load
      .addCase(loadTodosThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadTodosThunk.fulfilled, (state, action: PayloadAction<Todo[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(loadTodosThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? 'Failed to load todos. Please try again.';
      });

    // add
    builder
      .addCase(addTodoThunk.fulfilled, (state, action: PayloadAction<Todo>) => {
        state.items.push(action.payload);
      })
      .addCase(addTodoThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to add todo';
      });

    // update
    builder
      .addCase(updateTodoThunk.fulfilled, (state, action: PayloadAction<Todo>) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateTodoThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to update todo';
      });

    // delete
    builder
      .addCase(deleteTodoThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTodoThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to delete todo';
      });
  },
});

export const { clearTodoError } = todoSlice.actions;
export default todoSlice.reducer;
