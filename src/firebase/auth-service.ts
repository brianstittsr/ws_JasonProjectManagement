import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { FirebaseService } from './service';
import { User } from './schema';

/**
 * Firebase Authentication Service
 */
export class AuthService {
  /**
   * Register a new user with email and password
   * @param email - User email
   * @param password - User password
   * @param displayName - User display name
   * @returns The created user
   */
  static async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      // Create user document in Firestore
      const userData: Omit<User, 'uid'> = {
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: firebaseUser.photoURL || '',
        role: 'user', // Default role
        createdAt: new Date(),
        lastLogin: new Date(),
        settings: {
          notifications: true,
          theme: 'system',
          emailDigest: false
        }
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      return {
        uid: firebaseUser.uid,
        ...userData
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns The signed-in user
   */
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update last login time
      await FirebaseService.update('users', firebaseUser.uid, {
        lastLogin: serverTimestamp()
      });
      
      // Get user data from Firestore
      return await this.getUserData(firebaseUser);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * @returns The signed-in user
   */
  static async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;
      
      // If new user, create user document in Firestore
      if (isNewUser) {
        const userData: Omit<User, 'uid'> = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
          role: 'user', // Default role
          createdAt: new Date(),
          lastLogin: new Date(),
          settings: {
            notifications: true,
            theme: 'system',
            emailDigest: false
          }
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Update last login time
        await FirebaseService.update('users', firebaseUser.uid, {
          lastLogin: serverTimestamp()
        });
      }
      
      // Get user data from Firestore
      return await this.getUserData(firebaseUser);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email - User email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param displayName - New display name
   * @param photoURL - New photo URL
   */
  static async updateProfile(displayName: string, photoURL?: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      await updateProfile(user, { displayName, photoURL });
      
      // Update Firestore user document
      await FirebaseService.update('users', user.uid, {
        displayName,
        photoURL: photoURL || user.photoURL
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update user email
   * @param newEmail - New email address
   */
  static async updateEmail(newEmail: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      await updateEmail(user, newEmail);
      
      // Update Firestore user document
      await FirebaseService.update('users', user.uid, { email: newEmail });
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param newPassword - New password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns The current user or null if not authenticated
   */
  static async getCurrentUser(): Promise<User | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await this.getUserData(user);
  }

  /**
   * Get user data from Firestore
   * @param firebaseUser - Firebase Auth user
   * @returns User data from Firestore
   */
  private static async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'uid'>;
        return {
          uid: firebaseUser.uid,
          ...userData,
          // Convert Firestore timestamps to Date objects
          createdAt: FirebaseService.timestampToDate(userData.createdAt as any),
          lastLogin: FirebaseService.timestampToDate(userData.lastLogin as any)
        };
      } else {
        throw new Error('User document not found in Firestore');
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }
}
