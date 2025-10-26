/**
 * Firebase Schema for Project Management App
 * 
 * This file defines the structure of the Firestore database for the project management app.
 * It includes collections and document structures for all major features:
 * - User management
 * - Project management
 * - Jira integration
 * - Email processing
 * - Playbooks
 * - Crisis response
 * - BMAD Analyst
 */

export interface User {
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

export interface Project {
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

export interface ProjectRequirements {
  productVision: string;
  targetUsers: string[];
  keyFeatures: string[];
  successMetrics: string[];
  constraints: string[];
}

export interface Feature {
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

export interface Task {
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

export interface TaskSource {
  url: string;
  type: 'documentation' | 'internal_docs' | 'external';
  relevance: string;
}

export interface CodeExample {
  file: string;
  function?: string;
  class?: string;
  purpose: string;
}

// Jira Integration
export interface JiraConfig {
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

export interface JiraIssue {
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

export interface JiraComment {
  id: string;
  issueId: string;
  author: string;
  body: string;
  createdAt: Date;
}

export interface FollowUp {
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

// Email Processing
export interface EmailConfig {
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

export interface ProcessedEmail {
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

export interface EmailAttachment {
  id: string;
  emailId: string;
  filename: string;
  contentType: string;
  size: number;
  storageUrl: string;
  createdAt: Date;
}

export interface EmailAutoDraft {
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

export interface EmailReference {
  id: string;
  title: string;
  content: string;
  source: string;
  relevance: number;
}

// Playbooks
export interface PlaybookTemplate {
  id: string;
  title: string;
  description: string;
  category: 'standup' | 'planning' | 'status' | 'development' | 'triage';
  steps: PlaybookStep[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  duration?: number; // in minutes
  assignee?: string; // User ID or role
}

export interface PlaybookRun {
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

export interface PlaybookRunStep {
  id: string;
  stepId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  assignee?: string; // User ID
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

// Crisis Response
export interface CrisisTemplate {
  id: string;
  title: string;
  description: string;
  scenario: string;
  checklist: CrisisChecklistItem[];
  followUps: CrisisFollowUp[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrisisChecklistItem {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  order: number;
}

export interface CrisisFollowUp {
  id: string;
  title: string;
  description: string;
  dueIn: number; // hours after crisis start
}

export interface CrisisResponse {
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

export interface CrisisResponseItem {
  id: string;
  checklistItemId?: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'skipped';
  isRequired: boolean;
  completedAt?: Date;
  completedBy?: string; // User ID
}

export interface CrisisResponseFollowUp {
  id: string;
  followUpId?: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  completedAt?: Date;
  completedBy?: string; // User ID
}

// WhatsApp Integration
export interface WhatsAppConfig {
  id: string;
  userId: string;
  apiUrl: string;
  apiKey: string;
  phoneNumber: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppMessage {
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

// Archon Integration
export interface ArchonConfig {
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

export interface ArchonKnowledge {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceUrl?: string;
  sourceType: 'email' | 'document' | 'webpage' | 'chat';
  createdAt: Date;
  updatedAt: Date;
}

// CEO Reports
export interface ReportConfig {
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

export interface ReportSection {
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

export interface Report {
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

// Transcript Processing
export interface Transcript {
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

export interface TranscriptActionItem {
  id: string;
  transcriptId: string;
  content: string;
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'completed';
  jiraIssueId?: string;
}

// BMAD Analyst
export interface BmadAnalystSession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  messages: BmadAnalystMessage[];
  ragEnabled: boolean;
}

export interface BmadAnalystMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: BmadAnalystSource[];
}

export interface BmadAnalystSource {
  id: string;
  name: string;
  type: 'url' | 'document' | 'database';
  content?: string;
}

// Firebase collection paths
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
