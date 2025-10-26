import { GmailService, GmailConfig, GmailEmail } from './gmail';
import { ArchonService, ArchonDocument } from './archon';

export interface EmailArchonAutomationConfig {
  checkInterval: number; // in minutes
  maxEmailsToProcess: number;
  labelProcessedEmails: boolean;
  processedLabel: string;
  searchQuery: string;
  enabled: boolean;
  includeAttachments: boolean;
  archonTags: string[]; // Tags to add to stored emails
}

export interface EmailAutomationRun {
  id: string;
  startTime: string;
  endTime?: string;
  emailsProcessed: number;
  errors: string[];
  status: 'running' | 'completed' | 'failed';
  details: {
    processedEmails: {
      id: string;
      subject: string;
      from: string;
      archonId?: string;
      error?: string;
    }[];
  };
}

export class EmailArchonAutomationService {
  private gmailService: GmailService;
  private archonService: ArchonService;
  private config: EmailArchonAutomationConfig;
  private timerId: NodeJS.Timeout | null = null;
  private currentRun: EmailAutomationRun | null = null;
  private runHistory: EmailAutomationRun[] = [];

  constructor(
    gmailService: GmailService,
    archonService: ArchonService,
    config: EmailArchonAutomationConfig
  ) {
    this.gmailService = gmailService;
    this.archonService = archonService;
    this.config = config;
  }

