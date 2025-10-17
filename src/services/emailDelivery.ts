import axios from 'axios';
import { ReportData } from './reportGenerator';

export interface EmailConfig {
  service: 'smtp' | 'sendgrid' | 'mailgun' | 'gmail';
  apiKey?: string;
  domain?: string; // For Mailgun
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export class EmailDeliveryService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }
  
  /**
   * Check if the email delivery service is properly configured
   */
  isConfigured(): boolean {
    // Check if required fields are present based on the service type
    switch (this.config.service) {
      case 'smtp':
        return !!(this.config.smtpHost && this.config.smtpPort && this.config.username && 
                 this.config.password && this.config.fromEmail);
      
      case 'sendgrid':
        return !!(this.config.apiKey && this.config.fromEmail);
      
      case 'mailgun':
        return !!(this.config.apiKey && this.config.domain && this.config.fromEmail);
      
      case 'gmail':
        return !!(this.config.username && this.config.password && this.config.fromEmail);
      
      default:
        return false;
    }
  }

  /**
   * Test the email delivery service
   */
  async testConnection(): Promise<boolean> {
    try {
      // Send a test email based on the configured service
      const result = await this.sendEmail({
        to: [{ id: `test-${Date.now()}`, email: this.config.fromEmail, name: this.config.fromName, role: 'tester' }],
        subject: 'Test Email Connection',
        text: 'This is a test email to verify the connection.',
        html: '<p>This is a test email to verify the connection.</p>',
      });
      
      return result.success;
    } catch (error) {
      console.error('Failed to test email connection:', error);
      return false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(params: {
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    text: string;
    html: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
  }): Promise<EmailDeliveryResult> {
    try {
      switch (this.config.service) {
        case 'sendgrid':
          return await this.sendWithSendGrid(params);
        case 'mailgun':
          return await this.sendWithMailgun(params);
        case 'gmail':
          return await this.sendWithGmail(params);
        case 'smtp':
        default:
          return await this.sendWithSmtp(params);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send email using SendGrid
   */
  private async sendWithSendGrid(params: any): Promise<EmailDeliveryResult> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key is required');
    }
    
    const toEmails = params.to.map((recipient: EmailRecipient) => ({
      email: recipient.email,
      name: recipient.name,
    }));
    
    const ccEmails = params.cc?.map((recipient: EmailRecipient) => ({
      email: recipient.email,
      name: recipient.name,
    })) || [];
    
    const bccEmails = params.bcc?.map((recipient: EmailRecipient) => ({
      email: recipient.email,
      name: recipient.name,
    })) || [];
    
    const data = {
      personalizations: [
        {
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
          bcc: bccEmails.length > 0 ? bccEmails : undefined,
          subject: params.subject,
        },
      ],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      content: [
        {
          type: 'text/plain',
          value: params.text,
        },
        {
          type: 'text/html',
          value: params.html,
        },
      ],
      attachments: params.attachments?.map((attachment: { filename: string; content: string; contentType: string }) => ({
        filename: attachment.filename,
        content: attachment.content,
        type: attachment.contentType,
        disposition: 'attachment',
      })),
    };
    
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return {
      success: response.status >= 200 && response.status < 300,
      messageId: (response.headers as Record<string, string>)['x-message-id'],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send email using Mailgun
   */
  private async sendWithMailgun(params: any): Promise<EmailDeliveryResult> {
    if (!this.config.apiKey || !this.config.domain) {
      throw new Error('Mailgun API key and domain are required');
    }
    
    const formData = new FormData();
    formData.append('from', `${this.config.fromName} <${this.config.fromEmail}>`);
    
    // Add recipients
    params.to.forEach((recipient: EmailRecipient) => {
      formData.append('to', `${recipient.name} <${recipient.email}>`);
    });
    
    // Add CC recipients if any
    params.cc?.forEach((recipient: EmailRecipient) => {
      formData.append('cc', `${recipient.name} <${recipient.email}>`);
    });
    
    // Add BCC recipients if any
    params.bcc?.forEach((recipient: EmailRecipient) => {
      formData.append('bcc', `${recipient.name} <${recipient.email}>`);
    });
    
    formData.append('subject', params.subject);
    formData.append('text', params.text);
    formData.append('html', params.html);
    
    // Add attachments if any
    params.attachments?.forEach((attachment: any, index: number) => {
      const blob = new Blob([attachment.content], { type: attachment.contentType });
      formData.append(`attachment[${index}]`, blob, attachment.filename);
    });
    
    const response = await axios.post(
      `https://api.mailgun.net/v3/${this.config.domain}/messages`,
      formData,
      {
        auth: {
          username: 'api',
          password: this.config.apiKey,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return {
      success: response.status >= 200 && response.status < 300,
      messageId: (response.data as { id: string }).id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send email using Gmail API
   */
  private async sendWithGmail(params: any): Promise<EmailDeliveryResult> {
    // This would typically use the Gmail API, but for simplicity,
    // we'll use a mock implementation here
    console.log('Sending email via Gmail API:', {
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: params.to.map((r: EmailRecipient) => `${r.name} <${r.email}>`).join(', '),
      subject: params.subject,
    });
    
    // In a real implementation, you would use the Gmail API client
    return {
      success: true,
      messageId: `mock-gmail-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send email using SMTP
   */
  private async sendWithSmtp(params: any): Promise<EmailDeliveryResult> {
    // This would typically use a library like nodemailer,
    // but for simplicity, we'll use a mock implementation here
    console.log('Sending email via SMTP:', {
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: params.to.map((r: EmailRecipient) => `${r.name} <${r.email}>`).join(', '),
      subject: params.subject,
      smtp: {
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
      },
    });
    
    // In a real implementation, you would use nodemailer
    return {
      success: true,
      messageId: `mock-smtp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send a report via email
   */
  async sendReport(
    report: ReportData,
    recipients: EmailRecipient[],
    options: {
      ccRecipients?: EmailRecipient[];
      bccRecipients?: EmailRecipient[];
      includeTextVersion?: boolean;
      includeHtmlVersion?: boolean;
      customSubject?: string;
      customMessage?: string;
    } = {}
  ): Promise<EmailDeliveryResult> {
    // Generate HTML and text versions of the report
    const reportGenerator = await import('./reportGenerator');
    const reportGeneratorInstance = new reportGenerator.ReportGeneratorService({ domain: '', email: '', apiToken: '', projectKey: '' });
    
    const htmlReport = options.includeHtmlVersion !== false 
      ? reportGeneratorInstance.generateHtmlReport(report) 
      : '';
    
    const textReport = options.includeTextVersion !== false 
      ? reportGeneratorInstance.generateTextReport(report) 
      : '';
    
    // Create email subject
    const subject = options.customSubject || `${report.title} - ${new Date().toLocaleDateString()}`;
    
    // Create email content
    const htmlContent = `
      ${options.customMessage ? `<p>${options.customMessage}</p><hr>` : ''}
      ${htmlReport}
    `;
    
    const textContent = `
      ${options.customMessage ? `${options.customMessage}\n\n---\n\n` : ''}
      ${textReport}
    `;
    
    // Send the email
    return this.sendEmail({
      to: recipients,
      cc: options.ccRecipients,
      bcc: options.bccRecipients,
      subject,
      text: textContent,
      html: htmlContent,
    });
  }
}

// Helper function to create an EmailDeliveryService from environment variables
export const createEmailDeliveryService = (): EmailDeliveryService => {
  const service = process.env.REACT_APP_EMAIL_SERVICE as 'smtp' | 'sendgrid' | 'mailgun' | 'gmail' || 'smtp';
  
  const config: EmailConfig = {
    service,
    apiKey: process.env.REACT_APP_EMAIL_API_KEY,
    domain: process.env.REACT_APP_EMAIL_DOMAIN,
    smtpHost: process.env.REACT_APP_EMAIL_SMTP_HOST,
    smtpPort: process.env.REACT_APP_EMAIL_SMTP_PORT ? parseInt(process.env.REACT_APP_EMAIL_SMTP_PORT) : undefined,
    smtpSecure: process.env.REACT_APP_EMAIL_SMTP_SECURE === 'true',
    username: process.env.REACT_APP_EMAIL_USERNAME,
    password: process.env.REACT_APP_EMAIL_PASSWORD,
    fromEmail: process.env.REACT_APP_EMAIL_FROM_ADDRESS || 'noreply@example.com',
    fromName: process.env.REACT_APP_EMAIL_FROM_NAME || 'Project Management App',
  };
  
  return new EmailDeliveryService(config);
};
