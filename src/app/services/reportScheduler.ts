import { JiraConfig } from './jira';
import { ReportGeneratorService, ReportConfig, ReportData } from './reportGenerator';
import { EmailDeliveryService, EmailRecipient, EmailDeliveryResult } from './emailDelivery';

export interface ReportScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM in 24-hour format
  days: string[]; // Days of week for weekly reports, or days of month for monthly
  timezone: string;
}

export interface ReportDeliveryConfig {
  recipients: EmailRecipient[];
  ccRecipients?: EmailRecipient[];
  bccRecipients?: EmailRecipient[];
  includeHtml: boolean;
  includeText: boolean;
  customSubject?: string;
  customMessage?: string;
}

export interface ScheduledReportConfig {
  id: string;
  name: string;
  description: string;
  reportConfig: ReportConfig;
  scheduleConfig: ReportScheduleConfig;
  deliveryConfig: ReportDeliveryConfig;
  enabled: boolean;
  lastRun?: {
    timestamp: string;
    success: boolean;
    error?: string;
  };
}

export interface ReportRunResult {
  id: string;
  scheduledReportId: string;
  timestamp: string;
  report: ReportData;
  delivery: {
    success: boolean;
    recipients: string[];
    error?: string;
  };
}

export class ReportSchedulerService {
  private jiraConfig: JiraConfig;
  private reportGenerator: ReportGeneratorService;
  private emailDelivery: EmailDeliveryService;
  private scheduledReports: ScheduledReportConfig[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private runHistory: ReportRunResult[] = [];

  constructor(
    jiraConfig: JiraConfig,
    reportGenerator: ReportGeneratorService,
    emailDelivery: EmailDeliveryService
  ) {
    this.jiraConfig = jiraConfig;
    this.reportGenerator = reportGenerator;
    this.emailDelivery = emailDelivery;
  }

  /**
   * Load scheduled reports from storage
   */
  loadScheduledReports(): void {
    try {
      const savedReports = localStorage.getItem('scheduled-reports');
      if (savedReports) {
        this.scheduledReports = JSON.parse(savedReports);
      }
    } catch (error) {
      console.error('Failed to load scheduled reports:', error);
    }
  }

  /**
   * Save scheduled reports to storage
   */
  saveScheduledReports(): void {
    try {
      localStorage.setItem('scheduled-reports', JSON.stringify(this.scheduledReports));
    } catch (error) {
      console.error('Failed to save scheduled reports:', error);
    }
  }

  /**
   * Get all scheduled reports
   */
  getScheduledReports(): ScheduledReportConfig[] {
    return [...this.scheduledReports];
  }

  /**
   * Get a specific scheduled report by ID
   */
  getScheduledReport(id: string): ScheduledReportConfig | undefined {
    return this.scheduledReports.find(report => report.id === id);
  }

  /**
   * Add a new scheduled report
   */
  addScheduledReport(config: Omit<ScheduledReportConfig, 'id'>): ScheduledReportConfig {
    const id = `report-${Date.now()}`;
    const newReport: ScheduledReportConfig = {
      ...config,
      id,
    };
    
    this.scheduledReports.push(newReport);
    this.saveScheduledReports();
    
    if (newReport.enabled) {
      this.scheduleReport(newReport);
    }
    
    return newReport;
  }

  /**
   * Update an existing scheduled report
   */
  updateScheduledReport(id: string, config: Partial<ScheduledReportConfig>): ScheduledReportConfig | null {
    const index = this.scheduledReports.findIndex(report => report.id === id);
    if (index === -1) {
      return null;
    }
    
    // Stop existing schedule if it exists
    this.unscheduleReport(id);
    
    // Update the report
    const updatedReport: ScheduledReportConfig = {
      ...this.scheduledReports[index],
      ...config,
    };
    
    this.scheduledReports[index] = updatedReport;
    this.saveScheduledReports();
    
    // Reschedule if enabled
    if (updatedReport.enabled) {
      this.scheduleReport(updatedReport);
    }
    
    return updatedReport;
  }

  /**
   * Delete a scheduled report
   */
  deleteScheduledReport(id: string): boolean {
    const index = this.scheduledReports.findIndex(report => report.id === id);
    if (index === -1) {
      return false;
    }
    
    // Stop existing schedule
    this.unscheduleReport(id);
    
    // Remove from the list
    this.scheduledReports.splice(index, 1);
    this.saveScheduledReports();
    
    return true;
  }

  /**
   * Schedule a report based on its configuration
   */
  private scheduleReport(report: ScheduledReportConfig): void {
    // Unschedule any existing timer
    this.unscheduleReport(report.id);
    
    // Calculate the next run time
    const nextRunTime = this.calculateNextRunTime(report.scheduleConfig);
    if (!nextRunTime) {
      console.error(`Invalid schedule configuration for report ${report.id}`);
      return;
    }
    
    // Calculate delay until next run
    const now = new Date();
    const delay = nextRunTime.getTime() - now.getTime();
    
    if (delay < 0) {
      console.error(`Next run time is in the past for report ${report.id}`);
      return;
    }
    
    // Schedule the report
    const timer = setTimeout(async () => {
      await this.runReport(report);
      
      // Reschedule for the next run
      this.scheduleReport(report);
    }, delay);
    
    this.timers.set(report.id, timer);
    
    console.log(`Scheduled report ${report.id} to run at ${nextRunTime.toLocaleString()}`);
  }

  /**
   * Unschedule a report
   */
  private unscheduleReport(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
      console.log(`Unscheduled report ${id}`);
    }
  }

