import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';

import { Todo } from '../types';
import { TodoItem } from '../components/TodoItem';
import { TodoForm } from '../components/TodoForm';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loadTodosThunk,
  addTodoThunk,
  updateTodoThunk,
  deleteTodoThunk,
} from '../store/todos/todoThunks';
import {
  selectTodos,
  selectTodoError,
  selectTodoLoading,
} from '../store/todos/todoSelectors';
import { logoutThunk } from '../store/auth/authThunks';
import { STRINGS } from '../constants/strings';
import { ErrorBanner } from '../components/ErrorBanner';

const COLORS = {
  bg: '#F4F6FB',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  primary: '#6366F1',
};

export const TodoListScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const todos = useAppSelector(selectTodos);
  const isLoading = useAppSelector(selectTodoLoading);
  const error = useAppSelector(selectTodoError);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    dispatch(loadTodosThunk());
  }, [dispatch]);

  const handleAddTodo = async (
    todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      await dispatch(addTodoThunk(todo)).unwrap();
      setIsFormVisible(false);
    } catch {
      Alert.alert('Error', STRINGS.todos.errorAdd);
    }
  };

  const handleUpdateTodo = async (
    todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!editingTodo) return;
    try {
      await dispatch(
        updateTodoThunk({ id: editingTodo.id, updates: todo }),
      ).unwrap();
      setEditingTodo(null);
      setIsFormVisible(false);
    } catch {
      Alert.alert('Error', STRINGS.todos.errorUpdate);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await dispatch(
        updateTodoThunk({ id, updates: { completed } }),
      ).unwrap();
    } catch {
      Alert.alert('Error', STRINGS.todos.errorUpdate);
    }
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert(
      STRINGS.todos.deleteConfirmTitle,
      STRINGS.todos.deleteConfirmMessage,
      [
        { text: STRINGS.todos.cancel, style: 'cancel' },
        {
          text: STRINGS.todos.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTodoThunk(id)).unwrap();
            } catch {
              Alert.alert('Error', STRINGS.todos.errorDelete);
            }
          },
        },
      ],
    );
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setIsFormVisible(true);
  };

  const handleOpenForm = () => {
    setEditingTodo(null);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setEditingTodo(null);
    setIsFormVisible(false);
  };

  const handleRefresh = () => {
    dispatch(loadTodosThunk());
  };

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onToggle={handleToggleTodo}
      onDelete={handleDeleteTodo}
      onEdit={handleEditTodo}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      title={STRINGS.todos.emptyTitle}
      message={STRINGS.todos.emptySubtitle}
      emoji="📝"
    />
  );

  const tasksCount =
    todos.length === 0
      ? STRINGS.todos.emptyTitle
      : `${todos.length} task${todos.length > 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PageHeader
          title={STRINGS.todos.title}
          subtitle={tasksCount}
          rightLabel={STRINGS.todos.logout}
          onRightPress={handleLogout}
        />

        {error && (
          <ErrorBanner
            message={error}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: COLORS.errorBg,
              borderColor: COLORS.errorBorder,
            }}
          />
        )}

        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            todos.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Button title={STRINGS.todos.add} onPress={handleOpenForm} />
        </View>

        <TodoForm
          visible={isFormVisible}
          todo={editingTodo}
          onSave={editingTodo ? handleUpdateTodo : handleAddTodo}
          onCancel={handleCloseForm}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    elevation: 4,
  },
});

export default TodoListScreen;
