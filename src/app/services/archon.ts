import axios from 'axios';
import { 
  getServiceConfig, 
  checkServiceAvailability, 
  handleServiceError, 
  getMockData
} from './serviceConfig';

export interface ArchonConfig {
  apiUrl: string;
  apiKey: string;
  vectorDb: string;
  embeddingModel: string;
  completionModel: string;
}

export interface ArchonDocument {
  id?: string;
  content: string;
  metadata: {
    source: string;
    sourceType: string;
    tags: string[];
    title?: string;
    author?: string;
    createdAt?: string;
    [key: string]: any;
  };
}

export interface ArchonQuery {
  query: string;
  filters?: {
    tags?: string[];
    sourceType?: string;
    [key: string]: any;
  };
  topK?: number;
}

export interface ArchonResponseDraft {
  subject: string;
  body: string;
  references: {
    title: string;
    content: string;
    source: string;
    relevanceScore: number;
  }[];
}

export class ArchonService {
  private apiUrl: string;
  private apiKey: string;
  private vectorDb: string;
  private embeddingModel: string;
  private completionModel: string;
  private isAvailable = false;
  private useMockData = false;

  constructor(config: ArchonConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.vectorDb = config.vectorDb;
    this.embeddingModel = config.embeddingModel;
    this.completionModel = config.completionModel;
    
    // Enable mock data in development when not connected
    this.useMockData = process.env.NODE_ENV === 'development';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * Test the Archon connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        headers: this.getHeaders(),
        timeout: 5000 // Short timeout for health check
      });
      this.isAvailable = response.status === 200;
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      handleServiceError('archon', error, false);
      return false;
    }
  }

  /**
   * Store a document in the Archon knowledgebase
   */
  async storeDocument(document: ArchonDocument): Promise<string | null> {
    if (!this.isAvailable) {
      if (this.useMockData) {
        return 'mock-document-id';
      }
      return null;
    }
    
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents`, 
        {
          ...document,
          vectorDb: this.vectorDb,
          embeddingModel: this.embeddingModel
        },
        { headers: this.getHeaders() }
      );
      
      return (response.data as { id: string }).id;
    } catch (error) {
      return handleServiceError('archon', error, null);
    }
  }

  /**
   * Store an email in the Archon knowledgebase
   */
  async storeEmail(email: {
    subject: string;
    from: string;
    to: string;
    body: string;
    date: string;
    threadId?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
  }): Promise<string | null> {
    if (!this.isAvailable) {
      if (this.useMockData) {
        return 'mock-email-id';
      }
      return null;
    }
    
    try {
      // Store the email content
      const emailDocument: ArchonDocument = {
        content: `Subject: ${email.subject}\nFrom: ${email.from}\nTo: ${email.to}\nDate: ${email.date}\n\n${email.body}`,
        metadata: {
          source: email.threadId || 'email',
          sourceType: 'email',
          tags: ['email', 'correspondence', 'resbyte'],
          title: email.subject,
          author: email.from,
          createdAt: email.date,
          recipients: email.to,
          hasAttachments: email.attachments && email.attachments.length > 0
        }
      };
      
      const emailId = await this.storeDocument(emailDocument);
      
      // Store attachments if any
      if (email.attachments && email.attachments.length > 0) {
        for (const attachment of email.attachments) {
          const attachmentDocument: ArchonDocument = {
            content: attachment.content,
            metadata: {
              source: emailId || 'email-attachment',
              sourceType: 'email-attachment',
              tags: ['email-attachment', 'document', 'resbyte'],
              title: attachment.filename,
              parentEmail: email.subject,
              contentType: attachment.contentType,
              createdAt: email.date
            }
          };
          
          await this.storeDocument(attachmentDocument);
        }
      }
      
      return emailId;
    } catch (error) {
      return handleServiceError('archon', error, null);
    }
  }

  /**
   * Search the Archon knowledgebase
   */
  async search(query: ArchonQuery): Promise<any[]> {
    if (!this.isAvailable) {
      if (this.useMockData) {
        return getMockData('archon', 'knowledgeBase').searchResults || [];
      }
      return [];
    }
    
    try {
      const response = await axios.post(
        `${this.apiUrl}/search`,
        {
          ...query,
          vectorDb: this.vectorDb,
          embeddingModel: this.embeddingModel
        },
        { headers: this.getHeaders() }
      );
      
      return (response.data as { results: any[] }).results;
    } catch (error) {
      return handleServiceError('archon', error, []);
    }
  }

  /**
   * Generate a response draft based on an email and the knowledgebase
   */
  async generateResponseDraft(
    emailContent: { subject: string; body: string; from: string },
    options: { useTag?: string; maxReferences?: number } = {}
  ): Promise<ArchonResponseDraft | null> {
    if (!this.isAvailable) {
      if (this.useMockData) {
        return {
          subject: `Re: ${emailContent.subject}`,
          body: 'This is a mock response generated because the Archon service is unavailable.',
          references: [
            {
              title: 'Mock Reference',
              content: 'This is mock content for development purposes.',
              source: 'mock-source',
              relevanceScore: 0.95
            }
          ]
        };
      }
      return null;
    }
    
    try {
      // First, search for relevant knowledge
      const filters: any = {};
      if (options.useTag) {
        filters.tags = [options.useTag];
      }
      
      const searchResults = await this.search({
        query: `${emailContent.subject}\n\n${emailContent.body}`,
        filters,
        topK: options.maxReferences || 5
      });
      
      if (searchResults.length === 0) {
        return null;
      }
      
      // Generate response using the completion model
      const prompt = `
You are an AI assistant tasked with drafting an email response based on the following email and relevant knowledge.

Original Email:
Subject: ${emailContent.subject}
From: ${emailContent.from}
Body: ${emailContent.body}

Relevant Knowledge:
${searchResults.map((result, index) => 
  `[${index + 1}] ${result.metadata.title || 'Document'}: ${result.content.substring(0, 300)}...`
).join('\n\n')}

Draft a professional and helpful response that addresses the questions or concerns in the original email using the relevant knowledge provided.
Include a subject line and email body. Be concise but thorough.
`;

      const response = await axios.post(
        `${this.apiUrl}/completions`,
        {
          prompt,
          model: this.completionModel,
          max_tokens: 1000,
          temperature: 0.7
        },
        { headers: this.getHeaders() }
      );
      
      const generatedText = (response.data as { choices: Array<{ text: string }> }).choices[0].text;
      
      // Parse the generated text to extract subject and body
      const subjectMatch = generatedText.match(/Subject:(.+?)(?:\n|$)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Re: ' + emailContent.subject;
      
      // Remove the subject line to get the body
      const body = generatedText.replace(/Subject:.+?(?:\n|$)/i, '').trim();
      
      return {
        subject,
        body,
        references: searchResults.map(result => ({
          title: result.metadata.title || 'Document',
          content: result.content.substring(0, 300) + '...',
          source: result.metadata.source,
          relevanceScore: result.score
        }))
      };
    } catch (error) {
      return handleServiceError('archon', error, null);
    }
  }

  /**
   * Search the knowledge base with specific tags
   */
  async searchKnowledge(query: string, tags: string[] = []): Promise<Array<{content: string; metadata: any}>> {
    if (!this.isAvailable) {
      if (this.useMockData) {
        return getMockData('archon', 'knowledgeBase').searchResults || [];
      }
      return [];
    }
    
    try {
      const searchResults = await this.search({
        query,
        filters: { tags },
        topK: 5
      });
      
      return searchResults;
    } catch (error) {
      return handleServiceError('archon', error, []);
    }
  }

  /**
   * Get available sources in the knowledge base
   */
  async getSources(): Promise<Array<{id: string; name: string; documentCount: number}>> {
    if (!this.isAvailable) {
      if (this.useMockData) {
        return getMockData('archon', 'knowledgeBase').sources || [];
      }
      return [];
    }
    
    try {
      const response = await axios.get(
        `${this.apiUrl}/sources`,
        { headers: this.getHeaders() }
      );
      
      return (response.data as { sources: { id: string; name: string; documentCount: number; }[] }).sources;
    } catch (error) {
      return handleServiceError('archon', error, []);
    }
  }

  /**
   * Setup continuous email storage from Gmail
   */
  async setupContinuousEmailStorage(
    gmailConfig: any,
    options: { 
      storageInterval: number; // in minutes
      includeAttachments: boolean;
      labelToMonitor?: string;
    }
  ): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }
    
    try {
      const response = await axios.post(
        `${this.apiUrl}/integrations/gmail`,
        {
          gmailConfig,
          options: {
            ...options,
            vectorDb: this.vectorDb,
            embeddingModel: this.embeddingModel
          }
        },
        { headers: this.getHeaders() }
      );
      
      return response.status === 200;
    } catch (error) {
      return handleServiceError('archon', error, false);
    }
  }
}

// Helper function to create an Archon service from stored config
export const createArchonService = async (): Promise<ArchonService | null> => {
  try {
    // Get configuration from service config
    const serviceConfig = getServiceConfig('archon');
    
    // Check if service is configured
    if (!serviceConfig.enabled || !serviceConfig.baseUrl) {
      console.warn('Archon service is not configured');
      return null;
    }
    
    // Create config for Archon service
    const config: ArchonConfig = {
      apiUrl: serviceConfig.baseUrl,
      apiKey: serviceConfig.apiKey || '',
      vectorDb: serviceConfig.vectorDb || 'pinecone',
      embeddingModel: serviceConfig.embeddingModel || 'text-embedding-ada-002',
      completionModel: serviceConfig.completionModel || 'gpt-4-turbo'
    };
    
    // Create service instance
    const archonService = new ArchonService(config);
    
    // Test connection (but don't fail if it doesn't connect)
    await archonService.testConnection();
    
    return archonService;
  } catch (error) {
    handleServiceError('archon', error, null);
    
    // Return a service instance anyway, it will use mock data in development
    if (process.env.NODE_ENV === 'development') {
      const config: ArchonConfig = {
        apiUrl: 'http://localhost:8000',
        apiKey: 'mock-key',
        vectorDb: 'pinecone',
        embeddingModel: 'text-embedding-ada-002',
        completionModel: 'gpt-4-turbo'
      };
      return new ArchonService(config);
    }
    
    return null;
  }
};