  /**
   * Start the automation
   */
  async start(): Promise<{ success: boolean; message?: string }> {
    if (this.timerId) {
      return { success: false, message: 'Automation is already running' };
    }

    if (!this.config.enabled) {
      return { success: false, message: 'Automation is not enabled in configuration' };
    }
    
    // Check if all required services are properly configured and can connect
    try {
      // Test Gmail connection
      const gmailConnected = await this.gmailService.testConnection();
      if (!gmailConnected) {
        return { success: false, message: 'Cannot connect to Gmail service. Please check your configuration.' };
      }
      
      // Test Archon connection
      const archonConnected = await this.archonService.testConnection();
      if (!archonConnected) {
        return { success: false, message: 'Cannot connect to Archon service. Please check your configuration.' };
      }
      
      // All checks passed, start the automation
      await this.runAutomation();
      
      this.timerId = setInterval(() => {
        this.runAutomation();
      }, this.config.checkInterval * 60 * 1000);
      
      return { success: true, message: 'Email to Archon automation started successfully' };
    } catch (error) {
      console.error('Error starting automation:', error);
      return { success: false, message: `Error starting automation: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Stop the automation
   */
  stop(): boolean {
    if (!this.timerId) {
      return false; // Not running
    }

    clearInterval(this.timerId);
    this.timerId = null;
    
    return true;
  }

  /**
   * Check if the automation is running
   */
  isRunning(): boolean {
    return this.timerId !== null;
  }

  /**
   * Update the automation configuration
   */
  updateConfig(config: Partial<EmailArchonAutomationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart if running and interval changed
    if (this.timerId && config.checkInterval !== undefined) {
      this.stop();
      this.start();
    }
    
    // Start or stop based on enabled status
    if (config.enabled !== undefined) {
      if (config.enabled && !this.timerId) {
        this.start();
      } else if (!config.enabled && this.timerId) {
        this.stop();
      }
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): EmailArchonAutomationConfig {
    return { ...this.config };
  }

  /**
   * Get the current run status
   */
  getCurrentRun(): EmailAutomationRun | null {
    return this.currentRun;
  }

  /**
   * Get the run history
   */
  getRunHistory(): EmailAutomationRun[] {
    return [...this.runHistory];
  }

  /**
   * Extract attachments from email if configured
   */
  private async extractAttachments(email: GmailEmail): Promise<Array<{
    filename: string;
    content: string;
    contentType: string;
  }> | undefined> {
    if (!this.config.includeAttachments || !email.hasAttachments) {
      return undefined;
    }

    // This is a placeholder for attachment extraction logic
    // In a real implementation, you would use the Gmail API to fetch attachments
    // For now, we'll return undefined to indicate no attachments were extracted
    return undefined;
  }

  /**
   * Run the automation once
   */
  async runAutomation(): Promise<EmailAutomationRun> {
    const runId = `run-${Date.now()}`;
    
    this.currentRun = {
      id: runId,
      startTime: new Date().toISOString(),
      emailsProcessed: 0,
      errors: [],
      status: 'running',
      details: {
        processedEmails: [],
      },
    };
    
    try {
      // Search for emails matching the query
      const searchQuery = this.config.searchQuery || 'is:unread';
      const emails = await this.gmailService.listUnreadEmails(this.config.maxEmailsToProcess);
      
      // Process each email
      for (const email of emails) {
        const emailResult = {
          id: email.id,
          subject: email.subject,
          from: email.from,
          archonId: undefined as string | undefined,
          error: undefined as string | undefined,
        };
        
        try {
          // Extract attachments if configured
          const attachments = await this.extractAttachments(email);
          
          // Store email in Archon with "resbyte" tag
          const archonId = await this.archonService.storeEmail({
            subject: email.subject,
            from: email.from,
            to: email.to,
            body: email.body,
            date: email.date,
            threadId: email.threadId,
            attachments,
          });
          
          if (archonId) {
            emailResult.archonId = archonId;
            
            // Mark email as processed if configured
            if (this.config.labelProcessedEmails) {
              await this.gmailService.markAsRead(email.id);
              if (this.config.processedLabel) {
                await this.gmailService.addLabel(email.id, this.config.processedLabel);
              }
            }
            
            // Update counts
            this.currentRun.emailsProcessed++;
          } else {
            throw new Error('Failed to store email in Archon');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          emailResult.error = errorMessage;
          this.currentRun.errors.push(`Error processing email ${email.id}: ${errorMessage}`);
        }
        
        // Add to processed emails
        this.currentRun.details.processedEmails.push(emailResult);
      }
      
      // Update run status
      this.currentRun.status = 'completed';
      this.currentRun.endTime = new Date().toISOString();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.currentRun.status = 'failed';
      this.currentRun.errors.push(`Automation run failed: ${errorMessage}`);
      this.currentRun.endTime = new Date().toISOString();
    }
    
    // Add to history
    this.runHistory.unshift(this.currentRun);
    // Keep only the last 20 runs
    if (this.runHistory.length > 20) {
      this.runHistory = this.runHistory.slice(0, 20);
    }
    
    const completedRun = { ...this.currentRun };
    
    // Reset current run if completed
    if (this.currentRun.status === 'completed' || this.currentRun.status === 'failed') {
      this.currentRun = null;
    }
    
    return completedRun;
  }
}

// Helper function to create an EmailArchonAutomationService
export const createEmailArchonAutomationService = async (
  gmailConfig: GmailConfig,
  automationConfig: Partial<EmailArchonAutomationConfig> = {}
): Promise<EmailArchonAutomationService | null> => {
  try {
    // Create Gmail service
    const gmailService = new GmailService(gmailConfig);
    const isGmailConnected = await gmailService.testConnection();
    
    if (!isGmailConnected) {
      console.error('Failed to connect to Gmail');
      return null;
    }
    
    // Create Archon service
    const archonService = await import('./archon').then(module => module.createArchonService());
    
    if (!archonService) {
      console.error('Failed to create Archon service');
      return null;
    }
    
    // Default configuration
    const defaultConfig: EmailArchonAutomationConfig = {
      checkInterval: 60, // 60 minutes (hourly)
      maxEmailsToProcess: 20,
      labelProcessedEmails: true,
      processedLabel: 'Archon-Processed',
      searchQuery: 'is:unread',
      enabled: false,
      includeAttachments: true,
      archonTags: ['email', 'resbyte'],
    };
    
    const config = { ...defaultConfig, ...automationConfig };
    
    return new EmailArchonAutomationService(
      gmailService,
      archonService,
      config
    );
  } catch (error) {
    console.error('Failed to create EmailArchonAutomationService:', error);
    return null;
  }
};
