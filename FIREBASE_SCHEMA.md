# Firebase Schema Documentation

This document provides an overview of the Firebase schema for the project management app.

## Collections

### Users

User profiles and authentication information.

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'manager';
  createdAt: Date;
  lastLogin: Date;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
    emailDigest: boolean;
  };
}
```

### Projects

Project information and metadata.

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  owner: string; // User ID
  team: string[]; // Array of User IDs
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  githubRepo?: string;
  prd?: ProjectRequirements;
  features: Feature[];
}

interface ProjectRequirements {
  productVision: string;
  targetUsers: string[];
  keyFeatures: string[];
  successMetrics: string[];
  constraints: string[];
}
```

### Features (Subcollection of Projects)

Features within projects.

```typescript
interface Feature {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
}
```

### Tasks (Subcollection of Features)

Tasks within features.

```typescript
interface Task {
  id: string;
  featureId: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string; // User ID or agent name
  taskOrder: number;
  createdAt: Date;
  updatedAt: Date;
  sources?: TaskSource[];
  codeExamples?: CodeExample[];
  jiraIssueId?: string;
}

interface TaskSource {
  url: string;
  type: 'documentation' | 'internal_docs' | 'external';
  relevance: string;
}

interface CodeExample {
  file: string;
  function?: string;
  class?: string;
  purpose: string;
}
```

### Jira Integration

```typescript
interface JiraConfig {
  id: string;
  userId: string;
  apiUrl: string;
  username: string;
  apiToken: string;
  defaultProject: string;
  defaultIssueType: string;
  createdAt: Date;
  updatedAt: Date;
}

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  issueType: string;
  priority: string;
  assignee?: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  comments: JiraComment[];
  followUps: FollowUp[];
}

interface JiraComment {
  id: string;
  issueId: string;
  author: string;
  body: string;
  createdAt: Date;
}

interface FollowUp {
  id: string;
  issueId: string;
  channel: 'email' | 'slack' | 'whatsapp';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
}
```

### Email Processing

```typescript
interface EmailConfig {
  id: string;
  userId: string;
  provider: 'gmail' | 'outlook' | 'smtp';
  email: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcessedEmail {
  id: string;
  subject: string;
  sender: string;
  recipients: string[];
  body: string;
  htmlBody?: string;
  receivedAt: Date;
  processedAt: Date;
  labels: string[];
  jiraIssueId?: string;
  attachments: EmailAttachment[];
  status: 'processed' | 'pending' | 'failed';
}

interface EmailAttachment {
  id: string;
  emailId: string;
  filename: string;
  contentType: string;
  size: number;
  storageUrl: string;
  createdAt: Date;
}

interface EmailAutoDraft {
  id: string;
  emailId: string;
  subject: string;
  body: string;
  htmlBody?: string;
  references: EmailReference[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'edited' | 'sent' | 'discarded';
}

interface EmailReference {
  id: string;
  title: string;
  content: string;
  source: string;
  relevance: number;
}
```

### Playbooks

```typescript
interface PlaybookTemplate {
  id: string;
  title: string;
  description: string;
  category: 'standup' | 'planning' | 'status' | 'development' | 'triage';
  steps: PlaybookStep[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  duration?: number; // in minutes
  assignee?: string; // User ID or role
}

interface PlaybookRun {
  id: string;
  templateId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  startedAt: Date;
  completedAt?: Date;
  owner: string; // User ID
  participants: string[]; // User IDs
  steps: PlaybookRunStep[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    nextRun: Date;
    lastRun?: Date;
  };
}

interface PlaybookRunStep {
  id: string;
  stepId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  assignee?: string; // User ID
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}
```

### Crisis Response

```typescript
interface CrisisTemplate {
  id: string;
  title: string;
  description: string;
  scenario: string;
  checklist: CrisisChecklistItem[];
  followUps: CrisisFollowUp[];
  createdAt: Date;
  updatedAt: Date;
}

interface CrisisChecklistItem {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  order: number;
}

interface CrisisFollowUp {
  id: string;
  title: string;
  description: string;
  dueIn: number; // hours after crisis start
}

interface CrisisResponse {
  id: string;
  templateId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  assignedTo: string; // User ID
  checklist: CrisisResponseItem[];
  followUps: CrisisResponseFollowUp[];
  notes?: string;
  estimatedHours?: number;
  hourlyRate?: number;
  totalCost?: number;
}

interface CrisisResponseItem {
  id: string;
  checklistItemId?: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'skipped';
  isRequired: boolean;
  completedAt?: Date;
  completedBy?: string; // User ID
}

interface CrisisResponseFollowUp {
  id: string;
  followUpId?: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  completedAt?: Date;
  completedBy?: string; // User ID
}
```

### WhatsApp Integration

