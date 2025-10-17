import axios from 'axios';

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'checklist' | 'update' | 'notification';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignee?: string;
  dueDate?: string;
  checklistItems?: Array<{
    id: string;
    text: string;
    checked: boolean;
  }>;
  automations?: Array<{
    name: string;
    trigger: {
      type: string;
      configuration: any;
    };
    actions: Array<{
      type: string;
      configuration: any;
    }>;
  }>;
}

export interface JiraPlaybook {
  id: string;
  name: string;
  description: string;
  projectKey: string;
  steps: PlaybookStep[];
  workflowId?: string;
  templateIssueKey?: string;
  createdAt: string;
  updatedAt: string;
}

export class JiraPlaybooksService {
  private jiraConfig: JiraConfig;
  private playbooks: JiraPlaybook[] = [];

  constructor(jiraConfig: JiraConfig) {
    this.jiraConfig = jiraConfig;
    this.loadFromLocalStorage();
  }

  /**
   * Load playbooks from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const playbooksJson = localStorage.getItem('jira-playbooks');
      if (playbooksJson) {
        this.playbooks = JSON.parse(playbooksJson);
      }
    } catch (error) {
      console.error('Error loading Jira playbooks from localStorage:', error);
    }
  }

  /**
   * Save playbooks to localStorage
   */
  private savePlaybooksToLocalStorage(): void {
    try {
      localStorage.setItem('jira-playbooks', JSON.stringify(this.playbooks));
    } catch (error) {
      console.error('Error saving Jira playbooks to localStorage:', error);
    }
  }

