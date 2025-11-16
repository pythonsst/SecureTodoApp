// App.tsx
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { store } from './src/store';
import { AuthenticationScreen } from './src/screens/AuthenticationScreen';
import { TodoListScreen } from './src/screens/TodoListScreen';
import { useAppSelector } from './src/store/hooks';
import { selectIsAuthenticated } from './src/store/auth/authSelectors';

function AppContent() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated ? <TodoListScreen /> : <AuthenticationScreen />;
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}
