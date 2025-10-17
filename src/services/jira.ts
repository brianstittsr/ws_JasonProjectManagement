import axios from 'axios';

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIssue {
  key?: string;
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description: string;
    issuetype: {
      id: string;
    };
    [key: string]: any;
  };
}

export interface JiraComment {
  body: string;
  public?: boolean;
}

export interface JiraFollowUp {
  issueKey: string;
  message: string;
  channel: 'slack' | 'whatsapp' | 'email';
  recipient: string;
}

export class JiraService {
  private domain: string;
  private auth: {
    username: string;
    password: string;
  };
  private projectKey: string;

  constructor(config: JiraConfig) {
    this.domain = config.domain.endsWith('/') ? config.domain : `${config.domain}/`;
    this.auth = {
      username: config.email,
      password: config.apiToken,
    };
    this.projectKey = config.projectKey;
  }

  private getApiUrl(endpoint: string): string {
    return `${this.domain}rest/api/3/${endpoint}`;
  }

  /**
   * Test the Jira connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(this.getApiUrl('myself'), {
        auth: this.auth,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Jira:', error);
      return false;
    }
  }

  /**
   * Get available issue types for the project
   */
  async getIssueTypes(): Promise<any[]> {
    try {
      const response = await axios.get(this.getApiUrl(`project/${this.projectKey}/statuses`), {
        auth: this.auth,
      });
      return response.data as any[];
    } catch (error) {
      console.error('Failed to get issue types:', error);
      return [];
    }
  }

  /**
   * Create a new issue in Jira
   */
  async createIssue(summary: string, description: string | any, issueTypeId: string = '10001'): Promise<string | null> {
    try {
      const issue: JiraIssue = {
        fields: {
          project: {
            key: this.projectKey,
          },
          summary,
          description: typeof description === 'string' ? {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description,
                  },
                ],
              },
            ],
          } : description,
          issuetype: {
            id: issueTypeId, // Default to Task (10001)
          },
        },
      };

      const response = await axios.post(this.getApiUrl('issue'), issue, {
        auth: this.auth,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return (response.data as { key: string }).key;
    } catch (error) {
      console.error('Failed to create Jira issue:', error);
      return null;
    }
  }

  /**
   * Convert transcript content to Jira issues
   * @param transcript The transcript content to parse
   * @param issueTypeId The issue type ID (default: Task)
   * @returns Array of created issue keys
   */
  async convertTranscriptToIssues(transcript: string, issueTypeId: string = '10001'): Promise<string[]> {
    // Simple parsing logic - extract action items or tasks from transcript
    // This can be enhanced with more sophisticated NLP in a real implementation
    const actionItemRegex = /(?:action item|task|todo):\s*(.+?)(?:\n|$)/gi;
    
    // Alternative approach to avoid using matchAll which requires downlevelIteration
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = actionItemRegex.exec(transcript)) !== null) {
      matches.push(match);
    }
    
    const createdIssues: string[] = [];
    
    for (const match of matches) {
      const taskDescription = match[1].trim();
      if (taskDescription) {
        const issueKey = await this.createIssue(
          `Task: ${taskDescription.substring(0, 50)}${taskDescription.length > 50 ? '...' : ''}`,
          `Created from transcript:\n\n${taskDescription}`,
          issueTypeId
        );
        
        if (issueKey) {
          createdIssues.push(issueKey);
        }
      }
    }
    
    return createdIssues;
  }

  /**
   * Convert email content to a Jira issue
   * @param email The email content to convert
   * @param issueTypeId The issue type ID (default: Task)
   * @returns Created issue key or null
   */
  async convertEmailToIssue(email: { subject: string; from: string; body: string }, issueTypeId: string = '10001'): Promise<string | null> {
    try {
      const summary = `Email: ${email.subject}`;
      const description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `From: ${email.from}\n\n${email.body}`,
              },
            ],
          },
        ],
      };

      return await this.createIssue(summary, description, issueTypeId);
    } catch (error) {
      console.error('Failed to convert email to Jira issue:', error);
      return null;
    }
  }

  /**
   * Add a comment to a Jira issue
   * @param issueKey The issue key
   * @param comment The comment to add
   * @returns Success status
   */
  async addComment(issueKey: string, comment: JiraComment): Promise<boolean> {
    try {
      await axios.post(
        this.getApiUrl(`issue/${issueKey}/comment`),
        comment,
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (error) {
      console.error(`Failed to add comment to issue ${issueKey}:`, error);
      return false;
    }
  }

  /**
   * Create a follow-up for a Jira issue
   * This method creates a comment on the issue and records the follow-up request
   * @param followUp The follow-up details
   * @returns Success status
   */
  async createFollowUp(followUp: JiraFollowUp): Promise<boolean> {
    try {
      // Add a comment to the issue about the follow-up
      const commentAdded = await this.addComment(followUp.issueKey, {
        body: `Follow-up requested via ${followUp.channel} to ${followUp.recipient}:\n${followUp.message}`,
      });

      if (!commentAdded) {
        return false;
      }

      // In a real implementation, you would integrate with the respective services here
      // For now, we'll just log the follow-up request
      console.log('Follow-up created:', followUp);

      return true;
    } catch (error) {
      console.error(`Failed to create follow-up for issue ${followUp.issueKey}:`, error);
      return false;
    }
  }
}

// Helper function to create a Jira service from stored config
export const createJiraService = async (config: JiraConfig): Promise<JiraService | null> => {
  try {
    const jiraService = new JiraService(config);
    const isConnected = await jiraService.testConnection();
    
    if (isConnected) {
      return jiraService;
    }
    return null;
  } catch (error) {
    console.error('Failed to create Jira service:', error);
    return null;
  }
};
