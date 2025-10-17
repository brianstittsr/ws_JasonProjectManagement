import { WhatsAppIntegrationService, WhatsAppMessage, createWhatsAppIntegrationService } from './whatsappIntegration';
import { CrisisResponseAnalyzer, TaskEstimate, createCrisisResponseAnalyzer } from './crisisResponseAnalyzer';
import { EmailService, createEmailService } from './emailService';

export interface CrisisResponseAutomationConfig {
  enabled: boolean;
  checkInterval: number; // in minutes
  whatsappChannel: string;
  isProduction: boolean;
  lastChecked?: string;
  processedMessageIds?: string[];
}

export interface AutomationRun {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  messagesProcessed: number;
  tasksGenerated: number;
  emailSent: boolean;
  error?: string;
}

export class CrisisResponseAutomation {
  private config: CrisisResponseAutomationConfig;
  private whatsappService: WhatsAppIntegrationService | null;
  private analyzer: CrisisResponseAnalyzer | null;
  private emailService: EmailService | null;
  private timer: NodeJS.Timeout | null = null;
  private runs: AutomationRun[] = [];
  private processedMessageIds: Set<string>;

  constructor(
    config: CrisisResponseAutomationConfig,
    whatsappService: WhatsAppIntegrationService | null,
    analyzer: CrisisResponseAnalyzer | null,
    emailService: EmailService | null
  ) {
    this.config = config;
    this.whatsappService = whatsappService;
    this.analyzer = analyzer;
    this.emailService = emailService;
    this.processedMessageIds = new Set(config.processedMessageIds || []);
    
    this.loadFromLocalStorage();
    
    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Load runs from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const runsJson = localStorage.getItem('crisis-response-runs');
      if (runsJson) {
        this.runs = JSON.parse(runsJson);
      }
      
      const configJson = localStorage.getItem('crisis-response-config');
      if (configJson) {
        const savedConfig = JSON.parse(configJson);
        this.config = { ...this.config, ...savedConfig };
        this.processedMessageIds = new Set(this.config.processedMessageIds || []);
      }
    } catch (error) {
      console.error('Error loading crisis response data from localStorage:', error);
    }
  }

  /**
   * Save runs to localStorage
   */
  private saveRunsToLocalStorage(): void {
    try {
      localStorage.setItem('crisis-response-runs', JSON.stringify(this.runs));
    } catch (error) {
      console.error('Error saving crisis response runs to localStorage:', error);
    }
  }

  /**
   * Save config to localStorage
   */
  private saveConfigToLocalStorage(): void {
    try {
      // Update processed message IDs in config
      this.config.processedMessageIds = Array.from(this.processedMessageIds);
      this.config.lastChecked = new Date().toISOString();
      
      localStorage.setItem('crisis-response-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving crisis response config to localStorage:', error);
    }
  }

  /**
   * Start the automation
   */
  start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.config.enabled = true;
    this.saveConfigToLocalStorage();
    
    // Run immediately
    this.checkForNewMessages();
    
    // Set up interval
    this.timer = setInterval(() => {
      this.checkForNewMessages();
    }, this.config.checkInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Stop the automation
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.config.enabled = false;
    this.saveConfigToLocalStorage();
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CrisisResponseAutomationConfig>): void {
    const wasEnabled = this.config.enabled;
    const newInterval = updates.checkInterval !== undefined && 
                        updates.checkInterval !== this.config.checkInterval;
    
    this.config = { ...this.config, ...updates };
    this.saveConfigToLocalStorage();
    
    // Restart timer if interval changed or if enabling
    if ((wasEnabled && newInterval) || (!wasEnabled && this.config.enabled)) {
      this.stop();
      this.start();
    } else if (wasEnabled && !this.config.enabled) {
      this.stop();
    }
  }

  /**
   * Check for new messages
   */
  async checkForNewMessages(): Promise<AutomationRun | null> {
    if (!this.whatsappService || !this.analyzer || !this.emailService) {
      console.error('Services not initialized');
      return null;
    }
    
    // Create a new run
    const run: AutomationRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      startTime: new Date().toISOString(),
      status: 'running',
      messagesProcessed: 0,
      tasksGenerated: 0,
      emailSent: false
    };
    
    this.runs.push(run);
    this.saveRunsToLocalStorage();
    
    try {
      // Get messages from WhatsApp channel
      const messages = await this.whatsappService.getRecentMessages(this.config.whatsappChannel);
      
      // Filter out already processed messages
      const newMessages = messages.filter(msg => !this.processedMessageIds.has(msg.id));
      
      if (newMessages.length === 0) {
        // No new messages
        run.status = 'completed';
        run.endTime = new Date().toISOString();
        this.saveRunsToLocalStorage();
        return run;
      }
      
      // Process each message
      const taskEstimates: TaskEstimate[] = [];
      
      for (const message of newMessages) {
        // Analyze message
        const taskEstimate = await this.analyzer.analyzeMessage(message);
        taskEstimates.push(taskEstimate);
        
        // Mark message as processed
        this.processedMessageIds.add(message.id);
        
        run.messagesProcessed++;
        run.tasksGenerated++;
      }
      
      // Send email with task estimates
      if (taskEstimates.length > 0) {
        const emailSent = await this.emailService.sendTaskEstimatesEmail(
          taskEstimates,
          {
            additionalMessage: `The following tasks were automatically generated from messages in the "${this.config.whatsappChannel}" WhatsApp channel.`,
            customSubject: `Crisis Response: ${taskEstimates.length} New Task${taskEstimates.length > 1 ? 's' : ''} Generated`
          }
        );
        
        run.emailSent = emailSent;
      }
      
      // Update run status
      run.status = 'completed';
      run.endTime = new Date().toISOString();
      
      // Save state
      this.saveConfigToLocalStorage();
      this.saveRunsToLocalStorage();
      
      return run;
    } catch (error) {
      console.error('Error in crisis response automation:', error);
      
      // Update run with error
      run.status = 'failed';
      run.endTime = new Date().toISOString();
      run.error = error instanceof Error ? error.message : String(error);
      
      this.saveRunsToLocalStorage();
      
      return run;
    }
  }

  /**
   * Get all runs
   */
  getRuns(): AutomationRun[] {
    return [...this.runs];
  }

  /**
   * Get configuration
   */
  getConfig(): CrisisResponseAutomationConfig {
    return { ...this.config };
  }

  /**
   * Process a specific message manually
   */
  async processMessage(message: WhatsAppMessage): Promise<TaskEstimate | null> {
    if (!this.analyzer) {
      console.error('Analyzer not initialized');
      return null;
    }
    
    try {
      return await this.analyzer.analyzeMessage(message);
    } catch (error) {
      console.error('Error processing message:', error);
      return null;
    }
  }

  /**
   * Send task estimates email manually
   */
  async sendTaskEstimatesEmail(tasks: TaskEstimate[]): Promise<boolean> {
    if (!this.emailService) {
      console.error('Email service not initialized');
      return false;
    }
    
    try {
      return await this.emailService.sendTaskEstimatesEmail(tasks);
    } catch (error) {
      console.error('Error sending task estimates email:', error);
      return false;
    }
  }
}

// Helper function to create a CrisisResponseAutomation
export const createCrisisResponseAutomation = (
  config?: Partial<CrisisResponseAutomationConfig>
): CrisisResponseAutomation | null => {
  try {
    // Create services
    const whatsappService = createWhatsAppIntegrationService();
    const analyzer = createCrisisResponseAnalyzer();
    const emailService = createEmailService(config?.isProduction);
    
    // Default configuration
    const defaultConfig: CrisisResponseAutomationConfig = {
      enabled: false,
      checkInterval: 5, // 5 minutes
      whatsappChannel: 'Resbyte Crisis Response',
      isProduction: false,
    };
    
    // Merge with provided config
    const mergedConfig = { ...defaultConfig, ...config };
    
    return new CrisisResponseAutomation(
      mergedConfig,
      whatsappService,
      analyzer,
      emailService
    );
  } catch (error) {
    console.error('Failed to create crisis response automation:', error);
    return null;
  }
};
