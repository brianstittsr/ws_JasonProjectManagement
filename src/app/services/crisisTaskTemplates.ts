import { TaskEstimate } from './crisisResponseAnalyzer';
import { WhatsAppMessage } from './whatsappIntegration';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: 'server' | 'security' | 'database' | 'application' | 'network' | 'other';
  estimatedHours: number;
  hourlyRate: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  skills: string[];
  checklistItems: {
    id: string;
    text: string;
    required: boolean;
  }[];
  followUpActions: {
    id: string;
    text: string;
    daysAfter: number;
  }[];
}

export interface TaskInstance extends TaskEstimate {
  templateId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  checklistItems: {
    id: string;
    text: string;
    required: boolean;
    completed: boolean;
    completedAt?: string;
  }[];
  followUpActions: {
    id: string;
    text: string;
    dueDate: string;
    completed: boolean;
    completedAt?: string;
  }[];
  notes: string;
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }[];
}

export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-server-outage',
    name: 'Server Outage Resolution',
    description: 'Resolve server outage affecting production environment',
    category: 'server',
    estimatedHours: 6,
    hourlyRate: 200,
    priority: 'critical',
    skills: ['DevOps', 'System Administration', 'Troubleshooting'],
    checklistItems: [
      { id: 'check-1', text: 'Verify server status and connectivity', required: true },
      { id: 'check-2', text: 'Check system logs for errors', required: true },
      { id: 'check-3', text: 'Restart affected services', required: false },
      { id: 'check-4', text: 'Verify database connectivity', required: true },
      { id: 'check-5', text: 'Test application functionality', required: true },
      { id: 'check-6', text: 'Update status page', required: true },
      { id: 'check-7', text: 'Notify stakeholders of resolution', required: true }
    ],
    followUpActions: [
      { id: 'follow-1', text: 'Conduct post-mortem analysis', daysAfter: 1 },
      { id: 'follow-2', text: 'Implement preventive measures', daysAfter: 3 },
      { id: 'follow-3', text: 'Update documentation', daysAfter: 5 }
    ]
  },
  {
    id: 'template-security-breach',
    name: 'Security Breach Investigation',
    description: 'Investigate and mitigate security breach',
    category: 'security',
    estimatedHours: 8,
    hourlyRate: 225,
    priority: 'critical',
    skills: ['Security', 'Penetration Testing', 'Forensic Analysis'],
    checklistItems: [
      { id: 'check-1', text: 'Isolate affected systems', required: true },
      { id: 'check-2', text: 'Analyze security logs', required: true },
      { id: 'check-3', text: 'Identify breach vector', required: true },
      { id: 'check-4', text: 'Secure compromised accounts', required: true },
      { id: 'check-5', text: 'Patch vulnerabilities', required: true },
      { id: 'check-6', text: 'Restore from clean backups if needed', required: false },
      { id: 'check-7', text: 'Document incident details', required: true }
    ],
    followUpActions: [
      { id: 'follow-1', text: 'Conduct security audit', daysAfter: 1 },
      { id: 'follow-2', text: 'Update security protocols', daysAfter: 2 },
      { id: 'follow-3', text: 'Schedule security training', daysAfter: 7 }
    ]
  },
  {
    id: 'template-database-performance',
    name: 'Database Performance Optimization',
    description: 'Optimize database performance and resolve query bottlenecks',
    category: 'database',
    estimatedHours: 5,
    hourlyRate: 175,
    priority: 'high',
    skills: ['Database Administration', 'SQL Optimization', 'Performance Tuning'],
    checklistItems: [
      { id: 'check-1', text: 'Analyze slow query logs', required: true },
      { id: 'check-2', text: 'Optimize problematic queries', required: true },
      { id: 'check-3', text: 'Review and adjust indexes', required: true },
      { id: 'check-4', text: 'Check database configuration', required: true },
      { id: 'check-5', text: 'Implement query caching if applicable', required: false },
      { id: 'check-6', text: 'Test performance improvements', required: true },
      { id: 'check-7', text: 'Document optimizations made', required: true }
    ],
    followUpActions: [
      { id: 'follow-1', text: 'Monitor query performance', daysAfter: 1 },
      { id: 'follow-2', text: 'Review database scaling options', daysAfter: 3 },
      { id: 'follow-3', text: 'Update database maintenance procedures', daysAfter: 5 }
    ]
  },
  {
    id: 'template-application-error',
    name: 'Application Error Resolution',
    description: 'Diagnose and fix critical application errors',
    category: 'application',
    estimatedHours: 4,
    hourlyRate: 150,
    priority: 'high',
    skills: ['Software Development', 'Debugging', 'Error Handling'],
    checklistItems: [
      { id: 'check-1', text: 'Reproduce the error', required: true },
      { id: 'check-2', text: 'Analyze error logs', required: true },
      { id: 'check-3', text: 'Debug problematic code', required: true },
      { id: 'check-4', text: 'Implement fix', required: true },
      { id: 'check-5', text: 'Test fix in development environment', required: true },
      { id: 'check-6', text: 'Deploy to production', required: true },
      { id: 'check-7', text: 'Verify error is resolved', required: true }
    ],
    followUpActions: [
      { id: 'follow-1', text: 'Monitor application stability', daysAfter: 1 },
      { id: 'follow-2', text: 'Update error handling', daysAfter: 3 },
      { id: 'follow-3', text: 'Add regression tests', daysAfter: 2 }
    ]
  },
  {
    id: 'template-network-issue',
    name: 'Network Connectivity Issue',
    description: 'Resolve network connectivity problems affecting services',
    category: 'network',
    estimatedHours: 3,
    hourlyRate: 160,
    priority: 'high',
    skills: ['Network Administration', 'Troubleshooting', 'Infrastructure'],
    checklistItems: [
      { id: 'check-1', text: 'Verify network equipment status', required: true },
      { id: 'check-2', text: 'Check for network congestion', required: true },
      { id: 'check-3', text: 'Test connectivity between services', required: true },
      { id: 'check-4', text: 'Review firewall rules', required: true },
      { id: 'check-5', text: 'Check DNS resolution', required: true },
      { id: 'check-6', text: 'Implement network fixes', required: true },
      { id: 'check-7', text: 'Test connectivity after fixes', required: true }
    ],
    followUpActions: [
      { id: 'follow-1', text: 'Monitor network performance', daysAfter: 1 },
      { id: 'follow-2', text: 'Review network architecture', daysAfter: 5 },
      { id: 'follow-3', text: 'Update network documentation', daysAfter: 3 }
    ]
  }
];

