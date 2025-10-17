import { ArchonService } from './archon';

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'checklist' | 'update' | 'notification';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignee?: string;
  dueDate?: string;
  completedAt?: string;
  checklistItems?: Array<{
    id: string;
    text: string;
    checked: boolean;
  }>;
  updatePrompt?: string;
  notificationChannel?: string;
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'project_management' | 'development' | 'design' | 'marketing' | 'other';
  steps: PlaybookStep[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PlaybookRun {
  id: string;
  templateId: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  currentStepIndex: number;
  steps: PlaybookStep[];
  participants: string[];
  owner: string;
  startedAt: string;
  completedAt?: string;
  scheduledUpdates: PlaybookSchedule[];
  updates: PlaybookUpdate[];
}

export interface PlaybookSchedule {
  id: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  days?: number[]; // 0-6 for days of week (0 = Sunday)
  time: string; // HH:MM format
  timezone: string;
  nextRun: string;
  lastRun?: string;
  updatePrompt: string;
  notifyParticipants: boolean;
}

export interface PlaybookUpdate {
  id: string;
  runId: string;
  stepId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

export class PlaybookAutomationService {
  private templates: PlaybookTemplate[] = [];
  private runs: PlaybookRun[] = [];
  private archonService: ArchonService;
  private timers: Record<string, NodeJS.Timeout> = {};

  constructor(archonService: ArchonService) {
    this.archonService = archonService;
    this.loadFromLocalStorage();
  }

  /**
   * Load templates and runs from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const templatesJson = localStorage.getItem('playbook-templates');
      if (templatesJson) {
        this.templates = JSON.parse(templatesJson);
      } else {
        // Load default templates
        this.templates = DEFAULT_TEMPLATES;
        this.saveTemplatesToLocalStorage();
      }

      const runsJson = localStorage.getItem('playbook-runs');
      if (runsJson) {
        this.runs = JSON.parse(runsJson);
      }
    } catch (error) {
      console.error('Error loading playbooks from localStorage:', error);
    }
  }

  /**
   * Save templates to localStorage
   */
  private saveTemplatesToLocalStorage(): void {
    try {
      localStorage.setItem('playbook-templates', JSON.stringify(this.templates));
    } catch (error) {
      console.error('Error saving playbook templates to localStorage:', error);
    }
  }

  /**
   * Save runs to localStorage
   */
  private saveRunsToLocalStorage(): void {
    try {
      localStorage.setItem('playbook-runs', JSON.stringify(this.runs));
    } catch (error) {
      console.error('Error saving playbook runs to localStorage:', error);
    }
  }

  /**
   * Get all playbook templates
   */
  getTemplates(): PlaybookTemplate[] {
    return [...this.templates];
  }

  /**
   * Get a specific template by ID
   */
  getTemplateById(id: string): PlaybookTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * Create a new template
   */
  createTemplate(template: Omit<PlaybookTemplate, 'id' | 'createdAt' | 'updatedAt'>): PlaybookTemplate {
    const newTemplate: PlaybookTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.push(newTemplate);
    this.saveTemplatesToLocalStorage();
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<PlaybookTemplate>): PlaybookTemplate | null {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    const updatedTemplate = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.templates[index] = updatedTemplate;
    this.saveTemplatesToLocalStorage();
    return updatedTemplate;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(template => template.id !== id);
    
    if (this.templates.length !== initialLength) {
      this.saveTemplatesToLocalStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Get all playbook runs
   */
  getRuns(): PlaybookRun[] {
    return [...this.runs];
  }

  /**
   * Get a specific run by ID
   */
  getRunById(id: string): PlaybookRun | undefined {
    return this.runs.find(run => run.id === id);
  }

  /**
   * Start a new playbook run from a template
   */
  startRun(templateId: string, name: string, description: string, owner: string, participants: string[] = []): PlaybookRun | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const newRun: PlaybookRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      templateId,
      name,
      description,
      status: 'active',
      currentStepIndex: 0,
      steps: JSON.parse(JSON.stringify(template.steps)), // Deep copy steps
      participants: [...participants],
      owner,
      startedAt: new Date().toISOString(),
      scheduledUpdates: [],
      updates: [],
    };

    this.runs.push(newRun);
    this.saveRunsToLocalStorage();
    return newRun;
  }

  /**
   * Update a run
   */
  updateRun(id: string, updates: Partial<PlaybookRun>): PlaybookRun | null {
    const index = this.runs.findIndex(run => run.id === id);
    if (index === -1) return null;

    const updatedRun = {
      ...this.runs[index],
      ...updates,
    };

    this.runs[index] = updatedRun;
    this.saveRunsToLocalStorage();
    return updatedRun;
  }

  /**
   * Add a scheduled update to a run
   */
  addScheduledUpdate(runId: string, schedule: Omit<PlaybookSchedule, 'id' | 'nextRun'>): PlaybookSchedule | null {
    const run = this.getRunById(runId);
    if (!run) return null;

    // Calculate next run time
    const nextRun = this.calculateNextRunTime(schedule);

    const newSchedule: PlaybookSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      nextRun,
    };

    run.scheduledUpdates.push(newSchedule);
    this.saveRunsToLocalStorage();

    // Set up timer for this schedule
    this.setupScheduleTimer(runId, newSchedule);

    return newSchedule;
  }

  /**
   * Calculate the next run time for a schedule
   */
  private calculateNextRunTime(schedule: Omit<PlaybookSchedule, 'id' | 'nextRun'>): string {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, move to the next occurrence
    if (nextRun <= now) {
      if (schedule.frequency === 'daily') {
        // Move to tomorrow
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (schedule.frequency === 'weekly' && schedule.days && schedule.days.length > 0) {
        // Find the next day of the week
        const today = now.getDay();
        const nextDays = schedule.days.filter(day => day > today);
        
        if (nextDays.length > 0) {
          // There's a day later this week
          const daysToAdd = nextDays[0] - today;
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        } else {
          // Move to the first day next week
          const daysToAdd = 7 - today + schedule.days[0];
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        }
      } else if (schedule.frequency === 'biweekly') {
        // Move to two weeks from now
        nextRun.setDate(nextRun.getDate() + 14);
      } else if (schedule.frequency === 'monthly') {
        // Move to next month
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
    }
    
    return nextRun.toISOString();
  }

  /**
   * Set up a timer for a scheduled update
   */
  private setupScheduleTimer(runId: string, schedule: PlaybookSchedule): void {
    // Clear any existing timer for this schedule
    if (this.timers[schedule.id]) {
      clearTimeout(this.timers[schedule.id]);
    }
    
    const nextRunTime = new Date(schedule.nextRun).getTime();
    const now = Date.now();
    const delay = Math.max(0, nextRunTime - now);
    
    // Set up the timer
    this.timers[schedule.id] = setTimeout(() => {
      this.processScheduledUpdate(runId, schedule.id);
    }, delay);
  }

  /**
   * Process a scheduled update when its timer fires
   */
  private async processScheduledUpdate(runId: string, scheduleId: string): Promise<void> {
    const run = this.getRunById(runId);
    if (!run || run.status !== 'active') return;
    
    const scheduleIndex = run.scheduledUpdates.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) return;
    
    const schedule = run.scheduledUpdates[scheduleIndex];
    
    try {
      // Get update prompt from Archon if available
      let updatePrompt = schedule.updatePrompt;
      
      if (updatePrompt.includes('[ARCHON]')) {
        const archonQuery = updatePrompt.replace('[ARCHON]', '').trim();
        const archonResults = await this.archonService.searchKnowledge(archonQuery, ['resbyte']);
        
        if (archonResults && archonResults.length > 0) {
          updatePrompt = archonResults[0].content;
        }
      }
      
      // Create an update for this scheduled event
      const update: PlaybookUpdate = {
        id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        runId,
        stepId: run.steps[run.currentStepIndex]?.id || 'general',
        content: `Scheduled update: ${updatePrompt}`,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      };
      
      run.updates.push(update);
      
      // Update the last run time and calculate next run
      run.scheduledUpdates[scheduleIndex] = {
        ...schedule,
        lastRun: new Date().toISOString(),
        nextRun: this.calculateNextRunTime(schedule),
      };
      
      this.saveRunsToLocalStorage();
      
      // Set up the next timer
      this.setupScheduleTimer(runId, run.scheduledUpdates[scheduleIndex]);
      
    } catch (error) {
      console.error('Error processing scheduled update:', error);
    }
  }

  /**
   * Add an update to a run
   */
  addUpdate(runId: string, stepId: string, content: string, createdBy: string): PlaybookUpdate | null {
    const run = this.getRunById(runId);
    if (!run) return null;

    const update: PlaybookUpdate = {
      id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      runId,
      stepId,
      content,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    run.updates.push(update);
    this.saveRunsToLocalStorage();
    return update;
  }

  /**
   * Complete a step in a run
   */
  completeStep(runId: string, stepId: string): boolean {
    const run = this.getRunById(runId);
    if (!run) return false;

    const stepIndex = run.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return false;

    run.steps[stepIndex].status = 'completed';
    run.steps[stepIndex].completedAt = new Date().toISOString();

    // If this is the current step, move to the next one
    if (stepIndex === run.currentStepIndex && stepIndex < run.steps.length - 1) {
      run.currentStepIndex++;
    }

    // Check if all steps are completed
    const allCompleted = run.steps.every(step => 
      step.status === 'completed' || step.status === 'skipped'
    );

    if (allCompleted) {
      run.status = 'completed';
      run.completedAt = new Date().toISOString();
      
      // Clear all timers for this run
      run.scheduledUpdates.forEach(schedule => {
        if (this.timers[schedule.id]) {
          clearTimeout(this.timers[schedule.id]);
          delete this.timers[schedule.id];
        }
      });
    }

    this.saveRunsToLocalStorage();
    return true;
  }

  /**
   * Skip a step in a run
   */
  skipStep(runId: string, stepId: string): boolean {
    const run = this.getRunById(runId);
    if (!run) return false;

    const stepIndex = run.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return false;

    run.steps[stepIndex].status = 'skipped';

    // If this is the current step, move to the next one
    if (stepIndex === run.currentStepIndex && stepIndex < run.steps.length - 1) {
      run.currentStepIndex++;
    }

    this.saveRunsToLocalStorage();
    return true;
  }

  /**
   * Archive a run
   */
  archiveRun(id: string): boolean {
    const run = this.getRunById(id);
    if (!run) return false;

    run.status = 'archived';
    
    // Clear all timers for this run
    run.scheduledUpdates.forEach(schedule => {
      if (this.timers[schedule.id]) {
        clearTimeout(this.timers[schedule.id]);
        delete this.timers[schedule.id];
      }
    });

    this.saveRunsToLocalStorage();
    return true;
  }

  /**
   * Delete a run
   */
  deleteRun(id: string): boolean {
    const run = this.getRunById(id);
    if (!run) return false;
    
    // Clear all timers for this run
    run.scheduledUpdates.forEach(schedule => {
      if (this.timers[schedule.id]) {
        clearTimeout(this.timers[schedule.id]);
        delete this.timers[schedule.id];
      }
    });
    
    const initialLength = this.runs.length;
    this.runs = this.runs.filter(run => run.id !== id);
    
    if (this.runs.length !== initialLength) {
      this.saveRunsToLocalStorage();
      return true;
    }
    
    return false;
  }
}

// Helper function to create a PlaybookAutomationService
export const createPlaybookAutomationService = async (): Promise<PlaybookAutomationService | null> => {
  try {
    // Create Archon service
    const archonService = await import('./archon').then(module => module.createArchonService());
    
    if (!archonService) {
      console.error('Failed to create Archon service');
      return null;
    }
    
    return new PlaybookAutomationService(archonService);
  } catch (error) {
    console.error('Failed to create PlaybookAutomationService:', error);
    return null;
  }
};

// Default templates based on Mattermost Playbooks
const DEFAULT_TEMPLATES: PlaybookTemplate[] = [
  {
    id: 'template-daily-standup',
    name: 'Daily Standup',
    description: 'Track daily progress and blockers with a structured standup process',
    category: 'project_management',
    steps: [
      {
        id: 'step-1',
        title: 'What did you accomplish yesterday?',
        description: 'List your completed tasks from yesterday',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] What are good questions for daily standup accomplishments?'
      },
      {
        id: 'step-2',
        title: 'What will you work on today?',
        description: 'List your planned tasks for today',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] What are good questions for daily standup plans?'
      },
      {
        id: 'step-3',
        title: 'Any blockers or impediments?',
        description: 'List any issues blocking your progress',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] What are good questions for identifying blockers in daily standups?'
      }
    ],
    tags: ['standup', 'daily', 'agile'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'template-sprint-planning',
    name: 'Sprint Planning',
    description: 'Organize and plan your sprint with this structured template',
    category: 'project_management',
    steps: [
      {
        id: 'step-1',
        title: 'Review Sprint Goals',
        description: 'Define and document the goals for this sprint',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What are effective sprint goals examples?'
      },
      {
        id: 'step-2',
        title: 'Capacity Planning',
        description: 'Determine team capacity for the sprint',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] How to calculate team capacity for sprint planning?'
      },
      {
        id: 'step-3',
        title: 'Backlog Refinement',
        description: 'Review and refine the backlog items',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What are best practices for backlog refinement?'
      },
      {
        id: 'step-4',
        title: 'Sprint Commitment',
        description: 'Finalize the sprint backlog and commit to deliverables',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] How to make realistic sprint commitments?'
      }
    ],
    tags: ['sprint', 'planning', 'agile'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'template-weekly-status',
    name: 'Weekly Status Report',
    description: 'Generate consistent weekly status reports for stakeholders',
    category: 'project_management',
    steps: [
      {
        id: 'step-1',
        title: 'Accomplishments',
        description: 'List key accomplishments from the past week',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] What should be included in weekly status report accomplishments?'
      },
      {
        id: 'step-2',
        title: 'Upcoming Work',
        description: 'Outline planned work for the next week',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] How to effectively communicate upcoming work in status reports?'
      },
      {
        id: 'step-3',
        title: 'Risks and Issues',
        description: 'Document any risks, issues, or blockers',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] How to identify and communicate project risks in status reports?'
      },
      {
        id: 'step-4',
        title: 'Metrics and KPIs',
        description: 'Report on key metrics and KPIs',
        type: 'update',
        status: 'pending',
        updatePrompt: '[ARCHON] What metrics should be included in project status reports?'
      }
    ],
    tags: ['status', 'weekly', 'report'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'template-feature-development',
    name: 'Feature Development Lifecycle',
    description: 'Guide the development of a new feature from planning to release',
    category: 'development',
    steps: [
      {
        id: 'step-1',
        title: 'Feature Specification',
        description: 'Create detailed specifications for the feature',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What should be included in a feature specification document?'
      },
      {
        id: 'step-2',
        title: 'Design Review',
        description: 'Review and approve the design approach',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What are key questions to ask during a design review?'
      },
      {
        id: 'step-3',
        title: 'Implementation',
        description: 'Develop the feature according to specifications',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What are best practices for feature implementation?'
      },
      {
        id: 'step-4',
        title: 'Testing',
        description: 'Test the feature thoroughly',
        type: 'checklist',
        status: 'pending',
        checklistItems: [
          { id: 'check-1', text: 'Unit tests written and passing', checked: false },
          { id: 'check-2', text: 'Integration tests completed', checked: false },
          { id: 'check-3', text: 'Manual testing performed', checked: false },
          { id: 'check-4', text: 'Edge cases verified', checked: false }
        ],
        updatePrompt: '[ARCHON] What testing strategies should be used for new features?'
      },
      {
        id: 'step-5',
        title: 'Documentation',
        description: 'Create or update documentation for the feature',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What should be included in feature documentation?'
      },
      {
        id: 'step-6',
        title: 'Release',
        description: 'Deploy the feature to production',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What are best practices for feature releases?'
      }
    ],
    tags: ['development', 'feature', 'lifecycle'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'template-bug-triage',
    name: 'Bug Triage Process',
    description: 'Standardized process for triaging and resolving bugs',
    category: 'development',
    steps: [
      {
        id: 'step-1',
        title: 'Bug Verification',
        description: 'Verify the bug and collect necessary information',
        type: 'checklist',
        status: 'pending',
        checklistItems: [
          { id: 'check-1', text: 'Reproduce the bug', checked: false },
          { id: 'check-2', text: 'Document steps to reproduce', checked: false },
          { id: 'check-3', text: 'Capture screenshots/logs', checked: false },
          { id: 'check-4', text: 'Identify affected versions', checked: false }
        ],
        updatePrompt: '[ARCHON] What information should be collected when verifying bugs?'
      },
      {
        id: 'step-2',
        title: 'Impact Assessment',
        description: 'Assess the impact and priority of the bug',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] How to assess bug severity and priority?'
      },
      {
        id: 'step-3',
        title: 'Root Cause Analysis',
        description: 'Identify the root cause of the bug',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What techniques are effective for root cause analysis?'
      },
      {
        id: 'step-4',
        title: 'Fix Implementation',
        description: 'Implement and test the fix',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What are best practices for implementing bug fixes?'
      },
      {
        id: 'step-5',
        title: 'Regression Testing',
        description: 'Perform regression testing to ensure no new issues',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] How to perform effective regression testing?'
      },
      {
        id: 'step-6',
        title: 'Release Planning',
        description: 'Plan the release of the fix',
        type: 'task',
        status: 'pending',
        updatePrompt: '[ARCHON] What factors should be considered when planning bug fix releases?'
      }
    ],
    tags: ['bug', 'triage', 'fix'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  }
];
