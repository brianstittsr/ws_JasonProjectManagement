// Firebase Firestore schema definition

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  members: string[]; // User IDs
  tags: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  assignedTo: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'manager' | 'user';
  createdAt: Date;
  lastLogin: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  n8nWorkflowId: string;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  triggers: string[];
}

// Collection paths
export const COLLECTIONS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  USERS: 'users',
  COMMENTS: 'comments',
  WORKFLOWS: 'workflows',
};

// Example of Firestore rules (to be implemented in Firebase console)
export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles are readable by authenticated users, but only writeable by the user themselves or admins
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Projects are readable by members, writeable by owners and admins
    match /projects/{projectId} {
      allow read: if request.auth != null && (
        request.auth.uid in resource.data.members || 
        request.auth.uid == resource.data.ownerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (
        request.auth.uid == resource.data.ownerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Tasks are readable by project members, writeable by assignees, project owners and admins
    match /tasks/{taskId} {
      allow read: if request.auth != null && (
        request.auth.uid in get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.members ||
        request.auth.uid == get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.ownerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && (
        request.auth.uid in get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.members ||
        request.auth.uid == get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.ownerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow update, delete: if request.auth != null && (
        request.auth.uid in resource.data.assignedTo ||
        request.auth.uid == get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.ownerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Comments are readable by project members, writeable by the comment author and admins
    match /comments/{commentId} {
      allow read: if request.auth != null && (
        request.auth.uid in get(/databases/$(database)/documents/projects/$(get(/databases/$(database)/documents/tasks/$(resource.data.taskId)).data.projectId)).data.members ||
        request.auth.uid == get(/databases/$(database)/documents/projects/$(get(/databases/$(database)/documents/tasks/$(resource.data.taskId)).data.projectId)).data.ownerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Workflows are readable by all authenticated users, but only writeable by admins
    match /workflows/{workflowId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
`;

// Function to initialize Firebase collections with basic data
export const initializeFirebaseCollections = async (firestore: any) => {
  // Implementation would go here
  console.log('Initializing Firebase collections...');
};