```typescript
interface WhatsAppConfig {
  id: string;
  userId: string;
  apiUrl: string;
  apiKey: string;
  phoneNumber: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WhatsAppMessage {
  id: string;
  channelId: string;
  from: string;
  to: string;
  body: string;
  mediaUrl?: string;
  receivedAt: Date;
  processedAt?: Date;
  status: 'received' | 'processed' | 'failed';
  crisisResponseId?: string;
}
```

### Archon Integration

```typescript
interface ArchonConfig {
  id: string;
  userId: string;
  apiUrl: string;
  apiKey: string;
  vectorDb: string;
  embeddingModel: string;
  completionModel: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ArchonKnowledge {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceUrl?: string;
  sourceType: 'email' | 'document' | 'webpage' | 'chat';
  createdAt: Date;
  updatedAt: Date;
}
```

### CEO Reports

```typescript
interface ReportConfig {
  id: string;
  title: string;
  description: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: number; // day of week (0-6) or day of month (1-31)
    time: string; // HH:MM format
    timezone: string;
  };
  recipients: string[]; // email addresses
  sections: ReportSection[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

interface ReportSection {
  id: string;
  title: string;
  type: 'jira' | 'metrics' | 'text';
  order: number;
  config: {
    jqlQuery?: string;
    metricType?: string;
    textContent?: string;
  };
}

interface Report {
  id: string;
  configId: string;
  title: string;
  generatedAt: Date;
  sentAt?: Date;
  recipients: string[];
  content: {
    html: string;
    text: string;
  };
  status: 'generated' | 'sent' | 'failed';
}
```

### Transcript Processing

```typescript
interface Transcript {
  id: string;
  title: string;
  content: string;
  source: 'manual' | 'upload' | 'fireflies';
  processedAt: Date;
  actionItems: TranscriptActionItem[];
  jiraIssues: string[]; // Jira Issue IDs
  createdAt: Date;
  userId: string;
}

interface TranscriptActionItem {
  id: string;
  transcriptId: string;
  content: string;
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'completed';
  jiraIssueId?: string;
}
```

### BMAD Analyst

```typescript
interface BmadAnalystSession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  messages: BmadAnalystMessage[];
  ragEnabled: boolean;
}

interface BmadAnalystMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: BmadAnalystSource[];
}

interface BmadAnalystSource {
  id: string;
  name: string;
  type: 'url' | 'document' | 'database';
  content?: string;
}
```

## Collection Paths

```typescript
export const collections = {
  users: 'users',
  projects: 'projects',
  features: 'projects/{projectId}/features',
  tasks: 'projects/{projectId}/features/{featureId}/tasks',
  jiraConfigs: 'jiraConfigs',
  jiraIssues: 'jiraIssues',
  jiraComments: 'jiraIssues/{issueId}/comments',
  followUps: 'jiraIssues/{issueId}/followUps',
  emailConfigs: 'emailConfigs',
  processedEmails: 'processedEmails',
  emailAttachments: 'processedEmails/{emailId}/attachments',
  emailAutoDrafts: 'emailAutoDrafts',
  playbookTemplates: 'playbookTemplates',
  playbookRuns: 'playbookRuns',
  crisisTemplates: 'crisisTemplates',
  crisisResponses: 'crisisResponses',
  whatsAppConfigs: 'whatsAppConfigs',
  whatsAppMessages: 'whatsAppMessages',
  archonConfigs: 'archonConfigs',
  archonKnowledge: 'archonKnowledge',
  reportConfigs: 'reportConfigs',
  reports: 'reports',
  transcripts: 'transcripts',
  transcriptActionItems: 'transcripts/{transcriptId}/actionItems',
  bmadAnalystSessions: 'bmadAnalystSessions',
  bmadAnalystMessages: 'bmadAnalystSessions/{sessionId}/messages',
};
```

## Indexes

The schema includes the following indexes to optimize queries:

1. Projects by team member and status
2. Tasks by project and status
3. Tasks by assignee and status
4. Jira issues by status and due date
5. Jira issues by status, priority, and update time
6. Processed emails by status and receive time
7. Playbook runs by status and start time
8. Crisis responses by status and start time
9. Crisis responses by assignee and status
10. WhatsApp messages by channel and receive time
11. Archon knowledge by tags and update time
12. Reports by config and generation time
13. BMAD Analyst sessions by user and start time

## Security Rules

The security rules enforce the following access patterns:

- Authentication is required for all operations
- Users can only access their own data
- Admins can access all data
- Project team members can access project data
- Managers have elevated permissions for certain operations

## Storage Structure

The Firebase Storage is organized as follows:

1. User profile images: `/users/{userId}/profile/{imageId}`
2. Project files: `/projects/{projectId}/{allFiles=**}`
3. Email attachments: `/emails/{emailId}/attachments/{attachmentId}`
4. Transcript files: `/transcripts/{transcriptId}/{allFiles=**}`
5. Crisis response files: `/crisis/{responseId}/{allFiles=**}`
6. Playbook files: `/playbooks/{playbookId}/{allFiles=**}`
7. Report files: `/reports/{reportId}/{allFiles=**}`
