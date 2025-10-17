import axios from 'axios';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  hasAttachments: boolean;
  labels: string[];
}

export class GmailService {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string | null;
  private expiresAt: number;

  constructor(config: GmailConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;
    this.accessToken = config.accessToken || null;
    this.expiresAt = config.expiresAt || 0;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // If token is still valid, return it
    if (this.accessToken && this.expiresAt > now) {
      return this.accessToken;
    }
    
    // Otherwise, refresh the token
    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }
      );
      
      const data = response.data as { access_token: string; expires_in: number };
      this.accessToken = data.access_token;
      this.expiresAt = now + (data.expires_in * 1000);
      
      return this.accessToken as string;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to authenticate with Gmail');
    }
  }

  /**
   * Test the Gmail connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Gmail:', error);
      return false;
    }
  }

  /**
   * Get the current configuration with updated tokens
   */
  getConfig(): GmailConfig {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      refreshToken: this.refreshToken,
      accessToken: this.accessToken || undefined,
      expiresAt: this.expiresAt,
    };
  }

  /**
   * List unread emails in the inbox
   */
  async listUnreadEmails(maxResults: number = 10): Promise<GmailEmail[]> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: 'is:unread in:inbox',
          maxResults,
        },
      });
      
      const data = response.data as { messages?: Array<{ id: string }> };
      if (!data.messages || data.messages.length === 0) {
        return [];
      }
      
      const emails: GmailEmail[] = [];
      
      for (const message of data.messages) {
        const email = await this.getEmail(message.id);
        if (email) {
          emails.push(email);
        }
      }
      
      return emails;
    } catch (error) {
      console.error('Failed to list unread emails:', error);
      return [];
    }
  }

  /**
   * Get a specific email by ID
   */
  async getEmail(messageId: string): Promise<GmailEmail | null> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          format: 'full',
        },
      });
      
      interface GmailMessagePayload {
        headers: Array<{ name: string; value: string }>;
        parts?: Array<{ 
          mimeType: string; 
          body?: { data?: string };
          filename?: string;
        }>;
        body?: { data?: string };
      }
      
      interface GmailMessageData {
        id: string;
        threadId: string;
        snippet: string;
        labelIds?: string[];
        payload: GmailMessagePayload;
      }
      
      const message = response.data as GmailMessageData;
      const headers = message.payload.headers;
      
      const getHeader = (name: string): string => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };
      
      // Extract email body
      let body = '';
      
      if (message.payload.parts) {
        // Multipart message
        const textPart = message.payload.parts.find(
          (part: any) => part.mimeType === 'text/plain'
        );
        
        if (textPart && textPart.body && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (message.payload.body && message.payload.body.data) {
        // Simple message
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }
      
      return {
        id: message.id,
        threadId: message.threadId,
        subject: getHeader('subject'),
        from: getHeader('from'),
        to: getHeader('to'),
        date: getHeader('date'),
        snippet: message.snippet,
        body,
        hasAttachments: message.payload.parts ? message.payload.parts.some((part: any) => part.filename && part.filename.length > 0) : false,
        labels: message.labelIds || [],
      };
    } catch (error) {
      console.error(`Failed to get email ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Mark an email as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          removeLabelIds: ['UNREAD'],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return true;
    } catch (error) {
      console.error(`Failed to mark email ${messageId} as read:`, error);
      return false;
    }
  }

  /**
   * Add a label to an email
   */
  async addLabel(messageId: string, labelName: string): Promise<boolean> {
    try {
      // First, check if the label exists or create it
      const labelId = await this.ensureLabelExists(labelName);
      
      if (!labelId) {
        return false;
      }
      
      const accessToken = await this.getAccessToken();
      await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          addLabelIds: [labelId],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return true;
    } catch (error) {
      console.error(`Failed to add label to email ${messageId}:`, error);
      return false;
    }
  }

  /**
   * Ensure a label exists, creating it if necessary
   */
  private async ensureLabelExists(labelName: string): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      
      // List existing labels
      const listResponse = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      const data = listResponse.data as { labels: Array<{ name: string; id: string }> };
      const existingLabel = data.labels.find(
        (label) => label.name === labelName
      );
      
      if (existingLabel) {
        return existingLabel.id;
      }
      
      // Create new label
      const createResponse = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return (createResponse.data as { id: string }).id;
    } catch (error) {
      console.error(`Failed to ensure label ${labelName} exists:`, error);
      return null;
    }
  }
}

// Helper function to create a Gmail service from stored config
export const createGmailService = async (config: GmailConfig): Promise<GmailService | null> => {
  try {
    const gmailService = new GmailService(config);
    const isConnected = await gmailService.testConnection();
    
    if (isConnected) {
      return gmailService;
    }
    return null;
  } catch (error) {
    console.error('Failed to create Gmail service:', error);
    return null;
  }
};
