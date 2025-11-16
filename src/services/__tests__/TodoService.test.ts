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

// Mock SecureStorage
jest.mock('../../utils/SecureStorage');

describe('TodoService', () => {
  let todoService: TodoService;
  let mockSecureStorage: jest.Mocked<typeof SecureStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    todoService = new TodoService();

    mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;
    mockSecureStorage.getItem = jest.fn();
    mockSecureStorage.setItem = jest.fn();
  });

  describe('Initialization', () => {
    it('should initialize with empty state when no stored data', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);

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

      mockSecureStorage.getItem.mockResolvedValue(storedData);

      const todos = await todoService.getAllTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Test Todo');
    });

    it('should handle initialization errors gracefully', async () => {
      mockSecureStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const todos = await todoService.getAllTodos();

      // Should return empty array on error
      expect(todos).toEqual([]);
    });
  });

  describe('addTodo', () => {
    it('should add todo and save to storage', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      mockSecureStorage.setItem.mockResolvedValue();

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

      await expect(
        todoService.addTodo({
          title: 'New Todo',
          completed: false,
        })
      ).rejects.toThrow();
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

      mockSecureStorage.getItem.mockResolvedValue({
        todos: [
          {
            ...existingTodo,
            createdAt: existingTodo.createdAt.toISOString(),
            updatedAt: existingTodo.updatedAt.toISOString(),
          },
        ],
        nextId: 1,
      });
      mockSecureStorage.setItem.mockResolvedValue();

      const updated = await todoService.updateTodo('test-id', {
        title: 'Updated',
        completed: true,
      });

      expect(updated.title).toBe('Updated');
      expect(updated.completed).toBe(true);
      // Updated timestamp should be greater or equal (if same millisecond)
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        existingTodo.updatedAt.getTime()
      );
    });

    it('should throw error when todo not found', async () => {
      mockSecureStorage.getItem.mockResolvedValue({ todos: [], nextId: 1 });

      await expect(
        todoService.updateTodo('non-existent', { title: 'Updated' })
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

      mockSecureStorage.getItem.mockResolvedValue({
        todos: [
          {
            ...todo,
            createdAt: todo.createdAt.toISOString(),
            updatedAt: todo.updatedAt.toISOString(),
          },
        ],
        nextId: 1,
      });
      mockSecureStorage.setItem.mockResolvedValue();

      await todoService.deleteTodo('test-id');

      const todos = await todoService.getAllTodos();
      expect(todos.find((t) => t.id === 'test-id')).toBeUndefined();
    });

    it('should throw error when todo not found', async () => {
      mockSecureStorage.getItem.mockResolvedValue({ todos: [], nextId: 1 });

      await expect(todoService.deleteTodo('non-existent')).rejects.toThrow(
        'not found'
      );
    });
  });

  describe('getAllTodos', () => {
    it('should return copy of todos to prevent mutation', async () => {
      mockSecureStorage.getItem.mockResolvedValue({
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
      });

      const todos1 = await todoService.getAllTodos();
      const todos2 = await todoService.getAllTodos();

      expect(todos1).not.toBe(todos2); // Different references
      expect(todos1).toEqual(todos2); // Same content
    });
  });
});

