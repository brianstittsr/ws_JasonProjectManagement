/**
 * Firebase Schema Deployment Script
 * 
 * This script initializes and deploys the Firebase schema for the project management app.
 * It sets up Firestore collections, security rules, and initial data.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if service account exists
const serviceAccountPath = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account.json not found.');
  console.error('Please download your Firebase service account key and save it as service-account.json in the project root.');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Load schema
const schema = require('./src/firebase/schema');

/**
 * Create admin user
 */
async function createAdminUser() {
  try {
    const email = 'admin@example.com';
    const password = 'Admin123!'; // In production, use a secure password or generate one
    
    // Check if user exists
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log('Admin user already exists:', userRecord.uid);
      return userRecord.uid;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: 'Admin User',
          emailVerified: true
        });
        
        console.log('Admin user created:', userRecord.uid);
        return userRecord.uid;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Create user document
 */
async function createUserDocument(uid) {
  try {
    // Check if document exists
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      console.log('User document already exists');
      return;
    }
    
    // Create user document
    await db.collection('users').doc(uid).set({
      email: 'admin@example.com',
      displayName: 'Admin User',
      photoURL: '',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        notifications: true,
        theme: 'system',
        emailDigest: false
      }
    });
    
    console.log('User document created');
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

/**
 * Create sample project
 */
