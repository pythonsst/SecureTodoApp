/**
 * Type definitions for the Secure Todo App
 * Centralized type definitions following TypeScript best practices
 */

/**
 * Todo item interface
 * Represents a single todo item in the application
 */
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication result interface
 * Represents the result of an authentication attempt
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Service interface for authentication
 * Following Interface Segregation Principle (SOLID)
 */
export interface IAuthenticationService {
  authenticate(): Promise<AuthResult>;
  authenticateWithPin(pin: string): Promise<AuthResult>;
  isAvailable(): Promise<boolean>;
  isPinSet(): Promise<boolean>;
  isSessionValid(): Promise<boolean>;
  getSessionRemainingMs(): Promise<number>;
  logout(): Promise<void>;
}


/**
 * Service interface for todo operations
 * Following Interface Segregation Principle (SOLID)
 */
export interface ITodoService {
  getAllTodos(): Promise<Todo[]>;
  addTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo>;
  updateTodo(id: string, updates: Partial<Todo>): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
}
