// Export Firebase configuration and services
export * from './config';
export * from './schema';
export * from './service';
export * from './auth-service';

// Export a Firebase context provider for React
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from './schema';
import { AuthService } from './auth-service';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

// Firebase context type
interface FirebaseContextType {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
}

// Create context
const FirebaseContext = createContext<FirebaseContextType>({
  currentUser: null,
  loading: true,
  error: null
});

// Firebase provider component
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <FirebaseContext.Provider value={{ currentUser, loading, error }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Hook to use Firebase context
export const useFirebase = () => useContext(FirebaseContext);
