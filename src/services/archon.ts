import axios from 'axios';

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

  constructor(config: ArchonConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.vectorDb = config.vectorDb;
    this.embeddingModel = config.embeddingModel;
    this.completionModel = config.completionModel;
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
        headers: this.getHeaders()
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Archon:', error);
      return false;
    }
  }

  /**
   * Store a document in the Archon knowledgebase
   */
  async storeDocument(document: ArchonDocument): Promise<string | null> {
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
      console.error('Failed to store document in Archon:', error);
      return null;
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
    try {
      // Store the email content
      const emailDocument: ArchonDocument = {
        content: `Subject: ${email.subject}\nFrom: ${email.from}\nTo: ${email.to}\nDate: ${email.date}\n\n${email.body}`,
        metadata: {
          source: email.threadId || 'email',
          sourceType: 'email',
          tags: ['email', 'correspondence'],
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
              tags: ['email-attachment', 'document'],
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
      console.error('Failed to store email in Archon:', error);
      return null;
    }
  }

  /**
   * Search the Archon knowledgebase
   */
  async search(query: ArchonQuery): Promise<any[]> {
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
      console.error('Failed to search Archon knowledgebase:', error);
      return [];
    }
  }

  /**
   * Generate a response draft based on an email and the knowledgebase
   */
  async generateResponseDraft(
    emailContent: { subject: string; body: string; from: string },
    options: { useTag?: string; maxReferences?: number } = {}
  ): Promise<ArchonResponseDraft | null> {
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
      console.error('Failed to generate response draft:', error);
      return null;
    }
  }

  /**
   * Search the knowledge base with specific tags
   */
  async searchKnowledge(query: string, tags: string[] = []): Promise<Array<{content: string; metadata: any}>> {
    try {
      const searchResults = await this.search({
        query,
        filters: { tags },
        topK: 5
      });
      
      return searchResults;
    } catch (error) {
      console.error('Failed to search knowledge with tags:', error);
      return [];
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
      console.error('Failed to setup continuous email storage:', error);
      return false;
    }
  }
}

// Helper function to create an Archon service from stored config
export const createArchonService = async (): Promise<ArchonService | null> => {
  try {
    const config: ArchonConfig = {
      apiUrl: process.env.REACT_APP_ARCHON_API_URL || '',
      apiKey: process.env.REACT_APP_ARCHON_API_KEY || '',
      vectorDb: process.env.REACT_APP_ARCHON_VECTOR_DB || 'pinecone',
      embeddingModel: process.env.REACT_APP_ARCHON_EMBEDDING_MODEL || 'text-embedding-ada-002',
      completionModel: process.env.REACT_APP_ARCHON_COMPLETION_MODEL || 'gpt-4-turbo'
    };
    
    if (!config.apiUrl || !config.apiKey) {
      console.error('Archon configuration is incomplete');
      return null;
    }
    
    const archonService = new ArchonService(config);
    const isConnected = await archonService.testConnection();
    
    if (isConnected) {
      return archonService;
    }
    return null;
  } catch (error) {
    console.error('Failed to create Archon service:', error);
    return null;
  }
};
