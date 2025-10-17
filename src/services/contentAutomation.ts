import { GmailService, GmailConfig, GmailEmail } from './gmail';
import { ArchonService } from './archon';
import { ContentExtractorService, ExtractedContent } from './contentExtractor';

export interface ContentAutomationConfig {
  checkInterval: number; // in minutes
  maxEmailsToProcess: number;
  labelProcessedEmails: boolean;
  processedLabel: string;
  searchQuery: string;
  enabled: boolean;
}

export interface AutomationRun {
  id: string;
  startTime: string;
  endTime?: string;
  emailsProcessed: number;
  contentExtracted: number;
  errors: string[];
  status: 'running' | 'completed' | 'failed';
  details: {
    processedEmails: {
      id: string;
      subject: string;
      from: string;
      processedLinks: string[];
      extractedContent: {
        id: string;
        type: string;
        title: string;
      }[];
      error?: string;
    }[];
  };
}

export class ContentAutomationService {
  private gmailService: GmailService;
  private archonService: ArchonService;
  private contentExtractor: ContentExtractorService;
  private config: ContentAutomationConfig;
  private timerId: NodeJS.Timeout | null = null;
  private currentRun: AutomationRun | null = null;
  private runHistory: AutomationRun[] = [];

  constructor(
    gmailService: GmailService,
    archonService: ArchonService,
    contentExtractor: ContentExtractorService,
    config: ContentAutomationConfig
  ) {
    this.gmailService = gmailService;
    this.archonService = archonService;
    this.contentExtractor = contentExtractor;
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
      
      // Test content extractor configuration
      const extractorConfigured = this.contentExtractor.isConfigured();
      if (!extractorConfigured) {
        return { success: false, message: 'Content extractor is not properly configured. Please check your Zoom and FireFlies API settings.' };
      }
      
      // All checks passed, start the automation
      await this.runAutomation();
      
      this.timerId = setInterval(() => {
        this.runAutomation();
      }, this.config.checkInterval * 60 * 1000);
      
      return { success: true, message: 'Automation started successfully' };
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
  updateConfig(config: Partial<ContentAutomationConfig>): void {
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
  getConfig(): ContentAutomationConfig {
    return { ...this.config };
  }

  /**
   * Get the current run status
   */
  getCurrentRun(): AutomationRun | null {
    return this.currentRun;
  }

  /**
   * Get the run history
   */
  getRunHistory(): AutomationRun[] {
    return [...this.runHistory];
  }

  /**
   * Run the automation once
   */
  async runAutomation(): Promise<AutomationRun> {
    const runId = `run-${Date.now()}`;
    
    this.currentRun = {
      id: runId,
      startTime: new Date().toISOString(),
      emailsProcessed: 0,
      contentExtracted: 0,
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
          processedLinks: [] as string[],
          extractedContent: [] as { id: string; type: string; title: string }[],
          error: undefined as string | undefined,
        };
        
        try {
          // Process the email to extract content
          const { processedLinks, extractedContents } = await this.contentExtractor.processEmail(
            email,
            this.archonService
          );
          
          // Update result
          emailResult.processedLinks = processedLinks;
          emailResult.extractedContent = extractedContents.map(content => ({
            id: content.id,
            type: content.type,
            title: content.title,
          }));
          
          // Mark email as processed if configured
          if (this.config.labelProcessedEmails && processedLinks.length > 0) {
            await this.gmailService.markAsRead(email.id);
            if (this.config.processedLabel) {
              await this.gmailService.addLabel(email.id, this.config.processedLabel);
            }
          }
          
          // Update counts
          this.currentRun.emailsProcessed++;
          this.currentRun.contentExtracted += extractedContents.length;
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

// Helper function to create a ContentAutomationService
export const createContentAutomationService = async (
  gmailConfig: GmailConfig,
  automationConfig: Partial<ContentAutomationConfig> = {}
): Promise<ContentAutomationService | null> => {
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
    
    // Create content extractor
    const contentExtractor = await import('./contentExtractor').then(module => module.createContentExtractorService());
    
    // Default configuration
    const defaultConfig: ContentAutomationConfig = {
      checkInterval: 15, // 15 minutes
      maxEmailsToProcess: 10,
      labelProcessedEmails: true,
      processedLabel: 'Processed-Content',
      searchQuery: 'is:unread (zoom.us OR fireflies.ai OR read.ai)',
      enabled: false,
    };
    
    const config = { ...defaultConfig, ...automationConfig };
    
    return new ContentAutomationService(
      gmailService,
      archonService,
      contentExtractor,
      config
    );
  } catch (error) {
    console.error('Failed to create ContentAutomationService:', error);
    return null;
  }
};
