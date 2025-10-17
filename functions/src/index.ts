import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));

// Middleware to verify Firebase ID token
const validateFirebaseIdToken = async (req: any, res: any, next: any) => {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    functions.logger.error('No Firebase ID token was passed');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if (req.cookies) {
    idToken = req.cookies.__session;
  } else {
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

// Apply middleware to all routes
app.use(validateFirebaseIdToken);

// API Routes

// Get user profile
app.get('/api/users/:userId', async (req: any, res: any) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is requesting their own profile or is an admin
    if (req.user.uid !== userId && req.user.role !== 'admin') {
      res.status(403).send('Unauthorized');
      return;
    }
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      res.status(404).send('User not found');
      return;
    }
    
    res.status(200).json({
      id: userDoc.id,
      ...userDoc.data()
    });
  } catch (error) {
    functions.logger.error('Error getting user profile:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Create or update user profile
app.post('/api/users/:userId', async (req: any, res: any) => {
  try {
    const userId = req.params.userId;
    const userData = req.body;
    
    // Check if user is updating their own profile or is an admin
    if (req.user.uid !== userId && req.user.role !== 'admin') {
      res.status(403).send('Unauthorized');
      return;
    }
    
    // Don't allow changing role unless admin
    if (userData.role && req.user.role !== 'admin') {
      delete userData.role;
    }
    
    await db.collection('users').doc(userId).set(userData, { merge: true });
    
    res.status(200).json({ success: true });
  } catch (error) {
    functions.logger.error('Error updating user profile:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get projects
app.get('/api/projects', async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const projectsSnapshot = await db.collection('projects')
      .where('team', 'array-contains', userId)
      .get();
    
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(projects);
  } catch (error) {
    functions.logger.error('Error getting projects:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Create project
app.post('/api/projects', async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const projectData = req.body;
    
    // Check if user is admin or manager
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
      res.status(403).send('Unauthorized');
      return;
    }
    
    // Add owner and timestamps
    const newProject = {
      ...projectData,
      owner: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const projectRef = await db.collection('projects').add(newProject);
    
    res.status(201).json({
      id: projectRef.id,
      ...newProject
    });
  } catch (error) {
    functions.logger.error('Error creating project:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Process emails to Jira tasks
app.post('/api/process-email', async (req: any, res: any) => {
  try {
    const { emailId, jiraProjectKey } = req.body;
    
    // Get email data
    const emailDoc = await db.collection('processedEmails').doc(emailId).get();
    
    if (!emailDoc.exists) {
      res.status(404).send('Email not found');
      return;
    }
    
    const emailData = emailDoc.data();
    
    // Create Jira issue
    const jiraIssue = {
      key: `${jiraProjectKey}-${Math.floor(Math.random() * 10000)}`, // Simulated key
      summary: emailData.subject,
      description: emailData.body,
      status: 'To Do',
      issueType: 'Task',
      priority: 'Medium',
      reporter: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const jiraIssueRef = await db.collection('jiraIssues').add(jiraIssue);
    
    // Update email with Jira issue ID
    await db.collection('processedEmails').doc(emailId).update({
      jiraIssueId: jiraIssueRef.id,
      status: 'processed'
    });
    
    res.status(200).json({
      success: true,
      jiraIssueId: jiraIssueRef.id
    });
  } catch (error) {
    functions.logger.error('Error processing email to Jira task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Process WhatsApp messages for crisis response
app.post('/api/process-whatsapp', async (req: any, res: any) => {
  try {
    const { messageId } = req.body;
    
    // Get message data
    const messageDoc = await db.collection('whatsAppMessages').doc(messageId).get();
    
    if (!messageDoc.exists) {
      res.status(404).send('Message not found');
      return;
    }
    
    const messageData = messageDoc.data();
    
    // Create crisis response
    const crisisResponse = {
      title: `Crisis from ${messageData.from}`,
      description: messageData.body,
      status: 'pending',
      progress: 0,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedTo: req.user.uid,
      checklist: [],
      followUps: []
    };
    
    const crisisResponseRef = await db.collection('crisisResponses').add(crisisResponse);
    
    // Update message with crisis response ID
    await db.collection('whatsAppMessages').doc(messageId).update({
      crisisResponseId: crisisResponseRef.id,
      status: 'processed',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      success: true,
      crisisResponseId: crisisResponseRef.id
    });
  } catch (error) {
    functions.logger.error('Error processing WhatsApp message:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Schedule playbook run
app.post('/api/schedule-playbook', async (req: any, res: any) => {
  try {
    const { templateId, schedule } = req.body;
    
    // Get template data
    const templateDoc = await db.collection('playbookTemplates').doc(templateId).get();
    
    if (!templateDoc.exists) {
      res.status(404).send('Template not found');
      return;
    }
    
    const templateData = templateDoc.data();
    
    // Create playbook run
    const playbookRun = {
      templateId,
      title: templateData.title,
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      owner: req.user.uid,
      participants: [req.user.uid],
      steps: templateData.steps.map((step: any) => ({
        stepId: step.id,
        status: 'pending',
        assignee: step.assignee || req.user.uid
      })),
      schedule
    };
    
    const playbookRunRef = await db.collection('playbookRuns').add(playbookRun);
    
    res.status(201).json({
      id: playbookRunRef.id,
      ...playbookRun
    });
  } catch (error) {
    functions.logger.error('Error scheduling playbook run:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Generate CEO report
app.post('/api/generate-report', async (req: any, res: any) => {
  try {
    const { configId } = req.body;
    
    // Get report config
    const configDoc = await db.collection('reportConfigs').doc(configId).get();
    
    if (!configDoc.exists) {
      res.status(404).send('Report configuration not found');
      return;
    }
    
    const configData = configDoc.data();
    
    // Generate report content (simplified)
    const reportContent = {
      html: `<h1>${configData.title}</h1><p>Generated at ${new Date().toISOString()}</p>`,
      text: `${configData.title}\nGenerated at ${new Date().toISOString()}`
    };
    
    // Create report
    const report = {
      configId,
      title: configData.title,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      recipients: configData.recipients,
      content: reportContent,
      status: 'generated'
    };
    
    const reportRef = await db.collection('reports').add(report);
    
    res.status(201).json({
      id: reportRef.id,
      ...report
    });
  } catch (error) {
    functions.logger.error('Error generating report:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Export the Express API as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Firestore Triggers

// Update project when a feature is added/updated/deleted
exports.onFeatureChange = functions.firestore
  .document('projects/{projectId}/features/{featureId}')
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;
    
    // Update project's updatedAt timestamp
    await db.collection('projects').doc(projectId).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// Send notification when a task is assigned
exports.onTaskAssigned = functions.firestore
  .document('projects/{projectId}/features/{featureId}/tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Check if assignee changed
    if (beforeData.assignee !== afterData.assignee && afterData.assignee) {
      // Get user data
      const userDoc = await db.collection('users').doc(afterData.assignee).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Check if user has notifications enabled
        if (userData.settings?.notifications) {
          // In a real implementation, send notification via FCM, email, etc.
          functions.logger.info(`Task ${context.params.taskId} assigned to ${afterData.assignee}`);
        }
      }
    }
  });

// Process email attachments
exports.processEmailAttachment = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    
    // Check if file is an email attachment
    if (filePath && filePath.startsWith('emails/')) {
      const pathParts = filePath.split('/');
      if (pathParts.length >= 3) {
        const emailId = pathParts[1];
        const attachmentId = pathParts[2];
        
        // Update attachment record with download URL
        const downloadUrl = `https://storage.googleapis.com/${object.bucket}/${filePath}`;
        
        await db.collection('processedEmails')
          .doc(emailId)
          .collection('attachments')
          .doc(attachmentId)
          .update({
            storageUrl: downloadUrl,
            size: object.size,
            contentType: object.contentType
          });
      }
    }
  });

// Scheduled Functions

// Daily check for approaching deadlines
exports.checkDeadlines = functions.pubsub
  .schedule('0 9 * * *') // Run at 9:00 AM every day
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Get Jira issues with approaching deadlines
    const issuesSnapshot = await db.collection('jiraIssues')
      .where('dueDate', '>', now)
      .where('dueDate', '<', admin.firestore.Timestamp.fromDate(twoDaysFromNow))
      .where('status', '!=', 'Done')
      .get();
    
    for (const doc of issuesSnapshot.docs) {
      const issue = doc.data();
      
      // Get assignee
      if (issue.assignee) {
        const userDoc = await db.collection('users').doc(issue.assignee).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          // Check if user has notifications enabled
          if (userData.settings?.notifications) {
            // In a real implementation, send notification via FCM, email, etc.
            functions.logger.info(`Deadline approaching for issue ${issue.key}: ${issue.summary}`);
          }
        }
      }
    }
    
    return null;
  });

// Run scheduled playbooks
exports.runScheduledPlaybooks = functions.pubsub
  .schedule('0 * * * *') // Run every hour
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Get active playbook runs with schedules
    const runsSnapshot = await db.collection('playbookRuns')
      .where('status', '==', 'active')
      .get();
    
    for (const doc of runsSnapshot.docs) {
      const run = doc.data();
      
      // Check if run has a schedule
      if (run.schedule && run.schedule.nextRun) {
        const nextRun = run.schedule.nextRun.toDate();
        
        // Check if it's time to run
        if (nextRun <= now.toDate()) {
          // Calculate next run time based on frequency
          let nextRunDate = new Date();
          
          switch (run.schedule.frequency) {
            case 'daily':
              nextRunDate.setDate(nextRunDate.getDate() + 1);
              break;
            case 'weekly':
              nextRunDate.setDate(nextRunDate.getDate() + 7);
              break;
            case 'biweekly':
              nextRunDate.setDate(nextRunDate.getDate() + 14);
              break;
            case 'monthly':
              nextRunDate.setMonth(nextRunDate.getMonth() + 1);
              break;
          }
          
          // Update schedule
          await db.collection('playbookRuns').doc(doc.id).update({
            'schedule.lastRun': now,
            'schedule.nextRun': admin.firestore.Timestamp.fromDate(nextRunDate)
          });
          
          // In a real implementation, trigger playbook actions
          functions.logger.info(`Running scheduled playbook: ${run.title}`);
        }
      }
    }
    
    return null;
  });

// Generate scheduled CEO reports
exports.generateScheduledReports = functions.pubsub
  .schedule('0 6 * * *') // Run at 6:00 AM every day
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();
    
    // Get report configurations
    const configsSnapshot = await db.collection('reportConfigs').get();
    
    for (const doc of configsSnapshot.docs) {
      const config = doc.data();
      
      // Check if report should be generated based on schedule
      let shouldGenerate = false;
      
      if (config.schedule) {
        switch (config.schedule.frequency) {
          case 'daily':
            shouldGenerate = true;
            break;
          case 'weekly':
            shouldGenerate = (config.schedule.day === dayOfWeek);
            break;
          case 'monthly':
            shouldGenerate = (config.schedule.day === dayOfMonth);
            break;
        }
      }
      
      if (shouldGenerate) {
        // Generate report content (simplified)
        const reportContent = {
          html: `<h1>${config.title}</h1><p>Generated at ${now.toISOString()}</p>`,
          text: `${config.title}\nGenerated at ${now.toISOString()}`
        };
        
        // Create report
        const report = {
          configId: doc.id,
          title: config.title,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          recipients: config.recipients,
          content: reportContent,
          status: 'generated'
        };
        
        await db.collection('reports').add(report);
        
        functions.logger.info(`Generated scheduled report: ${config.title}`);
      }
    }
    
    return null;
  });