  /**
   * Calculate the next run time for a report based on its schedule
   */
  private calculateNextRunTime(schedule: ReportScheduleConfig): Date | null {
    if (!schedule.enabled) {
      return null;
    }
    
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    const targetDate = new Date(now);
    targetDate.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, move to the next occurrence
    if (targetDate <= now) {
      switch (schedule.frequency) {
        case 'daily':
          // Move to tomorrow
          targetDate.setDate(targetDate.getDate() + 1);
          break;
        
        case 'weekly': {
          // Find the next day of the week that matches
          const currentDay = now.getDay().toString();
          const nextDays = schedule.days.filter(day => parseInt(day) > parseInt(currentDay));
          
          if (nextDays.length > 0) {
            // There's a day later this week
            const daysToAdd = parseInt(nextDays[0]) - parseInt(currentDay);
            targetDate.setDate(targetDate.getDate() + daysToAdd);
          } else {
            // Move to the first day next week
            const firstDayNextWeek = Math.min(...schedule.days.map(day => parseInt(day)));
            const daysToAdd = 7 - parseInt(currentDay) + firstDayNextWeek;
            targetDate.setDate(targetDate.getDate() + daysToAdd);
          }
          break;
        }
        
        case 'monthly': {
          // Find the next day of the month that matches
          const currentDate = now.getDate().toString();
          const nextDates = schedule.days.filter(day => parseInt(day) > parseInt(currentDate));
          
          if (nextDates.length > 0) {
            // There's a day later this month
            targetDate.setDate(parseInt(nextDates[0]));
          } else {
            // Move to the first day next month
            const firstDayNextMonth = Math.min(...schedule.days.map(day => parseInt(day)));
            targetDate.setMonth(targetDate.getMonth() + 1);
            targetDate.setDate(firstDayNextMonth);
          }
          break;
        }
      }
    }
    
    return targetDate;
  }

