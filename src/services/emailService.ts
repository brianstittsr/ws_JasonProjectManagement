import axios from 'axios';
import { TaskEstimate } from './crisisResponseAnalyzer';

export interface EmailConfig {
  service: 'smtp' | 'sendgrid' | 'mailgun' | 'gmail';
  apiKey?: string;
  domain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  username?: string;
  password?: string;
  fromAddress: string;
  fromName: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export class EmailService {
  private config: EmailConfig;
  private isProduction: boolean;

  constructor(config: EmailConfig, isProduction: boolean = false) {
    this.config = config;
    this.isProduction = isProduction;
  }

  /**
   * Test the email service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // For SMTP, we can't really test without sending an email
      // For API-based services, we could check API key validity
      
      if (this.config.service === 'sendgrid' || this.config.service === 'mailgun') {
        // Simulate API check
        return !!this.config.apiKey;
      }
      
      // For SMTP and Gmail, assume connection is valid if credentials are provided
      return true;
    } catch (error) {
      console.error('Failed to test email connection:', error);
      return false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In a real implementation, this would use the configured email service
      // For this example, we'll simulate sending an email
      
      console.log('Sending email:', {
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text?.substring(0, 100) + '...',
        html: options.html ? 'HTML content provided' : undefined,
        attachments: options.attachments?.length || 0,
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send task estimates email
   */
  async sendTaskEstimatesEmail(tasks: TaskEstimate[], options?: {
    additionalMessage?: string;
    customSubject?: string;
  }): Promise<boolean> {
    try {
      // Determine recipients based on production mode
      const recipients = this.isProduction 
        ? ['jason@resbyte.ai', 'pt@resbyte.ai']
        : ['brian@resbyte.ai'];
      
      // Calculate total cost and hours
      const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
      const totalCost = tasks.reduce((sum, task) => sum + task.totalCost, 0);
      
      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
      };
      
      // Generate HTML content
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              h2 { color: #3498db; margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f8f9fa; }
              .priority-critical { color: #e74c3c; font-weight: bold; }
              .priority-high { color: #e67e22; font-weight: bold; }
              .priority-medium { color: #f39c12; }
              .priority-low { color: #27ae60; }
              .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
              .skills { display: inline-block; background: #eee; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Crisis Response Task Estimates</h1>
              
              ${options?.additionalMessage ? `<p>${options.additionalMessage}</p>` : ''}
              
              <h2>Task Summary</h2>
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasks.map(task => `
                    <tr>
                      <td>${task.title}</td>
                      <td class="priority-${task.priority}">${task.priority.toUpperCase()}</td>
                      <td>${task.estimatedHours}</td>
                      <td>${formatCurrency(task.hourlyRate)}/hr</td>
                      <td>${formatCurrency(task.totalCost)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td><strong>${totalHours} hours</strong></td>
                    <td></td>
                    <td><strong>${formatCurrency(totalCost)}</strong></td>
                  </tr>
                </tfoot>
              </table>
              
              <div class="summary">
                <p><strong>Total Estimated Hours:</strong> ${totalHours}</p>
                <p><strong>Total Estimated Cost:</strong> ${formatCurrency(totalCost)}</p>
              </div>
              
              <h2>Detailed Task Breakdown</h2>
              ${tasks.map(task => `
                <div style="margin-bottom: 30px; border-left: 4px solid #3498db; padding-left: 15px;">
                  <h3>${task.title}</h3>
                  <p><strong>Priority:</strong> <span class="priority-${task.priority}">${task.priority.toUpperCase()}</span></p>
                  <p><strong>Description:</strong> ${task.description}</p>
                  <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
                  <p><strong>Hourly Rate:</strong> ${formatCurrency(task.hourlyRate)}</p>
                  <p><strong>Total Cost:</strong> ${formatCurrency(task.totalCost)}</p>
                  <p><strong>Required Skills:</strong> ${task.skills.map(skill => 
                    `<span class="skills">${skill}</span>`).join(' ')}</p>
                </div>
              `).join('')}
              
              <p>This is an automated message from the Resbyte Crisis Response System.</p>
            </div>
          </body>
        </html>
      `;
      
      // Generate plain text content as fallback
      const text = `
Crisis Response Task Estimates

${options?.additionalMessage || ''}

TASK SUMMARY
${tasks.map(task => 
  `- ${task.title} (${task.priority.toUpperCase()})
   Hours: ${task.estimatedHours}, Rate: $${task.hourlyRate}/hr, Cost: $${task.totalCost}`
).join('\n\n')}

TOTAL: ${totalHours} hours, $${totalCost}

DETAILED TASK BREAKDOWN
${tasks.map(task => 
  `${task.title}
Priority: ${task.priority.toUpperCase()}
Description: ${task.description}
Estimated Hours: ${task.estimatedHours}
Hourly Rate: $${task.hourlyRate}
Total Cost: $${task.totalCost}
Required Skills: ${task.skills.join(', ')}`
).join('\n\n')}

This is an automated message from the Resbyte Crisis Response System.
      `;
      
      // Send the email
      return await this.sendEmail({
        to: recipients,
        subject: options?.customSubject || 'Crisis Response Task Estimates',
        text,
        html
      });
    } catch (error) {
      console.error('Failed to send task estimates email:', error);
      return false;
    }
  }
}

// Helper function to create an EmailService
export const createEmailService = (isProduction: boolean = false): EmailService | null => {
  try {
    const config: EmailConfig = {
      service: (process.env.REACT_APP_EMAIL_SERVICE as 'smtp' | 'sendgrid' | 'mailgun' | 'gmail') || 'smtp',
      apiKey: process.env.REACT_APP_EMAIL_API_KEY,
      domain: process.env.REACT_APP_EMAIL_DOMAIN,
      smtpHost: process.env.REACT_APP_EMAIL_SMTP_HOST,
      smtpPort: process.env.REACT_APP_EMAIL_SMTP_PORT ? Number(process.env.REACT_APP_EMAIL_SMTP_PORT) : undefined,
      smtpSecure: process.env.REACT_APP_EMAIL_SMTP_SECURE === 'true',
      username: process.env.REACT_APP_EMAIL_USERNAME,
      password: process.env.REACT_APP_EMAIL_PASSWORD,
      fromAddress: process.env.REACT_APP_EMAIL_FROM_ADDRESS || 'noreply@resbyte.ai',
      fromName: process.env.REACT_APP_EMAIL_FROM_NAME || 'Resbyte Crisis Response',
    };
    
    return new EmailService(config, isProduction);
  } catch (error) {
    console.error('Failed to create email service:', error);
    return null;
  }
};
