// src/store/todos/todoThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { Todo } from '../../types';
import { todoService } from '../../services/TodoService';

// load from SecureStorage (encrypted)
export const loadTodosThunk = createAsyncThunk<Todo[]>(
  'todos/loadTodos',
  async () => {
    return todoService.getAllTodos();
  },
);

// add todo
export const addTodoThunk = createAsyncThunk<
  Todo,
  Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
  { rejectValue: string }
>('todos/addTodo', async (payload, { rejectWithValue }) => {
  try {
    const todo = await todoService.addTodo(payload);
    return todo;
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to add todo',
    );
  }
});

// update todo
export const updateTodoThunk = createAsyncThunk<
  Todo,
  { id: string; updates: Partial<Todo> },
  { rejectValue: string }
>('todos/updateTodo', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const updated = await todoService.updateTodo(id, updates);
    return updated;
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to update todo',
    );
  }
});

// delete todo
export const deleteTodoThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('todos/deleteTodo', async (id, { rejectWithValue }) => {
  try {
    await todoService.deleteTodo(id);
    return id;
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to delete todo',
    );
  }
});
