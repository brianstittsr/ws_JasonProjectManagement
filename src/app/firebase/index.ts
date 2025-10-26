// Export Firebase configuration and services
export * from './config';
export * from './schema';
export * from './service';
export * from './auth-service';

// Import necessary React components and Firebase services
import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from './schema';
import { AuthService } from './auth-service';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

// Define the Firebase context type
interface FirebaseContextType {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
}

// Create the Firebase context with default values
const defaultContextValue: FirebaseContextType = {
  currentUser: null,
  loading: true,
  error: null
};

export const FirebaseContext = createContext<FirebaseContextType>(defaultContextValue);

// Define the props interface for the Firebase provider
interface FirebaseProviderProps {
  children: React.ReactNode;
}

// Create a function to handle Firebase authentication state
function useFirebaseAuth(): FirebaseContextType {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          // Get user data from Firestore
          const userData = await AuthService.getCurrentUser();
          setCurrentUser(userData);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return {
    currentUser,
    loading,
    error
  };
}

// Create the Firebase provider component using React.createElement instead of JSX
export function FirebaseProvider({ children }: FirebaseProviderProps): React.ReactElement {
  const auth = useFirebaseAuth();
  
  return React.createElement(
    FirebaseContext.Provider,
    { value: auth },
    children
  );
}

// Create a hook to use the Firebase context
export function useFirebase(): FirebaseContextType {
  return useContext(FirebaseContext);
}
