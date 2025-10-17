import axios from 'axios';
import { JiraConfig } from './jira';

export interface ContractorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  team?: string;
  startDate?: string;
  hourlyRate?: number;
  skills?: string[];
  avatar?: string;
}

export interface TimeTrackingData {
  originalEstimate: number; // in seconds
  timeSpent: number; // in seconds
  remainingEstimate: number; // in seconds
}

export interface TaskMetrics {
  taskId: string;
  taskKey: string;
  summary: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  resolved?: string;
  dueDate?: string;
  timeTracking: TimeTrackingData;
  storyPoints?: number;
  labels: string[];
  projectKey: string;
  projectName: string;
  issueType: string;
  assignee: string;
  reporter: string;
  components: string[];
  sprints?: string[];
  epicLink?: string;
  epicName?: string;
}

export interface ContractorMetrics {
  contractor: ContractorProfile;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    tasksCreated: number;
    tasksResolved: number;
    totalTimeSpent: number; // in seconds
    totalTimeEstimated: number; // in seconds
    totalStoryPoints?: number;
    completedStoryPoints?: number;
    avgTimePerTask: number; // in seconds
    avgTimePerStoryPoint?: number; // in seconds
    onTimeDelivery: number; // percentage
    qualityScore: number; // percentage based on reopened issues, bugs, etc.
    velocityTrend: number[]; // array of velocity over time
    productivityScore: number; // calculated score based on multiple factors
  };
  taskBreakdown: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    byProject: Record<string, number>;
  };
  timeTracking: {
    estimateAccuracy: number; // percentage
    timeSpentByDay: Record<string, number>; // date string -> seconds
    timeSpentByProject: Record<string, number>; // project key -> seconds
    timeSpentByTaskType: Record<string, number>; // issue type -> seconds
  };
  quality: {
    bugsIntroduced: number;
    bugsFixed: number;
    reopenedTasks: number;
    codeReviewFeedback?: Record<string, number>; // category -> count
    testCoverage?: number; // percentage if available
  };
  tasks: TaskMetrics[];
}

export interface MetricsFilter {
  startDate?: string;
  endDate?: string;
  projects?: string[];
  issueTypes?: string[];
  statuses?: string[];
  priorities?: string[];
  labels?: string[];
  components?: string[];
  sprints?: string[];
  epics?: string[];
}

export class ContractorMetricsService {
  private jiraConfig: JiraConfig;
  private auth: {
    username: string;
    password: string;
  };

  constructor(jiraConfig: JiraConfig) {
    this.jiraConfig = jiraConfig;
    this.auth = {
      username: jiraConfig.email,
      password: jiraConfig.apiToken,
    };
  }

  private getApiUrl(endpoint: string): string {
    const domain = this.jiraConfig.domain.endsWith('/') 
      ? this.jiraConfig.domain 
      : `${this.jiraConfig.domain}/`;
    return `${domain}rest/api/3/${endpoint}`;
  }

  /**
   * Test the Jira connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(this.getApiUrl('myself'), {
        auth: this.auth,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Jira:', error);
      return false;
    }
  }

  /**
   * Get all contractors (users with specific roles or custom field values)
   */
  async getContractors(): Promise<ContractorProfile[]> {
    try {
      // This is a simplified approach. In a real implementation, you might:
      // 1. Use Jira's user search API to find users
      // 2. Filter by a custom field that identifies contractors
      // 3. Or use a specific user group that contains contractors
      
      // For this example, we'll just get all users and assume they're contractors
      const response = await axios.get(
        this.getApiUrl('users/search'),
        {
          auth: this.auth,
          params: {
            maxResults: 100,
          },
        }
      );
      
      return ((response.data as any[]) || []).map((user: any) => ({
        id: user.accountId,
        name: user.displayName,
        email: user.emailAddress,
        role: 'Contractor', // This would come from a custom field or group membership in a real implementation
        avatar: user.avatarUrls['48x48'],
      }));
    } catch (error) {
      console.error('Failed to get contractors:', error);
      return [];
    }
  }

