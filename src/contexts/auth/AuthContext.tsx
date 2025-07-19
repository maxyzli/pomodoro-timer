/**
 * Production-grade authentication context
 * Following Amazon SDE III standards with proper error handling and monitoring
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { monitor } from '../../core/monitoring';
import { AuthenticationError, AppError } from '../../core/errors';
import { retry } from '../../core/utils/retry';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AppError | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

enum AuthActionType {
  SET_USER = 'SET_USER',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  SIGN_OUT = 'SIGN_OUT',
}

type AuthAction =
  | { type: AuthActionType.SET_USER; payload: User | null }
  | { type: AuthActionType.SET_LOADING; payload: boolean }
  | { type: AuthActionType.SET_ERROR; payload: AppError }
  | { type: AuthActionType.CLEAR_ERROR }
  | { type: AuthActionType.SIGN_OUT };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case AuthActionType.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case AuthActionType.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case AuthActionType.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case AuthActionType.CLEAR_ERROR:
      return { ...state, error: null };
    case AuthActionType.SIGN_OUT:
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: AuthActionType.SET_USER, payload: user });
    monitor.setUserId(user?.id || null);
  }, []);

  const setError = useCallback((error: AppError) => {
    dispatch({ type: AuthActionType.SET_ERROR, payload: error });
    monitor.captureException(error, { module: 'AuthContext' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await retry(
          () => supabase.auth.getSession(),
          { maxAttempts: 3, initialDelayMs: 500 }
        );

        if (error) throw error;

        setUser(session?.user || null);
        
        monitor.info('Auth initialized', {
          module: 'AuthContext',
          hasSession: !!session,
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            monitor.info('Auth state changed', {
              module: 'AuthContext',
              event,
              hasUser: !!session?.user,
            });

            setUser(session?.user || null);

            if (event === 'SIGNED_IN' && session?.user) {
              try {
                await ensureUserRecord(session.user);
              } catch (error) {
                monitor.error('Failed to ensure user record', error, {
                  module: 'AuthContext',
                  userId: session.user.id,
                });
              }
            }
          }
        );

        subscription = authListener.subscription;
      } catch (error) {
        const appError = new AuthenticationError(
          'Failed to initialize authentication',
          { module: 'AuthContext', action: 'initialize' }
        );
        setError(appError);
      }
    };

    initializeAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser, setError]);

  const signIn = useCallback(async (email: string, password: string) => {
    dispatch({ type: AuthActionType.SET_LOADING, payload: true });
    clearError();

    try {
      const { error } = await retry(
        () => supabase.auth.signInWithPassword({ email, password }),
        { maxAttempts: 2 }
      );

      if (error) throw error;

      monitor.info('User signed in', {
        module: 'AuthContext',
        action: 'signIn',
      });
    } catch (error) {
      const appError = new AuthenticationError(
        error instanceof Error ? error.message : 'Sign in failed',
        { module: 'AuthContext', action: 'signIn' }
      );
      setError(appError);
      throw appError;
    } finally {
      dispatch({ type: AuthActionType.SET_LOADING, payload: false });
    }
  }, [clearError, setError]);

  const signUp = useCallback(async (email: string, password: string) => {
    dispatch({ type: AuthActionType.SET_LOADING, payload: true });
    clearError();

    try {
      const { error } = await retry(
        () => supabase.auth.signUp({ email, password }),
        { maxAttempts: 2 }
      );

      if (error) throw error;

      monitor.info('User signed up', {
        module: 'AuthContext',
        action: 'signUp',
      });
    } catch (error) {
      const appError = new AuthenticationError(
        error instanceof Error ? error.message : 'Sign up failed',
        { module: 'AuthContext', action: 'signUp' }
      );
      setError(appError);
      throw appError;
    } finally {
      dispatch({ type: AuthActionType.SET_LOADING, payload: false });
    }
  }, [clearError, setError]);

  const signOut = useCallback(async () => {
    dispatch({ type: AuthActionType.SET_LOADING, payload: true });

    try {
      await retry(
        () => supabase.auth.signOut(),
        { 
          maxAttempts: 3,
          timeoutMs: 5000,
          onRetry: (attempt) => {
            monitor.warn(`Sign out retry attempt ${attempt}`, {
              module: 'AuthContext',
              action: 'signOut',
            });
          }
        }
      );

      dispatch({ type: AuthActionType.SIGN_OUT });
      monitor.info('User signed out', {
        module: 'AuthContext',
        action: 'signOut',
      });
    } catch (error) {
      monitor.error('Sign out failed, forcing local clear', error, {
        module: 'AuthContext',
        action: 'signOut',
      });
      
      localStorage.clear();
      dispatch({ type: AuthActionType.SIGN_OUT });
      window.location.reload();
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

async function ensureUserRecord(user: User): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    throw error;
  }
}