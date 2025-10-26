import axios from 'axios';

export interface WhatsAppConfig {
  apiUrl: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken?: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text: {
    body: string;
  };
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  context?: {
    from: string;
    id: string;
  };
}

export interface WhatsAppContact {
  wa_id: string;
  profile: {
    name: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: WhatsAppContact[];
        messages?: WhatsAppMessage[];
        statuses?: any[];
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppIntegrationService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  /**
   * Test the WhatsApp API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.config.apiUrl}/${this.config.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to WhatsApp API:', error);
      return false;
    }
  }

  /**
   * Send a text message to a WhatsApp number
   */
  async sendTextMessage(to: string, text: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      interface WhatsAppResponse {
        messages?: Array<{id: string}>
      }
      
      const responseData = response.data as WhatsAppResponse;
      if (responseData && responseData.messages && responseData.messages.length > 0) {
        return responseData.messages[0].id;
      }
      return null;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return null;
    }
  }

  /**
   * Get recent messages from a specific WhatsApp channel
   * Note: In a real implementation, this would use webhooks or the Cloud API
   * For this example, we'll simulate retrieving messages
   */
  async getRecentMessages(channelName: string): Promise<WhatsAppMessage[]> {
    try {
      // In a real implementation, you would use the WhatsApp Business API
      // to retrieve messages. For this example, we'll simulate it.
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we're looking for the Crisis Response channel
      if (channelName === 'Resbyte Crisis Response') {
        // Return simulated messages for the Crisis Response channel
        return [
          {
            id: 'wamid.123456789',
            from: '15551234567',
            timestamp: new Date().toISOString(),
            text: {
              body: "We need immediate assistance with a server outage affecting our main production environment. All services are down and customers can't access their accounts. Need emergency response team to investigate and resolve ASAP."
            },
            type: 'text'
          },
          {
            id: 'wamid.987654321',
            from: '15559876543',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
            text: {
              body: "Security breach detected in our authentication system. Multiple failed login attempts and suspicious activities observed. Need security experts to analyze logs and implement countermeasures."
            },
            type: 'text'
          },
          {
            id: 'wamid.456789123',
            from: '15555555555',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
            text: {
              body: "Database performance has degraded significantly. Queries taking 10x longer than usual. Need database optimization expert to identify bottlenecks and implement fixes before end of day."
            },
            type: 'text'
          }
        ];
      }
      
      // Return empty array for other channels
      return [];
    } catch (error) {
      console.error('Failed to get WhatsApp messages:', error);
      return [];
    }
  }

  /**
   * Process a webhook payload from WhatsApp
   */
  processWebhookPayload(payload: WhatsAppWebhookPayload): WhatsAppMessage[] {
    try {
      const messages: WhatsAppMessage[] = [];
      
      // Process each entry in the webhook payload
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            messages.push(...change.value.messages);
          }
        }
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to process WhatsApp webhook payload:', error);
      return [];
    }
  }

  /**
   * Verify a webhook request from WhatsApp
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }
}

// Helper function to create a WhatsAppIntegrationService
export const createWhatsAppIntegrationService = (): WhatsAppIntegrationService | null => {
  try {
    const config: WhatsAppConfig = {
      apiUrl: process.env.REACT_APP_WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0',
      phoneNumberId: process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      accessToken: process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN || '',
      webhookVerifyToken: process.env.REACT_APP_WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    };
    
    if (!config.phoneNumberId || !config.businessAccountId || !config.accessToken) {
      console.error('WhatsApp configuration is incomplete');
      return null;
    }
    
    return new WhatsAppIntegrationService(config);
  } catch (error) {
    console.error('Failed to create WhatsApp integration service:', error);
    return null;
  }
};