  /**
   * Get contractor profile by ID
   */
  async getContractorProfile(contractorId: string): Promise<ContractorProfile | null> {
    try {
      const response = await axios.get(
        this.getApiUrl(`user?accountId=${contractorId}`),
        {
          auth: this.auth,
        }
      );
      
      interface JiraUser {
        accountId: string;
        displayName: string;
        emailAddress: string;
        avatarUrls: {
          [key: string]: string;
        };
      }
      
      const user = response.data as JiraUser;
      
      // In a real implementation, you would fetch additional contractor details
      // from custom fields or external systems
      return {
        id: user.accountId,
        name: user.displayName,
        email: user.emailAddress,
        role: 'Contractor',
        avatar: user.avatarUrls['48x48'],
      };
    } catch (error) {
      console.error(`Failed to get contractor profile for ${contractorId}:`, error);
      return null;
    }
  }

  /**
   * Get tasks assigned to a contractor within a time period
   */
  async getContractorTasks(
    contractorId: string,
    filter: MetricsFilter = {}
  ): Promise<TaskMetrics[]> {
    try {
      // Build JQL query
      let jql = `assignee = ${contractorId}`;
      
      if (filter.startDate) {
        jql += ` AND updated >= "${filter.startDate}"`;
      }
      
      if (filter.endDate) {
        jql += ` AND updated <= "${filter.endDate}"`;
      }
      
      if (filter.projects && filter.projects.length > 0) {
        jql += ` AND project IN (${filter.projects.map(p => `"${p}"`).join(',')})`;
      }
      
      if (filter.issueTypes && filter.issueTypes.length > 0) {
        jql += ` AND issuetype IN (${filter.issueTypes.map(t => `"${t}"`).join(',')})`;
      }
      
      if (filter.statuses && filter.statuses.length > 0) {
        jql += ` AND status IN (${filter.statuses.map(s => `"${s}"`).join(',')})`;
      }
      
      if (filter.priorities && filter.priorities.length > 0) {
        jql += ` AND priority IN (${filter.priorities.map(p => `"${p}"`).join(',')})`;
      }
      
      if (filter.labels && filter.labels.length > 0) {
        jql += ` AND labels IN (${filter.labels.map(l => `"${l}"`).join(',')})`;
      }
      
      if (filter.components && filter.components.length > 0) {
        jql += ` AND component IN (${filter.components.map(c => `"${c}"`).join(',')})`;
      }
      
      if (filter.sprints && filter.sprints.length > 0) {
        jql += ` AND sprint IN (${filter.sprints.join(',')})`;
      }
      
      if (filter.epics && filter.epics.length > 0) {
        jql += ` AND "Epic Link" IN (${filter.epics.map(e => `"${e}"`).join(',')})`;
      }
      
      const response = await axios.post(
        this.getApiUrl('search'),
        {
          jql,
          fields: [
            'summary',
            'status',
            'priority',
            'created',
            'updated',
            'resolutiondate',
            'duedate',
            'timetracking',
            'customfield_10002', // Assuming this is the Story Points field
            'labels',
            'project',
            'issuetype',
            'assignee',
            'reporter',
            'components',
            'customfield_10001', // Assuming this is the Sprint field
            'customfield_10000', // Assuming this is the Epic Link field
            'parent'
          ],
          maxResults: 100,
        },
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return ((response.data as { issues: any[] }).issues || []).map((issue: any) => {
        const fields = issue.fields;
        
        return {
          taskId: issue.id,
          taskKey: issue.key,
          summary: fields.summary,
          status: fields.status?.name || 'Unknown',
          priority: fields.priority?.name || 'Unknown',
          created: fields.created,
          updated: fields.updated,
          resolved: fields.resolutiondate,
          dueDate: fields.duedate,
          timeTracking: {
            originalEstimate: this.parseTimeString(fields.timetracking?.originalEstimate),
            timeSpent: this.parseTimeString(fields.timetracking?.timeSpent),
            remainingEstimate: this.parseTimeString(fields.timetracking?.remainingEstimate),
          },
          storyPoints: fields.customfield_10002, // Story Points
          labels: fields.labels || [],
          projectKey: fields.project?.key,
          projectName: fields.project?.name,
          issueType: fields.issuetype?.name,
          assignee: fields.assignee?.displayName,
          reporter: fields.reporter?.displayName,
          components: (fields.components || []).map((c: any) => c.name),
          sprints: fields.customfield_10001, // Sprint
          epicLink: fields.customfield_10000, // Epic Link
          epicName: fields.parent?.fields?.summary, // If the issue is in an epic, this would be the epic's name
        };
      });
    } catch (error) {
      console.error(`Failed to get tasks for contractor ${contractorId}:`, error);
      return [];
    }
  }

  /**
   * Calculate contractor metrics based on their tasks
   */
  async calculateContractorMetrics(
    contractorId: string,
    filter: MetricsFilter = {}
  ): Promise<ContractorMetrics | null> {
    try {
      // Get contractor profile
      const contractor = await this.getContractorProfile(contractorId);
      if (!contractor) {
        return null;
      }
      
      // Get contractor tasks
      const tasks = await this.getContractorTasks(contractorId, filter);
      if (tasks.length === 0) {
        return null;
      }
      
      // Default period if not specified
      const period = {
        startDate: filter.startDate || this.getDefaultStartDate(),
        endDate: filter.endDate || new Date().toISOString(),
      };
      
      // Calculate metrics
      const completedTasks = tasks.filter(task => 
        task.status === 'Done' || task.status === 'Closed' || task.status === 'Resolved'
      );
      
      const inProgressTasks = tasks.filter(task => 
        task.status === 'In Progress' || task.status === 'In Review'
      );
      
      const blockedTasks = tasks.filter(task => 
        task.status === 'Blocked' || task.labels.includes('blocked')
      );
      
      const tasksCreatedInPeriod = tasks.filter(task => 
        this.isDateInRange(task.created, period.startDate, period.endDate)
      );
      
      const tasksResolvedInPeriod = tasks.filter(task => 
        task.resolved && this.isDateInRange(task.resolved, period.startDate, period.endDate)
      );
      
      // Calculate time metrics
      const totalTimeSpent = tasks.reduce((sum, task) => sum + task.timeTracking.timeSpent, 0);
      const totalTimeEstimated = tasks.reduce((sum, task) => sum + task.timeTracking.originalEstimate, 0);
      
      // Calculate story points metrics if available
      const tasksWithStoryPoints = tasks.filter(task => task.storyPoints !== undefined);
      const totalStoryPoints = tasksWithStoryPoints.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      
      const completedTasksWithStoryPoints = completedTasks.filter(task => task.storyPoints !== undefined);
      const completedStoryPoints = completedTasksWithStoryPoints.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      
      // Calculate on-time delivery
      const tasksWithDueDate = tasks.filter(task => task.dueDate && task.resolved);
      const onTimeDeliveredTasks = tasksWithDueDate.filter(task => 
        new Date(task.resolved!) <= new Date(task.dueDate!)
      );
      const onTimeDelivery = tasksWithDueDate.length > 0 
        ? (onTimeDeliveredTasks.length / tasksWithDueDate.length) * 100 
        : 100;
      
      // Calculate quality metrics
      const bugsIntroduced = 0; // This would require additional logic to determine bugs linked to the contractor's work
      const bugsFixed = tasks.filter(task => 
        task.issueType === 'Bug' && 
        (task.status === 'Done' || task.status === 'Closed' || task.status === 'Resolved')
      ).length;
      
      const reopenedTasks = 0; // This would require additional logic to track reopened issues
      
      // Calculate task breakdown
      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const byProject: Record<string, number> = {};
      
      tasks.forEach(task => {
        // By status
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
        
        // By priority
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
        
        // By type
        byType[task.issueType] = (byType[task.issueType] || 0) + 1;
        
        // By project
        byProject[task.projectKey] = (byProject[task.projectKey] || 0) + 1;
      });
      
      // Calculate time tracking metrics
      const estimateAccuracy = totalTimeEstimated > 0 
        ? Math.min(100, (totalTimeEstimated / Math.max(1, totalTimeSpent)) * 100)
        : 0;
      
      const timeSpentByDay: Record<string, number> = {};
      const timeSpentByProject: Record<string, number> = {};
      const timeSpentByTaskType: Record<string, number> = {};
      
      tasks.forEach(task => {
        if (task.timeTracking.timeSpent > 0) {
          // By project
          timeSpentByProject[task.projectKey] = (timeSpentByProject[task.projectKey] || 0) + task.timeTracking.timeSpent;
          
          // By task type
          timeSpentByTaskType[task.issueType] = (timeSpentByTaskType[task.issueType] || 0) + task.timeTracking.timeSpent;
        }
      });
      
      // Calculate productivity score (simplified)
      const productivityScore = this.calculateProductivityScore({
        completedTasks: completedTasks.length,
        totalTasks: tasks.length,
        onTimeDelivery,
        estimateAccuracy,
        timeSpent: totalTimeSpent,
        timeEstimated: totalTimeEstimated,
        storyPoints: totalStoryPoints,
      });
      
      // Calculate velocity trend (simplified)
      const velocityTrend = this.calculateVelocityTrend(tasks, period);
      
      return {
        contractor,
        period,
        summary: {
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          blockedTasks: blockedTasks.length,
          tasksCreated: tasksCreatedInPeriod.length,
          tasksResolved: tasksResolvedInPeriod.length,
          totalTimeSpent,
          totalTimeEstimated,
          totalStoryPoints: tasksWithStoryPoints.length > 0 ? totalStoryPoints : undefined,
          completedStoryPoints: completedTasksWithStoryPoints.length > 0 ? completedStoryPoints : undefined,
          avgTimePerTask: tasks.length > 0 ? totalTimeSpent / tasks.length : 0,
          avgTimePerStoryPoint: totalStoryPoints > 0 ? totalTimeSpent / totalStoryPoints : undefined,
          onTimeDelivery,
          qualityScore: this.calculateQualityScore(tasks),
          velocityTrend,
          productivityScore,
        },
        taskBreakdown: {
          byStatus,
          byPriority,
          byType,
          byProject,
        },
        timeTracking: {
          estimateAccuracy,
          timeSpentByDay,
          timeSpentByProject,
          timeSpentByTaskType,
        },
        quality: {
          bugsIntroduced,
          bugsFixed,
          reopenedTasks,
        },
        tasks,
      };
    } catch (error) {
      console.error(`Failed to calculate metrics for contractor ${contractorId}:`, error);
      return null;
    }
  }

  /**
   * Get metrics for all contractors
   */
  async getAllContractorMetrics(filter: MetricsFilter = {}): Promise<ContractorMetrics[]> {
    try {
      const contractors = await this.getContractors();
      const metrics: ContractorMetrics[] = [];
      
      for (const contractor of contractors) {
        const contractorMetrics = await this.calculateContractorMetrics(contractor.id, filter);
        if (contractorMetrics) {
          metrics.push(contractorMetrics);
        }
      }
      
      return metrics;
    } catch (error) {
      console.error('Failed to get all contractor metrics:', error);
      return [];
    }
  }

  /**
   * Helper method to parse Jira time strings (e.g., "1w 2d 3h 4m") to seconds
   */
  private parseTimeString(timeString?: string): number {
    if (!timeString) return 0;
    
    let totalSeconds = 0;
    
    // Extract weeks
    const weeksMatch = timeString.match(/(\d+)w/);
    if (weeksMatch) {
      totalSeconds += parseInt(weeksMatch[1]) * 5 * 8 * 3600; // 5 days per week, 8 hours per day
    }
    
    // Extract days
    const daysMatch = timeString.match(/(\d+)d/);
    if (daysMatch) {
      totalSeconds += parseInt(daysMatch[1]) * 8 * 3600; // 8 hours per day
    }
    
    // Extract hours
    const hoursMatch = timeString.match(/(\d+)h/);
    if (hoursMatch) {
      totalSeconds += parseInt(hoursMatch[1]) * 3600;
    }
    
    // Extract minutes
    const minutesMatch = timeString.match(/(\d+)m/);
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60;
    }
    
    return totalSeconds;
  }