export class CrisisTaskTemplateService {
  private templates: TaskTemplate[] = [...DEFAULT_TASK_TEMPLATES];
  private tasks: TaskInstance[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const templatesJson = localStorage.getItem('crisis-task-templates');
      if (templatesJson) {
        this.templates = JSON.parse(templatesJson);
      }

      const tasksJson = localStorage.getItem('crisis-tasks');
      if (tasksJson) {
        this.tasks = JSON.parse(tasksJson);
      }
    } catch (error) {
      console.error('Error loading crisis task data from localStorage:', error);
    }
  }

  private saveTemplatesToLocalStorage(): void {
    try {
      localStorage.setItem('crisis-task-templates', JSON.stringify(this.templates));
    } catch (error) {
      console.error('Error saving crisis task templates to localStorage:', error);
    }
  }

  private saveTasksToLocalStorage(): void {
    try {
      localStorage.setItem('crisis-tasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Error saving crisis tasks to localStorage:', error);
    }
  }

  getTemplates(): TaskTemplate[] {
    return [...this.templates];
  }

  getTemplateById(id: string): TaskTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  createTemplate(template: Omit<TaskTemplate, 'id'>): TaskTemplate {
    const newTemplate: TaskTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };

    this.templates.push(newTemplate);
    this.saveTemplatesToLocalStorage();

    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<TaskTemplate>): TaskTemplate | null {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    this.templates[index] = { ...this.templates[index], ...updates };
    this.saveTemplatesToLocalStorage();

    return this.templates[index];
  }

  deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(template => template.id !== id);
    
    if (this.templates.length !== initialLength) {
      this.saveTemplatesToLocalStorage();
      return true;
    }
    
    return false;
  }

  getTasks(): TaskInstance[] {
    return [...this.tasks];
  }

  getTaskById(id: string): TaskInstance | undefined {
    return this.tasks.find(task => task.id === id);
  }

  createTaskFromTemplate(templateId: string, messageId?: string, originalMessage?: WhatsAppMessage): TaskInstance | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const now = new Date().toISOString();
    
    const newTask: TaskInstance = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      templateId,
      title: template.name,
      description: template.description,
      estimatedHours: template.estimatedHours,
      hourlyRate: template.hourlyRate,
      totalCost: template.estimatedHours * template.hourlyRate,
      priority: template.priority,
      skills: [...template.skills],
      status: 'pending',
      checklistItems: template.checklistItems.map(item => ({
        ...item,
        completed: false
      })),
      followUpActions: template.followUpActions.map(action => ({
        ...action,
        dueDate: new Date(Date.now() + action.daysAfter * 24 * 60 * 60 * 1000).toISOString(),
        completed: false
      })),
      notes: '',
      attachments: [],
      originalMessage: originalMessage || {
        id: messageId || `msg-${Date.now()}`,
        from: 'system',
        timestamp: now,
        text: { body: template.description },
        type: 'text'
      }
    };

    this.tasks.push(newTask);
    this.saveTasksToLocalStorage();

    return newTask;
  }

  createTaskFromMessage(taskEstimate: TaskEstimate): TaskInstance {
    const now = new Date().toISOString();
    
    // Find the most appropriate template category based on the task description
    let category: TaskTemplate['category'] = 'other';
    const description = taskEstimate.description.toLowerCase();
    
    if (description.includes('server') || description.includes('outage') || description.includes('down')) {
      category = 'server';
    } else if (description.includes('security') || description.includes('breach') || description.includes('hack')) {
      category = 'security';
    } else if (description.includes('database') || description.includes('sql') || description.includes('query')) {
      category = 'database';
    } else if (description.includes('application') || description.includes('code') || description.includes('bug')) {
      category = 'application';
    } else if (description.includes('network') || description.includes('connectivity') || description.includes('connection')) {
      category = 'network';
    }
    
    // Get default checklist items based on category
    const template = this.templates.find(t => t.category === category);
    const checklistItems = template ? template.checklistItems.map(item => ({
      ...item,
      completed: false
    })) : [
      { id: 'check-1', text: 'Assess the situation', required: true, completed: false },
      { id: 'check-2', text: 'Develop action plan', required: true, completed: false },
      { id: 'check-3', text: 'Implement solution', required: true, completed: false },
      { id: 'check-4', text: 'Test and verify', required: true, completed: false },
      { id: 'check-5', text: 'Document resolution', required: true, completed: false }
    ];
    
    // Get default follow-up actions based on category
    const followUpActions = template ? template.followUpActions.map(action => ({
      ...action,
      dueDate: new Date(Date.now() + action.daysAfter * 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    })) : [
      { 
        id: 'follow-1', 
        text: 'Review resolution effectiveness', 
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 
        completed: false 
      },
      { 
        id: 'follow-2', 
        text: 'Update documentation', 
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
        completed: false 
      }
    ];
    
    const newTask: TaskInstance = {
      ...taskEstimate,
      status: 'pending',
      checklistItems,
      followUpActions,
      notes: '',
      attachments: []
    };

    this.tasks.push(newTask);
    this.saveTasksToLocalStorage();

    return newTask;
  }

  updateTask(id: string, updates: Partial<TaskInstance>): TaskInstance | null {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return null;

    this.tasks[index] = { ...this.tasks[index], ...updates };
    this.saveTasksToLocalStorage();

    return this.tasks[index];
  }

  updateTaskStatus(id: string, status: TaskInstance['status']): TaskInstance | null {
    const task = this.getTaskById(id);
    if (!task) return null;

    const now = new Date().toISOString();
    const updates: Partial<TaskInstance> = { status };

    if (status === 'in_progress' && !task.startedAt) {
      updates.startedAt = now;
    } else if (status === 'completed' && !task.completedAt) {
      updates.completedAt = now;
    }

    return this.updateTask(id, updates);
  }

  updateChecklistItem(taskId: string, itemId: string, completed: boolean): TaskInstance | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const now = new Date().toISOString();
    const updatedItems = task.checklistItems.map(item => 
      item.id === itemId 
        ? { ...item, completed, completedAt: completed ? now : undefined } 
        : item
    );

    return this.updateTask(taskId, { checklistItems: updatedItems });
  }

  updateFollowUpAction(taskId: string, actionId: string, completed: boolean): TaskInstance | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const now = new Date().toISOString();
    const updatedActions = task.followUpActions.map(action => 
      action.id === actionId 
        ? { ...action, completed, completedAt: completed ? now : undefined } 
        : action
    );

    return this.updateTask(taskId, { followUpActions: updatedActions });
  }

  addTaskNote(taskId: string, note: string): TaskInstance | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const updatedNotes = task.notes ? `${task.notes}\n\n${new Date().toLocaleString()}: ${note}` : `${new Date().toLocaleString()}: ${note}`;
    return this.updateTask(taskId, { notes: updatedNotes });
  }

  addTaskAttachment(taskId: string, attachment: Omit<TaskInstance['attachments'][0], 'id' | 'uploadedAt'>): TaskInstance | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const newAttachment = {
      ...attachment,
      id: `attachment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      uploadedAt: new Date().toISOString()
    };

    const updatedAttachments = [...task.attachments, newAttachment];
    return this.updateTask(taskId, { attachments: updatedAttachments });
  }

  deleteTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    
    if (this.tasks.length !== initialLength) {
      this.saveTasksToLocalStorage();
      return true;
    }
    
    return false;
  }

  getTaskProgress(taskId: string): number {
    const task = this.getTaskById(taskId);
    if (!task) return 0;

    const totalItems = task.checklistItems.length;
    if (totalItems === 0) return 0;

    const completedItems = task.checklistItems.filter(item => item.completed).length;
    return Math.round((completedItems / totalItems) * 100);
  }

  getTaskValidation(taskId: string): { isValid: boolean; missingRequiredItems: string[] } {
    const task = this.getTaskById(taskId);
    if (!task) return { isValid: false, missingRequiredItems: ['Task not found'] };

    const missingRequiredItems = task.checklistItems
      .filter(item => item.required && !item.completed)
      .map(item => item.text);

    return {
      isValid: missingRequiredItems.length === 0,
      missingRequiredItems
    };
  }

  getPendingFollowUps(): { task: TaskInstance; action: TaskInstance['followUpActions'][0] }[] {
    const now = new Date();
    const pendingFollowUps: { task: TaskInstance; action: TaskInstance['followUpActions'][0] }[] = [];

    this.tasks.forEach(task => {
      task.followUpActions.forEach(action => {
        if (!action.completed && new Date(action.dueDate) <= now) {
          pendingFollowUps.push({ task, action });
        }
      });
    });

    return pendingFollowUps;
  }

  resetToDefaults(): void {
    this.templates = [...DEFAULT_TASK_TEMPLATES];
    this.tasks = [];
    this.saveTemplatesToLocalStorage();
    this.saveTasksToLocalStorage();
  }
}

// Helper function to create a CrisisTaskTemplateService
export const createCrisisTaskTemplateService = (): CrisisTaskTemplateService => {
  return new CrisisTaskTemplateService();
};
