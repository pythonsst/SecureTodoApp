/**
 * Todo Context
 * 
 * Provides todo state and CRUD operations throughout the app.
 * Following React best practices with Context API for state management.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { ITodoService, Todo } from '../types';
import { todoService } from '../services/TodoService';

/**
 * Todo context state interface
 */
interface TodoContextType {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  refreshTodos: () => Promise<void>;
}

/**
 * Create the todo context
 */
const TodoContext = createContext<TodoContextType | undefined>(undefined);

/**
 * Props for TodoProvider component
 */
interface TodoProviderProps {
  children: ReactNode;
  todoServiceInstance?: ITodoService; // Dependency injection for testing
}

/**
 * TodoProvider component
 * Provides todo state and methods to child components
 * 
 * @param children - React children components
 * @param todoServiceInstance - Optional todo service (for dependency injection)
 */
export const TodoProvider: React.FC<TodoProviderProps> = ({
  children,
  todoServiceInstance = todoService,
}) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refreshes the todo list from the service
   */
  const refreshTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTodos = await todoServiceInstance.getAllTodos();
      setTodos(fetchedTodos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setIsLoading(false);
    }
  }, [todoServiceInstance]);

  /**
   * Load todos on mount
   */
  useEffect(() => {
    refreshTodos();
  }, [refreshTodos]);

  /**
   * Adds a new todo item
   */
  const addTodo = useCallback(
    async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
      setIsLoading(true);
      setError(null);
      try {
        const newTodo = await todoServiceInstance.addTodo(todo);
        setTodos((prevTodos) => [...prevTodos, newTodo]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add todo');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [todoServiceInstance]
  );

  /**
   * Updates an existing todo item
   */
  const updateTodo = useCallback(
    async (id: string, updates: Partial<Todo>) => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedTodo = await todoServiceInstance.updateTodo(id, updates);
        setTodos((prevTodos) =>
          prevTodos.map((todo) => (todo.id === id ? updatedTodo : todo))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update todo');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [todoServiceInstance]
  );

  /**
   * Deletes a todo item
   */
  const deleteTodo = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await todoServiceInstance.deleteTodo(id);
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete todo');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [todoServiceInstance]
  );

  const value: TodoContextType = {
    todos,
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    refreshTodos,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};

/**
 * Custom hook to use todo context
 * Throws error if used outside TodoProvider
 * 
 * @returns TodoContextType - Todo context value
 */
export const useTodos = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};