  /**
   * Helper method to check if a date is within a range
   */
  private isDateInRange(dateString: string, startDate: string, endDate: string): boolean {
    const date = new Date(dateString);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return date >= start && date <= end;
  }

  /**
   * Helper method to get default start date (30 days ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  /**
   * Calculate productivity score based on various metrics
   */
  private calculateProductivityScore(metrics: {
    completedTasks: number;
    totalTasks: number;
    onTimeDelivery: number;
    estimateAccuracy: number;
    timeSpent: number;
    timeEstimated: number;
    storyPoints?: number;
  }): number {
    // This is a simplified scoring algorithm
    // In a real implementation, you would use a more sophisticated approach
    
    const completionRate = metrics.totalTasks > 0 ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0;
    
    // Weight each factor
    const weights = {
      completionRate: 0.3,
      onTimeDelivery: 0.3,
      estimateAccuracy: 0.4,
    };
    
    // Calculate weighted score
    const score = (
      (completionRate * weights.completionRate) +
      (metrics.onTimeDelivery * weights.onTimeDelivery) +
      (metrics.estimateAccuracy * weights.estimateAccuracy)
    );
    
    // Normalize to 0-100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate quality score based on task metrics
   */
  private calculateQualityScore(tasks: TaskMetrics[]): number {
    // This is a simplified scoring algorithm
    // In a real implementation, you would use a more sophisticated approach
    
    const completedTasks = tasks.filter(task => 
      task.status === 'Done' || task.status === 'Closed' || task.status === 'Resolved'
    );
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    // For this example, we'll use a simple score based on on-time delivery
    const tasksWithDueDate = completedTasks.filter(task => task.dueDate && task.resolved);
    const onTimeDeliveredTasks = tasksWithDueDate.filter(task => 
      new Date(task.resolved!) <= new Date(task.dueDate!)
    );
    
    const onTimeDelivery = tasksWithDueDate.length > 0 
      ? (onTimeDeliveredTasks.length / tasksWithDueDate.length) * 100 
      : 100;
    
    // In a real implementation, you would factor in:
    // - Code review feedback
    // - Bug rate
    // - Test coverage
    // - Customer satisfaction
    // - etc.
    
    return onTimeDelivery;
  }

  /**
   * Calculate velocity trend over time
   */
  private calculateVelocityTrend(tasks: TaskMetrics[], period: { startDate: string; endDate: string }): number[] {
    // This is a simplified approach
    // In a real implementation, you would calculate velocity per sprint or week
    
    // For this example, we'll divide the period into 5 equal segments
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const segmentDays = Math.ceil(totalDays / 5);
    
    const velocityTrend: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const segmentStartDate = new Date(startDate);
      segmentStartDate.setDate(startDate.getDate() + (i * segmentDays));
      
      const segmentEndDate = new Date(segmentStartDate);
      segmentEndDate.setDate(segmentStartDate.getDate() + segmentDays);
      
      // Count completed tasks in this segment
      const completedTasksInSegment = tasks.filter(task => 
        task.resolved && 
        this.isDateInRange(
          task.resolved,
          segmentStartDate.toISOString(),
          segmentEndDate.toISOString()
        )
      );
      
      // Calculate velocity (completed tasks per segment)
      velocityTrend.push(completedTasksInSegment.length);
    }
    
    return velocityTrend;
  }
}

// Helper function to create a ContractorMetricsService from stored config
export const createContractorMetricsService = async (
  jiraConfig: JiraConfig
): Promise<ContractorMetricsService | null> => {
  try {
    const service = new ContractorMetricsService(jiraConfig);
    const isConnected = await service.testConnection();
    
    if (isConnected) {
      return service;
    }
    return null;
  } catch (error) {
    console.error('Failed to create ContractorMetricsService:', error);
    return null;
  }
};