async function createSampleProject(ownerUid) {
  try {
    // Check if sample project exists
    const projectsSnapshot = await db.collection('projects')
      .where('title', '==', 'Sample Project')
      .get();
    
    if (!projectsSnapshot.empty) {
      console.log('Sample project already exists');
      return projectsSnapshot.docs[0].id;
    }
    
    // Create project
    const projectRef = await db.collection('projects').add({
      title: 'Sample Project',
      description: 'A sample project to demonstrate the app functionality',
      status: 'active',
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      owner: ownerUid,
      team: [ownerUid],
      tags: ['sample', 'demo'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      prd: {
        productVision: 'Create a comprehensive project management app',
        targetUsers: ['Project managers', 'Developers', 'Business analysts'],
        keyFeatures: ['Task management', 'Email integration', 'Crisis response'],
        successMetrics: ['User adoption', 'Productivity improvement'],
        constraints: ['Timeline', 'Budget']
      }
    });
    
    console.log('Sample project created:', projectRef.id);
    return projectRef.id;
  } catch (error) {
    console.error('Error creating sample project:', error);
    throw error;
  }
}

/**
 * Create sample features
 */
async function createSampleFeatures(projectId) {
  try {
    // Check if features exist
    const featuresSnapshot = await db.collection(`projects/${projectId}/features`)
      .get();
    
    if (!featuresSnapshot.empty) {
      console.log('Sample features already exist');
      return;
    }
    
    // Create features
    const features = [
      {
        name: 'Task Management',
        description: 'Create and manage tasks with status tracking',
        status: 'completed',
        priority: 'high',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Email Integration',
        description: 'Convert emails to tasks automatically',
        status: 'in-progress',
        priority: 'medium',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Crisis Response',
        description: 'Handle urgent issues with structured workflows',
        status: 'planned',
        priority: 'high',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const feature of features) {
      const featureRef = await db.collection(`projects/${projectId}/features`).add({
        ...feature,
        projectId
      });
      
      console.log(`Feature "${feature.name}" created:`, featureRef.id);
    }
  } catch (error) {
    console.error('Error creating sample features:', error);
    throw error;
  }
}

/**
 * Create sample playbook templates
 */
async function createSamplePlaybookTemplates(ownerUid) {
  try {
    // Check if templates exist
    const templatesSnapshot = await db.collection('playbookTemplates')
      .get();
    
    if (!templatesSnapshot.empty) {
      console.log('Sample playbook templates already exist');
      return;
    }
    
    // Create templates
    const templates = [
      {
        title: 'Daily Standup',
        description: 'Daily team check-in to track progress and blockers',
        category: 'standup',
        steps: [
          {
            id: '1',
            title: 'What did you accomplish yesterday?',
            description: 'List completed tasks and progress',
            order: 1,
            isRequired: true
          },
          {
            id: '2',
            title: 'What will you work on today?',
            description: 'List planned tasks for today',
            order: 2,
            isRequired: true
          },
          {
            id: '3',
            title: 'Any blockers?',
            description: 'List any issues preventing progress',
            order: 3,
            isRequired: true
          }
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: ownerUid
      },
      {
        title: 'Sprint Planning',
        description: 'Plan tasks for the upcoming sprint',
        category: 'planning',
        steps: [
          {
            id: '1',
            title: 'Review backlog',
            description: 'Review and prioritize backlog items',
            order: 1,
            isRequired: true
          },
          {
            id: '2',
            title: 'Estimate effort',
            description: 'Estimate effort for each task',
            order: 2,
            isRequired: true
          },
          {
            id: '3',
            title: 'Assign tasks',
            description: 'Assign tasks to team members',
            order: 3,
            isRequired: true
          },
          {
            id: '4',
            title: 'Set sprint goals',
            description: 'Define sprint goals and success criteria',
            order: 4,
            isRequired: true
          }
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: ownerUid
      }
    ];
    
    for (const template of templates) {
      const templateRef = await db.collection('playbookTemplates').add(template);
      console.log(`Playbook template "${template.title}" created:`, templateRef.id);
    }
  } catch (error) {
    console.error('Error creating sample playbook templates:', error);
    throw error;
  }
}

/**
 * Create sample crisis templates
 */
async function createSampleCrisisTemplates() {
  try {
    // Check if templates exist
    const templatesSnapshot = await db.collection('crisisTemplates')
      .get();
    
    if (!templatesSnapshot.empty) {
      console.log('Sample crisis templates already exist');
      return;
    }
    
    // Create templates
    const templates = [
      {
        title: 'Server Outage',
        description: 'Handle server downtime and recovery',
        scenario: 'Production server is down or unresponsive',
        checklist: [
          {
            id: '1',
            title: 'Verify outage',
            description: 'Confirm the outage with monitoring tools',
            isRequired: true,
            order: 1
          },
          {
            id: '2',
            title: 'Identify root cause',
            description: 'Determine what caused the outage',
            isRequired: true,
            order: 2
          },
          {
            id: '3',
            title: 'Restore service',
            description: 'Implement fix to restore service',
            isRequired: true,
            order: 3
          },
          {
            id: '4',
            title: 'Notify stakeholders',
            description: 'Inform stakeholders of the outage and resolution',
            isRequired: true,
            order: 4
          }
        ],
        followUps: [
          {
            id: '1',
            title: 'Post-mortem analysis',
            description: 'Conduct detailed analysis of the outage',
            dueIn: 24 // hours
          },
          {
            id: '2',
            title: 'Implement preventive measures',
            description: 'Implement measures to prevent future outages',
            dueIn: 72 // hours
          }
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Security Breach',
        description: 'Handle security incidents and breaches',
        scenario: 'Unauthorized access or data breach detected',
        checklist: [
          {
            id: '1',
            title: 'Contain the breach',
            description: 'Limit the scope and impact of the breach',
            isRequired: true,
            order: 1
          },
          {
            id: '2',
            title: 'Assess damage',
            description: 'Determine what data was compromised',
            isRequired: true,
            order: 2
          },
          {
            id: '3',
            title: 'Notify affected parties',
            description: 'Inform users and stakeholders as required by law',
            isRequired: true,
            order: 3
          },
          {
            id: '4',
            title: 'Fix vulnerability',
            description: 'Address the security vulnerability',
            isRequired: true,
            order: 4
          }
        ],
        followUps: [
          {
            id: '1',
            title: 'Security audit',
            description: 'Conduct comprehensive security audit',
            dueIn: 48 // hours
          },
          {
            id: '2',
            title: 'Update security protocols',
            description: 'Update security policies and procedures',
            dueIn: 96 // hours
          }
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const template of templates) {
      const templateRef = await db.collection('crisisTemplates').add(template);
      console.log(`Crisis template "${template.title}" created:`, templateRef.id);
    }
  } catch (error) {
    console.error('Error creating sample crisis templates:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Firebase schema deployment...');
    
    // Create admin user
    const adminUid = await createAdminUser();
    
    // Create user document
    await createUserDocument(adminUid);
    
    // Create sample project
    const projectId = await createSampleProject(adminUid);
    
    // Create sample features
    await createSampleFeatures(projectId);
    
    // Create sample playbook templates
    await createSamplePlaybookTemplates(adminUid);
    
    // Create sample crisis templates
    await createSampleCrisisTemplates();
    
    console.log('Firebase schema deployment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error deploying Firebase schema:', error);
    process.exit(1);
  }
}

// Run main function
main();
