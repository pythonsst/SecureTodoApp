/**
 * TodoService Comprehensive Tests
 *
 * Tests cover:
 * - CRUD operations
 * - Encrypted storage integration
 * - Error handling
 * - Data persistence
 */

import { TodoService } from '../TodoService';
import { SecureStorage } from '../../utils/SecureStorage';
import { Todo } from '../../types';

// Explicit mock for SecureStorage
jest.mock('../../utils/SecureStorage', () => ({
  SecureStorage: {
    KEYS: {
      TODOS: 'TODOS', // value doesn't matter for tests
    },
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('TodoService', () => {
  let todoService: TodoService;
  let mockSecureStorage: jest.Mocked<typeof SecureStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;
  });

  describe('Initialization', () => {
    it('should initialize with empty state when no stored data', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);

      todoService = new TodoService();
      const todos = await todoService.getAllTodos();

      expect(todos).toEqual([]);
    });

    it('should load todos from storage on initialization', async () => {
      const storedData = {
        todos: [
          {
            id: '1',
            title: 'Test Todo',
            completed: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        nextId: 2,
      };

      // IMPORTANT: stringify, because real SecureStorage returns string
      mockSecureStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      todoService = new TodoService();
      const todos = await todoService.getAllTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Test Todo');
    });

    it('should handle initialization errors gracefully', async () => {
      mockSecureStorage.getItem.mockRejectedValue(new Error('Storage error'));

      todoService = new TodoService();
      const todos = await todoService.getAllTodos();

      // Should return empty array on error
      expect(todos).toEqual([]);
    });
  });

  describe('addTodo', () => {
    it('should add todo and save to storage', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      mockSecureStorage.setItem.mockResolvedValue();

      todoService = new TodoService();

      const newTodo = await todoService.addTodo({
        title: 'New Todo',
        description: 'Description',
        completed: false,
      });

      expect(newTodo.title).toBe('New Todo');
      expect(newTodo.id).toBeDefined();
      expect(newTodo.createdAt).toBeInstanceOf(Date);
      expect(mockSecureStorage.setItem).toHaveBeenCalled();
    });

    it('should handle storage save errors', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      mockSecureStorage.setItem.mockRejectedValue(new Error('Save failed'));

      todoService = new TodoService();

      await expect(
        todoService.addTodo({
          title: 'New Todo',
          completed: false,
        }),
      ).rejects.toThrow('Save failed');
    });
  });

  describe('updateTodo', () => {
    it('should update todo and save to storage', async () => {
      const existingTodo: Todo = {
        id: 'test-id',
        title: 'Original',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSecureStorage.getItem.mockResolvedValue(
        JSON.stringify({
          todos: [
            {
              ...existingTodo,
              createdAt: existingTodo.createdAt.toISOString(),
              updatedAt: existingTodo.updatedAt.toISOString(),
            },
          ],
          nextId: 1,
        }),
      );
      mockSecureStorage.setItem.mockResolvedValue();

      todoService = new TodoService();

      const updated = await todoService.updateTodo('test-id', {
        title: 'Updated',
        completed: true,
      });

      expect(updated.title).toBe('Updated');
      expect(updated.completed).toBe(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        existingTodo.updatedAt.getTime(),
      );
      expect(mockSecureStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error when todo not found', async () => {
      mockSecureStorage.getItem.mockResolvedValue(
        JSON.stringify({ todos: [], nextId: 1 }),
      );

      todoService = new TodoService();

      await expect(
        todoService.updateTodo('non-existent', { title: 'Updated' }),
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo and save to storage', async () => {
      const todo: Todo = {
        id: 'test-id',
        title: 'To Delete',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSecureStorage.getItem.mockResolvedValue(
        JSON.stringify({
          todos: [
            {
              ...todo,
              createdAt: todo.createdAt.toISOString(),
              updatedAt: todo.updatedAt.toISOString(),
            },
          ],
          nextId: 1,
        }),
      );
      mockSecureStorage.setItem.mockResolvedValue();

      todoService = new TodoService();

      await todoService.deleteTodo('test-id');

      const todos = await todoService.getAllTodos();
      expect(todos.find((t) => t.id === 'test-id')).toBeUndefined();
      expect(mockSecureStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error when todo not found', async () => {
      mockSecureStorage.getItem.mockResolvedValue(
        JSON.stringify({ todos: [], nextId: 1 }),
      );

      todoService = new TodoService();

      await expect(todoService.deleteTodo('non-existent')).rejects.toThrow(
        'not found',
      );
    });
  });

  describe('getAllTodos', () => {
    it('should return copy of todos to prevent mutation', async () => {
      mockSecureStorage.getItem.mockResolvedValue(
        JSON.stringify({
          todos: [
            {
              id: '1',
              title: 'Test',
              completed: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          nextId: 1,
        }),
      );

      todoService = new TodoService();

      const todos1 = await todoService.getAllTodos();
      const todos2 = await todoService.getAllTodos();

      expect(todos1).not.toBe(todos2); // Different references
      expect(todos1).toEqual(todos2);  // Same content
    });
  });
});
