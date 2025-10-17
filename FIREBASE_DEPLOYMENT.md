# Firebase Schema Deployment Guide

This guide explains how to deploy the Firebase schema for the project management app.

## Prerequisites

1. Firebase account and project
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Node.js and npm installed

## Setup

1. **Login to Firebase**

   ```bash
   firebase login
   ```

2. **Initialize Firebase in your project (if not already done)**

   ```bash
   firebase init
   ```

   Select the following features:
   - Firestore
   - Functions
   - Storage
   - Hosting
   - Emulators

   When prompted, select your Firebase project.

3. **Download Service Account Key**

   1. Go to the Firebase console: https://console.firebase.google.com/
   2. Select your project
   3. Go to Project Settings > Service accounts
   4. Click "Generate new private key"
   5. Save the file as `service-account.json` in the project root directory

## Deploy Firebase Schema

1. **Install Dependencies**

   ```bash
   npm install firebase-admin fs path
   ```

2. **Run the Deployment Script**

   ```bash
   node deploy-firebase.js
   ```

   This script will:
   - Create an admin user
   - Set up the initial database structure
   - Create sample data (project, features, playbook templates, crisis templates)

3. **Deploy Firestore Rules and Indexes**

   ```bash
   firebase deploy --only firestore
   ```

4. **Deploy Storage Rules**

   ```bash
   firebase deploy --only storage
   ```

5. **Deploy Cloud Functions**

   ```bash
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```

6. **Deploy Hosting**

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Schema Structure

The Firebase schema includes the following collections:

- **users**: User profiles and settings
- **projects**: Project information and metadata
- **features**: Features within projects (subcollection)
- **tasks**: Tasks within features (subcollection)
- **jiraConfigs**: Jira API configurations
- **jiraIssues**: Issues imported from or created in Jira
- **emailConfigs**: Email service configurations
- **processedEmails**: Emails processed by the system
- **playbookTemplates**: Templates for project workflows
- **playbookRuns**: Active and completed workflow runs
- **crisisTemplates**: Templates for crisis response
- **crisisResponses**: Active and completed crisis responses
- **whatsAppConfigs**: WhatsApp API configurations
- **whatsAppMessages**: Messages from WhatsApp
- **archonConfigs**: Archon API configurations
- **archonKnowledge**: Knowledge stored in Archon
- **reportConfigs**: CEO report configurations
- **reports**: Generated reports
- **transcripts**: Meeting transcripts
- **bmadAnalystSessions**: BMAD Analyst chat sessions

## Security Rules

The Firebase security rules enforce the following access patterns:

- Authentication is required for all operations
- Users can only access their own data
- Admins can access all data
- Project team members can access project data
- Managers have elevated permissions for certain operations

## Cloud Functions

The Firebase Cloud Functions provide the following API endpoints:

- User profile management
- Project and task operations
- Email processing
- WhatsApp message processing
- Playbook scheduling
- Report generation

Additionally, there are background functions for:

- Deadline notifications
- Scheduled playbook runs
- Scheduled report generation
- Email attachment processing

## Testing with Emulators

You can test the Firebase setup locally using emulators:

```bash
firebase emulators:start
```

This will start emulators for:
- Firestore (port 8080)
- Functions (port 5001)
- Hosting (port 5000)
- Auth (port 9099)
- Storage (port 9199)

## Troubleshooting

- **Error: Service account key not found**
  
  Make sure you've downloaded the service account key and saved it as `service-account.json` in the project root.

- **Error: Permission denied**
  
  Make sure your Firebase user has the necessary permissions in the Firebase project.

- **Error: Invalid project ID**
  
  Check that the project ID in `.firebaserc` matches your Firebase project ID.

- **Error: Deployment failed**
  
  Check the Firebase CLI output for specific error messages. Common issues include:
  - Invalid security rules syntax
  - Invalid Cloud Functions code
  - Missing dependencies
