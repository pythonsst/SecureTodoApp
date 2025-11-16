/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of a white screen.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.gradientOverlay} />
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>😔</Text>
                <View style={styles.iconGlow} />
              </View>
              
              <Text style={styles.title}>Oops! Something Bad Happened</Text>
              <Text style={styles.subtitle}>
                We're sorry, but something unexpected went wrong
              </Text>
              
              <View style={styles.messageContainer}>
                <View style={styles.messageIconContainer}>
                  <Text style={styles.messageIcon}>💥</Text>
                </View>
                <Text style={styles.message}>
                  The app encountered an error and couldn't continue.{'\n'}
                  Don't worry, your data is safe!
                </Text>
              </View>
              
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <View style={styles.errorHeader}>
                    <Text style={styles.errorIcon}>🔍</Text>
                    <Text style={styles.errorTitle}>Error Details (Dev Mode)</Text>
                  </View>
                  <View style={styles.errorContent}>
                    <Text style={styles.errorText}>
                      {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.stackTraceContainer}>
                          <Text style={styles.stackTraceTitle}>
                            📍 Stack Trace:
                          </Text>
                          <Text style={styles.stackTrace}>
                            {this.state.errorInfo.componentStack}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={styles.button} 
                onPress={this.handleReset} 
                activeOpacity={0.85}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>🔄</Text>
                  <Text style={styles.buttonText}>Try Again</Text>
                </View>
                <View style={styles.buttonShadow} />
              </TouchableOpacity>

              <Text style={styles.footerText}>
                If this problem persists, please restart the app
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#E6EDFF',
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFE5E5',
    opacity: 0.3,
    top: -10,
  },
  icon: {
    fontSize: 100,
    marginBottom: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  messageIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#1A202C',
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 350,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D3748',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4A5568',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F7FAFC',
    letterSpacing: 0.5,
  },
  errorContent: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FC8181',
    fontFamily: 'monospace',
    marginBottom: 16,
    lineHeight: 18,
    backgroundColor: '#2D3748',
    padding: 12,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#4A5568',
    marginVertical: 12,
  },
  stackTraceContainer: {
    marginTop: 8,
  },
  stackTraceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0AEC0',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    color: '#CBD5E0',
    fontFamily: 'monospace',
    lineHeight: 16,
    backgroundColor: '#2D3748',
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#667EEA',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    minWidth: 200,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#764BA2',
    opacity: 0,
  },
  footerText: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