  /**
   * Get Jira API client with authentication
   */
  private getJiraClient() {
    const auth = Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64');
    
    return axios.create({
      baseURL: `https://${this.jiraConfig.domain}.atlassian.net/rest/api/3`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Test the Jira connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = this.getJiraClient();
      const response = await client.get('/myself');
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Jira:', error);
      return false;
    }
  }

  /**
   * Get all playbooks
   */
  getPlaybooks(): JiraPlaybook[] {
    return [...this.playbooks];
  }

  /**
   * Get a specific playbook by ID
   */
  getPlaybookById(id: string): JiraPlaybook | undefined {
    return this.playbooks.find(playbook => playbook.id === id);
  }

  /**
   * Create a new playbook
   */
  async createPlaybook(playbook: Omit<JiraPlaybook, 'id' | 'createdAt' | 'updatedAt' | 'workflowId' | 'templateIssueKey'>): Promise<JiraPlaybook> {
    try {
      const client = this.getJiraClient();
      
      // 1. Create a workflow in Jira
      const workflowName = `${playbook.name} Workflow`;
      const workflowResponse = await client.post('/workflow', {
        name: workflowName,
        description: `Workflow for ${playbook.name}`,
        statuses: playbook.steps.map(step => ({
          id: step.id,
          name: step.name,
          statusCategory: 'IN_PROGRESS'
        })),
        transitions: playbook.steps.map((step, index, steps) => {
          if (index < steps.length - 1) {
            return {
              name: `Move to ${steps[index + 1].name}`,
              from: [step.id],
              to: steps[index + 1].id
            };
          }
          return null;
        }).filter(Boolean)
      });
      
      interface WorkflowResponse {
        id: string;
        name: string;
      }
      
      // 2. Create a template issue with subtasks
      const templateResponse = await client.post('/issue', {
        fields: {
          project: { key: playbook.projectKey },
          summary: `[Template] ${playbook.name}`,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: playbook.description || `Template for ${playbook.name} process`
              }]
            }]
          },
          issuetype: { name: 'Task' },
          labels: ['template', 'playbook']
        }
      });
      
      interface IssueResponse {
        id: string;
        key: string;
      }
      
      // 3. Create subtasks for each step
      for (const step of playbook.steps) {
        await client.post('/issue', {
          fields: {
            project: { key: playbook.projectKey },
            summary: step.name,
            description: {
              type: 'doc',
              version: 1,
              content: [{
                type: 'paragraph',
                content: [{
                  type: 'text',
                  text: step.description || ''
                }]
              }]
            },
            issuetype: { name: 'Sub-task' },
            parent: { key: (templateResponse.data as IssueResponse).key }
          }
        });
      }
      
      // 4. Create automation rules for each step
      for (const step of playbook.steps) {
        if (step.automations) {
          for (const automation of step.automations) {
            await client.post('/workflow/rule', {
              name: `${playbook.name} - ${step.name} - ${automation.name}`,
              projectKey: playbook.projectKey,
              trigger: {
                component: 'TRIGGER',
                schemaVersion: 1,
                type: automation.trigger.type,
                configuration: automation.trigger.configuration
              },
              actions: automation.actions.map(action => ({
                component: 'ACTION',
                schemaVersion: 1,
                type: action.type,
                configuration: action.configuration
              }))
            });
          }
        }
      }
      
      // 5. Create and save the playbook locally
      const newPlaybook: JiraPlaybook = {
        ...playbook,
        id: `playbook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        workflowId: (workflowResponse.data as WorkflowResponse).id,
        templateIssueKey: (templateResponse.data as IssueResponse).key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.playbooks.push(newPlaybook);
      this.savePlaybooksToLocalStorage();
      
      return newPlaybook;
    } catch (error) {
      console.error('Error creating Jira playbook:', error);
      throw new Error('Failed to create Jira playbook');
    }
  }

  /**
   * Create a new instance of a playbook
   */
  async createPlaybookInstance(playbookId: string, name: string, description: string, assignee?: string): Promise<string> {
    try {
      const playbook = this.getPlaybookById(playbookId);
      if (!playbook) {
        throw new Error('Playbook not found');
      }
      
      const client = this.getJiraClient();
      
      interface IssueResponse {
        id: string;
        key: string;
      }
      
      // Create a new issue based on the template
      const issueResponse = await client.post('/issue', {
        fields: {
          project: { key: playbook.projectKey },
          summary: name,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: description || `Instance of ${playbook.name} playbook`
              }]
            }]
          },
          issuetype: { name: 'Task' },
          labels: ['playbook-instance', playbook.name.toLowerCase().replace(/\s+/g, '-')],
          assignee: assignee ? { name: assignee } : undefined
        }
      });
      
      const issueKey = (issueResponse.data as IssueResponse).key;
      
      // Create subtasks for each step
      for (const step of playbook.steps) {
        await client.post('/issue', {
          fields: {
            project: { key: playbook.projectKey },
            summary: step.name,
            description: {
              type: 'doc',
              version: 1,
              content: [{
                type: 'paragraph',
                content: [{
                  type: 'text',
                  text: step.description || ''
                }]
              }]
            },
            issuetype: { name: 'Sub-task' },
            parent: { key: issueKey },
            assignee: assignee ? { name: assignee } : undefined
          }
        });
      }
      
      return issueKey;
    } catch (error) {
      console.error('Error creating Jira playbook instance:', error);
      throw new Error('Failed to create Jira playbook instance');
    }
  }

  /**
   * Convert a Mattermost-style playbook to a Jira playbook
   */
  convertMattermostPlaybook(mattermostPlaybook: any, projectKey: string): Omit<JiraPlaybook, 'id' | 'createdAt' | 'updatedAt' | 'workflowId' | 'templateIssueKey'> {
    // Map Mattermost playbook steps to Jira playbook steps
    const steps = mattermostPlaybook.steps.map((step: any) => {
      const jiraStep: PlaybookStep = {
        id: step.id,
        name: step.title,
        description: step.description || '',
        type: step.type,
        status: 'pending',
      };
      
      if (step.checklistItems) {
        jiraStep.checklistItems = step.checklistItems.map((item: any) => ({
          id: item.id,
          text: item.text,
          checked: false,
        }));
      }
      
      // Add automation for scheduled updates if present
      if (step.updatePrompt) {
        jiraStep.automations = [{
          name: 'Scheduled Update',
          trigger: {
            type: 'time-based',
            configuration: {
              schedule: '0 0 9 * * ?', // Daily at 9am
            }
          },
          actions: [{
            type: 'add-comment',
            configuration: {
              comment: step.updatePrompt
            }
          }]
        }];
      }
      
      return jiraStep;
    });
    
    return {
      name: mattermostPlaybook.name,
      description: mattermostPlaybook.description,
      projectKey,
      steps,
    };
  }

  /**
   * Delete a playbook
   */
  async deletePlaybook(id: string): Promise<boolean> {
    try {
      const playbook = this.getPlaybookById(id);
      if (!playbook) {
        return false;
      }
      
      const client = this.getJiraClient();
      
      // Delete the workflow if it exists
      if (playbook.workflowId) {
        await client.delete(`/workflow/${playbook.workflowId}`);
      }
      
      // Delete the template issue if it exists
      if (playbook.templateIssueKey) {
        await client.delete(`/issue/${playbook.templateIssueKey}`);
      }
      
      // Remove from local storage
      const initialLength = this.playbooks.length;
      this.playbooks = this.playbooks.filter(p => p.id !== id);
      
      if (this.playbooks.length !== initialLength) {
        this.savePlaybooksToLocalStorage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting Jira playbook:', error);
      throw new Error('Failed to delete Jira playbook');
    }
  }
}

// Helper function to create a JiraPlaybooksService
export const createJiraPlaybooksService = (jiraConfig: JiraConfig): JiraPlaybooksService => {
  return new JiraPlaybooksService(jiraConfig);
};
