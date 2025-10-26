import axios from 'axios';
import { JiraConfig } from './jira';

export interface JiraNotificationConfig {
  webhookUrl: string;
  notificationInterval: number; // in minutes
}

export interface JiraNotification {
  id: string;
  issueKey: string;
  issueTitle: string;
  priority: string;
  status: string;
  assignee: string | null;
  dueDate: string | null;
  issueTags: string[];
  notificationType: 'critical' | 'deadline' | 'update';
  message: string;
  createdAt: string;
}

export class JiraNotificationService {
  private jiraConfig: JiraConfig;
  private notificationConfig: JiraNotificationConfig;
  private auth: {
    username: string;
    password: string;
  };
  private webhookUrl: string;
  private notificationInterval: number;
  private notificationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(jiraConfig: JiraConfig, notificationConfig: JiraNotificationConfig) {
    this.jiraConfig = jiraConfig;
    this.notificationConfig = notificationConfig;
    this.auth = {
      username: jiraConfig.email,
      password: jiraConfig.apiToken,
    };
    this.webhookUrl = notificationConfig.webhookUrl;
    this.notificationInterval = notificationConfig.notificationInterval;
  }

  private getApiUrl(endpoint: string): string {
    const domain = this.jiraConfig.domain.endsWith('/') 
      ? this.jiraConfig.domain 
      : `${this.jiraConfig.domain}/`;
    return `${domain}rest/api/3/${endpoint}`;
  }

