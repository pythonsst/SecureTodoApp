import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthProvider from './src/contexts/AuthContext';
import { TodoProvider } from './src/contexts/TodoContext';
import { useAuth } from './src/contexts/AuthContext';
import { AuthenticationScreen } from './src/screens/AuthenticationScreen';
import { TodoListScreen } from './src/screens/TodoListScreen';

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <TodoListScreen /> : <AuthenticationScreen />;
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <TodoProvider>
          <AppContent />
        </TodoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
