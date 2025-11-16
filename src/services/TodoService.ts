/**
 * Todo Service
 *
 * This service handles all CRUD operations for todo items.
 * Following SOLID principles:
 * - Single Responsibility: Only handles todo data operations
 * - Dependency Inversion: Implements ITodoService interface
 *
 * Security:
 * - All todos are stored using SecureStorage (Keychain / Keystore)
 */

import { ITodoService, Todo } from '../types';
import { SecureStorage } from '../utils/SecureStorage';

/**
 * Internal representation of Todo with Date as strings for storage
 */
interface TodoStorage {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * TodoService class
 * Manages todo items with persistent storage
 */
export class TodoService implements ITodoService {
  private todos: Todo[] = [];
  private nextId: number = 1;
  private initialized: boolean = false;

  /**
   * Initializes the service by loading todos from storage
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const raw = await SecureStorage.getItem(SecureStorage.KEYS.TODOS);

      if (raw) {
        // Parse serialized JSON
        const storageData = JSON.parse(raw) as {
          todos: TodoStorage[];
          nextId: number;
        };

        // Convert storage format to runtime format
        this.todos = (storageData.todos || []).map((todo) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          updatedAt: new Date(todo.updatedAt),
        }));

        this.nextId = storageData.nextId || 1;
      } else {
        this.todos = [];
        this.nextId = 1;
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize TodoService:', error);
      // Start with empty state if loading fails
      this.todos = [];
      this.nextId = 1;
      this.initialized = true;
    }
  }

  /**
   * Saves todos to storage (JSON string)
   */
  private async saveToStorage(): Promise<void> {
    try {
      const storageData: { todos: TodoStorage[]; nextId: number } = {
        todos: this.todos.map((todo) => ({
          ...todo,
          createdAt: todo.createdAt.toISOString(),
          updatedAt: todo.updatedAt.toISOString(),
        })),
        nextId: this.nextId,
      };

      const serialized = JSON.stringify(storageData);
      await SecureStorage.setItem(SecureStorage.KEYS.TODOS, serialized);
    } catch (error) {
      throw new Error(
        `Failed to save todos: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Generates a unique ID for new todos
   */
  private generateId(): string {
    return `todo-${Date.now()}-${this.nextId++}`;
  }

  /**
   * Retrieves all todos
   */
  async getAllTodos(): Promise<Todo[]> {
    await this.initialize();
    // Return a shallow copy so callers cannot mutate internal state
    return this.todos.map((todo) => ({ ...todo }));
  }

  /**
   * Adds a new todo item
   */
  async addTodo(
    todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Todo> {
    await this.initialize();

    const now = new Date();
    const newTodo: Todo = {
      ...todo,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(newTodo);
    await this.saveToStorage();

    return { ...newTodo };
  }

  /**
   * Updates an existing todo item
   */
  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    await this.initialize();

    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }

    const existing = this.todos[index];

    const updatedTodo: Todo = {
      ...existing,
      ...updates,
      id, // ensure id can't be modified
      updatedAt: new Date(),
    };

    // Do not allow createdAt to be overwritten with a non-Date value
    if (updates.createdAt && !(updates.createdAt instanceof Date)) {
      updatedTodo.createdAt = existing.createdAt;
    }

    this.todos[index] = updatedTodo;
    await this.saveToStorage();

    return { ...updatedTodo };
  }

  /**
   * Deletes a todo item
   */
  async deleteTodo(id: string): Promise<void> {
    await this.initialize();

    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }

    this.todos.splice(index, 1);
    await this.saveToStorage();
  }
}

// Export a singleton instance for convenience
export const todoService = new TodoService();
