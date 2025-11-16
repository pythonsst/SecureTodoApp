/**
 * Todo List Screen
 * Polished, cross-platform UI (iOS + Android)
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useTodos } from '../contexts/TodoContext';
import { useAuth } from '../contexts/AuthContext';
import { Todo } from '../types';
import { TodoItem } from '../components/TodoItem';
import { TodoForm } from '../components/TodoForm';
import { Button } from '../components/Button';

const COLORS = {
  bg: '#F4F6FB',
  white: '#FFFFFF',
  primary: '#6366F1',
  primarySoft: '#EEF2FF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#B91C1C',
};

export const TodoListScreen: React.FC = () => {
  const { todos, isLoading, error, addTodo, updateTodo, deleteTodo, refreshTodos } =
    useTodos();
  const { logout } = useAuth();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleAddTodo = async (
    todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await addTodo(todo);
    setIsFormVisible(false);
  };

  const handleUpdateTodo = async (
    todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!editingTodo) return;
    await updateTodo(editingTodo.id, todo);
    setEditingTodo(null);
    setIsFormVisible(false);
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed });
    } catch {
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodo(id);
          } catch {
            Alert.alert('Error', 'Failed to delete todo');
          }
        },
      },
    ]);
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>📝</Text>
      </View>
      <Text style={styles.emptyText}>No tasks yet</Text>
      <Text style={styles.emptySubtext}>
        Tap “Add Todo” below to create your first task.
      </Text>
    </View>
  );

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onToggle={handleToggleTodo}
      onDelete={handleDeleteTodo}
      onEdit={handleEditTodo}
    />
  );

  const tasksCount =
    todos.length === 0 ? 'No tasks yet' : `${todos.length} task${todos.length > 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Todos</Text>
            <Text style={styles.todoCount}>{tasksCount}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* List */}
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
              onRefresh={refreshTodos}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Button title="+ Add Todo" onPress={handleOpenForm} />
        </View>

        {/* Modal form */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  todoCount: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: COLORS.errorBg,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  errorText: {
    color: COLORS.errorText,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
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
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
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
