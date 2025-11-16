// src/store/todos/todoSelectors.ts
import { RootState } from '../index';

export const selectTodos = (state: RootState) => state.todos.items;

export const selectTodoLoading = (state: RootState): boolean =>
  state.todos.isLoading;

export const selectTodoError = (state: RootState): string | null =>
  state.todos.error;

export const selectTodoCount = (state: RootState): number =>
  state.todos.items.length;

export const selectCompletedCount = (state: RootState): number =>
  state.todos.items.filter((t) => t.completed).length;