  /**
   * Run a scheduled report immediately
   */
  async runReport(report: ScheduledReportConfig): Promise<ReportRunResult> {
    console.log(`Running report ${report.id}: ${report.name}`);
    
    const runId = `run-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    try {
      // Generate the report
      const reportData = await this.reportGenerator.generateReport(report.reportConfig);
      
      // Send the report via email
      const deliveryResult = await this.emailDelivery.sendReport(
        reportData,
        report.deliveryConfig.recipients,
        {
          ccRecipients: report.deliveryConfig.ccRecipients,
          bccRecipients: report.deliveryConfig.bccRecipients,
          includeHtmlVersion: report.deliveryConfig.includeHtml,
          includeTextVersion: report.deliveryConfig.includeText,
          customSubject: report.deliveryConfig.customSubject,
          customMessage: report.deliveryConfig.customMessage,
        }
      );
      
      // Update the last run information
      const updatedReport = {
        ...report,
        lastRun: {
          timestamp,
          success: deliveryResult.success,
          error: deliveryResult.error,
        },
      };
      
      this.updateScheduledReport(report.id, updatedReport);
      
      // Create run result
      const runResult: ReportRunResult = {
        id: runId,
        scheduledReportId: report.id,
        timestamp,
        report: reportData,
        delivery: {
          success: deliveryResult.success,
          recipients: report.deliveryConfig.recipients.map(r => r.email),
          error: deliveryResult.error,
        },
      };
      
      // Add to history
      this.runHistory.unshift(runResult);
      
      // Keep only the last 50 runs
      if (this.runHistory.length > 50) {
        this.runHistory = this.runHistory.slice(0, 50);
      }
      
      console.log(`Report ${report.id} completed successfully`);
      
      return runResult;
    } catch (error) {
      console.error(`Failed to run report ${report.id}:`, error);
      
      // Update the last run information
      const updatedReport = {
        ...report,
        lastRun: {
          timestamp,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      };
      
      this.updateScheduledReport(report.id, updatedReport);
      
      // Create run result
      const runResult: ReportRunResult = {
        id: runId,
        scheduledReportId: report.id,
        timestamp,
        report: {
          id: '',
          title: report.name,
          description: report.description,
          generatedAt: timestamp,
          sections: [],
          metrics: null,
          summary: null,
        },
        delivery: {
          success: false,
          recipients: [],
          error: error instanceof Error ? error.message : String(error),
        },
      };
      
      // Add to history
      this.runHistory.unshift(runResult);
      
      return runResult;
    }
  }

  /**
   * Get the run history
   */
  getRunHistory(): ReportRunResult[] {
    return [...this.runHistory];
  }

  /**
   * Start all scheduled reports
   */
  async startAll(): Promise<{ success: boolean; message?: string }> {
    // Stop any existing schedules
    this.stopAll();
    
    // Check if services are properly configured and connected
    try {
      // Test Jira connection
      const jiraConnected = await this.reportGenerator.testConnection();
      if (!jiraConnected) {
        return { success: false, message: 'Cannot connect to Jira service. Please check your configuration.' };
      }
      
      // Test email delivery service
      const emailConfigured = this.emailDelivery.isConfigured();
      if (!emailConfigured) {
        return { success: false, message: 'Email delivery service is not properly configured. Please check your email settings.' };
      }
      
      // Schedule all enabled reports
      let scheduledCount = 0;
      for (const report of this.scheduledReports) {
        if (report.enabled) {
          this.scheduleReport(report);
          scheduledCount++;
        }
      }
      
      if (scheduledCount === 0) {
        return { success: true, message: 'No reports are currently enabled for scheduling.' };
      }
      
      return { success: true, message: `${scheduledCount} report(s) scheduled successfully.` };
    } catch (error) {
      console.error('Error starting scheduled reports:', error);
      return { success: false, message: `Error starting scheduled reports: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Stop all scheduled reports
   */
  stopAll(): void {
    for (const id of this.timers.keys()) {
      this.unscheduleReport(id);
    }
  }

  /**
   * Create a default daily CEO report configuration
   */
  createDefaultCEOReport(
    ceoEmail: string, 
    ceoName: string, 
    pmEmail: string, 
    pmName: string
  ): ScheduledReportConfig {
    const reportConfig: ReportConfig = {
      title: 'Daily CEO Report',
      description: 'Daily summary of project status and tasks',
      jqlQueries: [
        {
          name: 'Critical Issues',
          query: 'priority = Highest AND resolution = Unresolved',
          limit: 10,
        },
        {
          name: 'Recent Updates',
          query: 'updated >= -1d',
          limit: 20,
        },
        {
          name: 'Approaching Deadlines',
          query: 'duedate >= now() AND duedate <= 7d',
          limit: 15,
        },
        {
          name: 'Recently Completed',
          query: 'status = Done AND updated >= -1d',
          limit: 10,
        },
      ],
      includeMetrics: true,
      includeCharts: true,
      includeSummary: true,
    };
    
    const scheduleConfig: ReportScheduleConfig = {
      enabled: true,
      frequency: 'daily',
      time: '08:00', // 8:00 AM
      days: ['1', '2', '3', '4', '5'], // Monday to Friday
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    const deliveryConfig: ReportDeliveryConfig = {
      recipients: [
        {
          id: `recipient-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          email: ceoEmail,
          name: ceoName,
          role: 'CEO',
        },
      ],
      ccRecipients: [
        {
          id: `recipient-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          email: pmEmail,
          name: pmName,
          role: 'Project Manager',
        },
      ],
      includeHtml: true,
      includeText: true,
      customSubject: 'Daily CEO Report - [DATE]',
      customMessage: 'Please find attached the daily project status report.',
    };
    
    return this.addScheduledReport({
      name: 'Daily CEO Report',
      description: 'Automated daily report of project status for the CEO',
      reportConfig,
      scheduleConfig,
      deliveryConfig,
      enabled: true,
    });
  }
}

// Helper function to create a ReportSchedulerService
export const createReportSchedulerService = async (
  jiraConfig: JiraConfig
): Promise<ReportSchedulerService | null> => {
  try {
    // Create report generator
    const reportGeneratorModule = await import('./reportGenerator');
    const reportGenerator = await reportGeneratorModule.createReportGeneratorService(jiraConfig);
    
    if (!reportGenerator) {
      console.error('Failed to create report generator service');
      return null;
    }
    
    // Create email delivery service
    const emailDeliveryModule = await import('./emailDelivery');
    const emailDelivery = emailDeliveryModule.createEmailDeliveryService();
    
    // Create scheduler service
    const scheduler = new ReportSchedulerService(
      jiraConfig,
      reportGenerator,
      emailDelivery
    );
    
    // Load existing scheduled reports
    scheduler.loadScheduledReports();
    
    // Don't automatically start reports - require explicit start after checking configuration
    // This ensures reports only run when properly configured and connected
    
    return scheduler;
  } catch (error) {
    console.error('Failed to create report scheduler service:', error);
    return null;
  }
};
