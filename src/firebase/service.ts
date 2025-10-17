import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  DocumentReference,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { collections } from './schema';

/**
 * Generic Firebase service for CRUD operations
 */
export class FirebaseService {
  /**
   * Create a new document in a collection
   * @param collectionPath - The path to the collection
   * @param data - The data to add to the document
   * @returns The ID of the created document
   */
  static async create(collectionPath: string, data: any): Promise<string> {
    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const collectionRef = collection(db, collectionPath);
    const docRef = await addDoc(collectionRef, dataWithTimestamps);
    return docRef.id;
  }

  /**
   * Create a document with a specific ID
   * @param collectionPath - The path to the collection
   * @param id - The ID of the document
   * @param data - The data to add to the document
   */
  static async createWithId(collectionPath: string, id: string, data: any): Promise<void> {
    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = doc(db, collectionPath, id);
    await setDoc(docRef, dataWithTimestamps);
  }

  /**
   * Get a document by ID
   * @param collectionPath - The path to the collection
   * @param id - The ID of the document
   * @returns The document data or null if not found
   */
  static async getById(collectionPath: string, id: string): Promise<any> {
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  }

  /**
   * Get all documents in a collection
   * @param collectionPath - The path to the collection
   * @returns Array of documents
   */
  static async getAll(collectionPath: string): Promise<any[]> {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Query documents in a collection
   * @param collectionPath - The path to the collection
   * @param conditions - Array of query conditions [field, operator, value]
   * @param orderByField - Field to order by (optional)
   * @param orderDirection - Direction to order ('asc' or 'desc', default: 'asc')
   * @param limitCount - Number of documents to limit to (optional)
   * @returns Array of documents matching the query
   */
  static async query(
    collectionPath: string, 
    conditions: [string, any, any][], 
    orderByField?: string, 
    orderDirection: 'asc' | 'desc' = 'asc', 
    limitCount?: number
  ): Promise<any[]> {
    const collectionRef = collection(db, collectionPath);
    
    // Build query
    let queryRef = query(
      collectionRef, 
      ...conditions.map(condition => where(condition[0], condition[1], condition[2]))
    );
    
    // Add orderBy if specified
    if (orderByField) {
      queryRef = query(queryRef, orderBy(orderByField, orderDirection));
    }
    
    // Add limit if specified
    if (limitCount) {
      queryRef = query(queryRef, limit(limitCount));
    }
    
    const snapshot = await getDocs(queryRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Update a document
   * @param collectionPath - The path to the collection
   * @param id - The ID of the document
   * @param data - The data to update
   */
  static async update(collectionPath: string, id: string, data: any): Promise<void> {
    // Add updated timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    const docRef = doc(db, collectionPath, id);
    await updateDoc(docRef, dataWithTimestamp);
  }

  /**
   * Delete a document
   * @param collectionPath - The path to the collection
   * @param id - The ID of the document
   */
  static async delete(collectionPath: string, id: string): Promise<void> {
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
  }

  /**
   * Upload a file to Firebase Storage
   * @param storagePath - The path in storage
   * @param file - The file to upload
   * @returns The download URL of the uploaded file
   */
  static async uploadFile(storagePath: string, file: File): Promise<string> {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  /**
   * Delete a file from Firebase Storage
   * @param storagePath - The path in storage
   */
  static async deleteFile(storagePath: string): Promise<void> {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  }

  /**
   * Convert Firebase Timestamp to JavaScript Date
   * @param timestamp - The Firebase Timestamp
   * @returns JavaScript Date object
   */
  static timestampToDate(timestamp: Timestamp): Date {
    return timestamp ? timestamp.toDate() : null;
  }

  /**
   * Format a document path with parameters
   * @param path - The path template with {param} placeholders
   * @param params - The parameters to replace in the path
   * @returns The formatted path
   */
  static formatPath(path: string, params: Record<string, string>): string {
    let formattedPath = path;
    Object.keys(params).forEach(key => {
      formattedPath = formattedPath.replace(`{${key}}`, params[key]);
    });
    return formattedPath;
  }
}