  /**
   * Test the Jira notification connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test Jira API connection
      const jiraResponse = await axios.get(this.getApiUrl('myself'), {
        auth: this.auth,
      });
      
      // Test webhook URL (if provided)
      if (this.webhookUrl) {
        try {
          const webhookResponse = await axios.get(this.webhookUrl);
          return jiraResponse.status === 200 && webhookResponse.status === 200;
        } catch (error) {
          console.warn('Webhook URL test failed, but continuing with Jira API connection:', error);
          return jiraResponse.status === 200;
        }
      }
      
      return jiraResponse.status === 200;
    } catch (error) {
      console.error('Failed to connect to Jira notification service:', error);
      return false;
    }
  }

  /**
   * Search for critical issues in Jira
   */
  async searchCriticalIssues(): Promise<any[]> {
    try {
      const jql = 'labels = critical AND resolution = Unresolved';
      const response = await axios.post(
        this.getApiUrl('search'),
        {
          jql,
          fields: ['summary', 'description', 'priority', 'status', 'assignee', 'duedate', 'labels'],
          maxResults: 100
        },
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return (response.data as { issues?: any[] }).issues || [];
    } catch (error) {
      console.error('Failed to search for critical issues:', error);
      return [];
    }
  }

  /**
   * Search for issues with approaching deadlines
   */
  async searchDeadlineIssues(hoursThreshold: number = 48): Promise<any[]> {
    try {
      // Calculate the date threshold
      const now = new Date();
      const thresholdDate = new Date(now.getTime() + (hoursThreshold * 60 * 60 * 1000));
      const formattedDate = thresholdDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const jql = `duedate <= "${formattedDate}" AND duedate >= "${now.toISOString().split('T')[0]}" AND resolution = Unresolved`;
      const response = await axios.post(
        this.getApiUrl('search'),
        {
          jql,
          fields: ['summary', 'description', 'priority', 'status', 'assignee', 'duedate', 'labels'],
          maxResults: 100
        },
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return (response.data as { issues?: any[] }).issues || [];
    } catch (error) {
      console.error('Failed to search for deadline issues:', error);
      return [];
    }
  }

  /**
   * Create a notification for a critical issue
   */
  async createCriticalNotification(issue: any): Promise<JiraNotification | null> {
    try {
      const notification: JiraNotification = {
        id: `critical-${issue.id}-${Date.now()}`,
        issueKey: issue.key,
        issueTitle: issue.fields.summary,
        priority: issue.fields.priority?.name || 'Unknown',
        status: issue.fields.status?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName || null,
        dueDate: issue.fields.duedate || null,
        issueTags: issue.fields.labels || [],
        notificationType: 'critical',
        message: `Critical issue requires attention: ${issue.fields.summary}`,
        createdAt: new Date().toISOString()
      };
      
      // Send notification to webhook if configured
      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Failed to create critical notification:', error);
      return null;
    }
  }

  /**
   * Create a notification for an approaching deadline
   */
  async createDeadlineNotification(issue: any, hoursRemaining: number): Promise<JiraNotification | null> {
    try {
      const notification: JiraNotification = {
        id: `deadline-${issue.id}-${Date.now()}`,
        issueKey: issue.key,
        issueTitle: issue.fields.summary,
        priority: issue.fields.priority?.name || 'Unknown',
        status: issue.fields.status?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName || null,
        dueDate: issue.fields.duedate || null,
        issueTags: issue.fields.labels || [],
        notificationType: 'deadline',
        message: `Deadline approaching in ${hoursRemaining} hours: ${issue.fields.summary}`,
        createdAt: new Date().toISOString()
      };
      
      // Send notification to webhook if configured
      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Failed to create deadline notification:', error);
      return null;
    }
  }

  /**
   * Send a notification via WhatsApp
   */
  async sendWhatsAppNotification(
    notification: JiraNotification, 
    phoneNumber: string,
    whatsAppConfig: {
      apiUrl: string;
      phoneNumberId: string;
      accessToken: string;
    }
  ): Promise<boolean> {
    try {
      const message = `*${notification.notificationType === 'critical' ? 'CRITICAL ISSUE' : 'DEADLINE APPROACHING'}*\n\n` +
        `Issue: ${notification.issueKey} - ${notification.issueTitle}\n` +
        `Priority: ${notification.priority}\n` +
        `Status: ${notification.status}\n` +
        (notification.assignee ? `Assignee: ${notification.assignee}\n` : '') +
        (notification.dueDate ? `Due Date: ${notification.dueDate}\n` : '') +
        `\n${notification.message}`;
      
      const response = await axios.post(
        `${whatsAppConfig.apiUrl}/${whatsAppConfig.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${whatsAppConfig.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      return false;
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.jiraConfig.domain && this.jiraConfig.email && this.jiraConfig.apiToken);
  }

  /**
   * Start monitoring for critical issues
   */
  async startCriticalIssuesMonitoring(
    callback: (notifications: JiraNotification[]) => void
  ): Promise<{ success: boolean; message?: string }> {
    // Check if properly configured
    if (!this.isConfigured()) {
      return { success: false, message: 'Jira notification service is not properly configured. Please check your Jira settings.' };
    }
    
    // Test connection before starting
    const isConnected = await this.testConnection();
    if (!isConnected) {
      return { success: false, message: 'Cannot connect to Jira service. Please check your configuration.' };
    }
    
    // Stop any existing monitoring
    if (this.notificationTimers.has('critical')) {
      clearInterval(this.notificationTimers.get('critical')!);
      this.notificationTimers.delete('critical');
    }
    
    const timerId = setInterval(async () => {
      try {
        const criticalIssues = await this.searchCriticalIssues();
        const notifications: JiraNotification[] = [];
        
        for (const issue of criticalIssues) {
          const notification = await this.createCriticalNotification(issue);
          if (notification) {
            notifications.push(notification);
          }
        }
        
        if (notifications.length > 0) {
          callback(notifications);
        }
      } catch (error) {
        console.error('Error in critical issues monitoring:', error);
      }
    }, this.notificationInterval * 60 * 1000);
    
    this.notificationTimers.set('critical', timerId);
    return { success: true, message: 'Critical issues monitoring started successfully' };
  }

  /**
   * Start monitoring for deadline issues
   */
  async startDeadlineMonitoring(
    callback: (notifications: JiraNotification[]) => void,
    hoursThreshold: number = 48
  ): Promise<{ success: boolean; message?: string }> {
    // Check if properly configured
    if (!this.isConfigured()) {
      return { success: false, message: 'Jira notification service is not properly configured. Please check your Jira settings.' };
    }
    
    // Test connection before starting
    const isConnected = await this.testConnection();
    if (!isConnected) {
      return { success: false, message: 'Cannot connect to Jira service. Please check your configuration.' };
    }
    
    // Stop any existing monitoring
    if (this.notificationTimers.has('deadline')) {
      clearInterval(this.notificationTimers.get('deadline')!);
      this.notificationTimers.delete('deadline');
    }
    
    const timerId = setInterval(async () => {
      try {
        const deadlineIssues = await this.searchDeadlineIssues(hoursThreshold);
        const notifications: JiraNotification[] = [];
        
        for (const issue of deadlineIssues) {
          if (!issue.fields.duedate) continue;
          
          const dueDate = new Date(issue.fields.duedate);
          const now = new Date();
          const hoursRemaining = Math.max(0, (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          // Only notify if within the threshold
          if (hoursRemaining <= hoursThreshold) {
            const notification = await this.createDeadlineNotification(issue, hoursRemaining);
            if (notification) {
              notifications.push(notification);
            }
          }
        }
        
        if (notifications.length > 0) {
          callback(notifications);
        }
      } catch (error) {
        console.error('Error in deadline monitoring:', error);
      }
    }, this.notificationInterval * 60 * 1000);
    
    this.notificationTimers.set('deadline', timerId);
    return { success: true, message: 'Deadline monitoring started successfully' };
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    // Use forEach instead of for...of to avoid downlevelIteration issues
    this.notificationTimers.forEach((timerId, key) => {
      clearInterval(timerId);
      this.notificationTimers.delete(key);
    });
  }
}

// Helper function to create a Jira notification service from stored config
export const createJiraNotificationService = async (
  jiraConfig: JiraConfig
): Promise<JiraNotificationService | null> => {
  try {
    const notificationConfig: JiraNotificationConfig = {
      webhookUrl: process.env.REACT_APP_JIRA_WEBHOOK_URL || '',
      notificationInterval: parseInt(process.env.REACT_APP_JIRA_NOTIFICATION_INTERVAL || '15')
    };
    
    const service = new JiraNotificationService(jiraConfig, notificationConfig);
    const isConnected = await service.testConnection();
    
    if (isConnected) {
      return service;
    }
    return null;
  } catch (error) {
    console.error('Failed to create Jira notification service:', error);
    return null;
  }
};
