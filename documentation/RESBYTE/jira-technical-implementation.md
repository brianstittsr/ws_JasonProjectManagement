# Jira Integration Technical Implementation Guide

## Architecture Overview

The Resbyte.ai platform integrates with Jira using a combination of REST API calls and webhooks. This document provides technical details for developers implementing or extending the Jira integration, with a focus on Kanban board updates.

```
┌─────────────────┐      ┌───────────────┐      ┌─────────────┐
│                 │      │               │      │             │
│  Resbyte.ai     │◄────►│  Jira Service │◄────►│  Jira Cloud │
│  Platform       │      │               │      │             │
│                 │      └───────────────┘      └─────────────┘
└─────────────────┘             │                      ▲
        │                       │                      │
        ▼                       ▼                      │
┌─────────────────┐      ┌───────────────┐      ┌─────────────┐
│                 │      │               │      │             │
│  UI Components  │◄────►│  Webhook      │◄────►│  Jira       │
│                 │      │  Handlers     │      │  Webhooks   │
└─────────────────┘      └───────────────┘      └─────────────┘
```

## Core Components

### 1. JiraService (`src/services/jira.ts`)

The `JiraService` class handles all direct communication with the Jira API.

```typescript
export class JiraService {
  private baseUrl: string;
  private auth: string;
  private projectKey: string;

  constructor(config: JiraConfig) {
    this.baseUrl = `https://${config.domain}/rest/api/3`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.projectKey = config.projectKey;
  }

  // API methods
  async getIssue(issueKey: string): Promise<JiraIssue> { /* ... */ }
  async createIssue(issue: JiraIssueCreate): Promise<JiraIssue> { /* ... */ }
  async updateIssue(issueKey: string, fields: JiraIssueUpdate): Promise<JiraIssue> { /* ... */ }
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> { /* ... */ }
  async getTransitions(issueKey: string): Promise<JiraTransition[]> { /* ... */ }
  async getBoard(boardId: string): Promise<JiraBoard> { /* ... */ }
  async getBoardConfiguration(boardId: string): Promise<JiraBoardConfig> { /* ... */ }
  async getIssuesForBoard(boardId: string): Promise<JiraIssue[]> { /* ... */ }
  // ... other methods
}
```

### 2. JiraKanbanService (`src/services/jiraKanban.ts`)

The `JiraKanbanService` provides higher-level functions specifically for Kanban board operations.

```typescript
export class JiraKanbanService {
  private jiraService: JiraService;
  private statusMapping: Record<string, string>;
  private boardId: string;

  constructor(jiraService: JiraService, boardId: string, statusMapping: Record<string, string>) {
    this.jiraService = jiraService;
    this.boardId = boardId;
    this.statusMapping = statusMapping;
  }

  // Kanban methods
  async getKanbanBoard(): Promise<KanbanBoard> { /* ... */ }
  async moveIssueToColumn(issueKey: string, columnId: string): Promise<boolean> { /* ... */ }
  async getColumnForIssue(issueKey: string): Promise<string> { /* ... */ }
  async syncBoardFromJira(): Promise<KanbanBoard> { /* ... */ }
  async syncIssueToJira(issueKey: string, columnId: string): Promise<boolean> { /* ... */ }
  // ... other methods
}
```

### 3. JiraWebhookHandler (`src/services/jiraWebhook.ts`)

The `JiraWebhookHandler` processes incoming webhook events from Jira.

```typescript
export class JiraWebhookHandler {
  private secretKey: string;
  private eventHandlers: Record<string, (payload: any) => Promise<void>>;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.eventHandlers = {
      'jira:issue_created': this.handleIssueCreated.bind(this),
      'jira:issue_updated': this.handleIssueUpdated.bind(this),
      'jira:issue_deleted': this.handleIssueDeleted.bind(this),
      // ... other event handlers
    };
  }

  // Webhook handling methods
  async validateWebhook(headers: Record<string, string>, body: string): Promise<boolean> { /* ... */ }
  async processWebhook(event: string, payload: any): Promise<void> { /* ... */ }
  private async handleIssueCreated(payload: any): Promise<void> { /* ... */ }
  private async handleIssueUpdated(payload: any): Promise<void> { /* ... */ }
  private async handleIssueDeleted(payload: any): Promise<void> { /* ... */ }
  // ... other methods
}
```

## Implementation Details

### Kanban Board Status Mapping

The platform maps internal status columns to Jira statuses and transitions:

```typescript
// Example status mapping
const statusMapping = {
  'todo': {
    jiraStatusId: '10000',
    jiraStatusName: 'To Do',
    transitionId: '11'
  },
  'in-progress': {
    jiraStatusId: '10001',
    jiraStatusName: 'In Progress',
    transitionId: '21'
  },
  'review': {
    jiraStatusId: '10002',
    jiraStatusName: 'Review',
    transitionId: '31'
  },
  'done': {
    jiraStatusId: '10003',
    jiraStatusName: 'Done',
    transitionId: '41'
  }
};
```

### Moving Issues on the Kanban Board

When a user drags an issue to a different column on the Kanban board:

```typescript
// In KanbanBoard.tsx component
const handleIssueDrop = async (issueId: string, columnId: string) => {
  try {
    // Update local state for immediate feedback
    setIssues(currentIssues => {
      // Update issue column in local state
      return currentIssues.map(issue => 
        issue.id === issueId ? { ...issue, columnId } : issue
      );
    });
    
    // Sync with Jira
    const success = await jiraKanbanService.moveIssueToColumn(issueId, columnId);
    
    if (!success) {
      // Revert local state if Jira update failed
      setIssues(currentIssues => {
        // Revert to original column
        return currentIssues.map(issue => 
          issue.id === issueId ? { ...issue, columnId: issue.originalColumnId } : issue
        );
      });
      
      // Show error notification
      notificationService.error('Failed to update issue status in Jira');
    }
  } catch (error) {
    console.error('Error moving issue:', error);
    notificationService.error('An error occurred while updating the issue');
  }
};
```

### Jira Issue Transition Implementation

To move an issue to a different status in Jira:

```typescript
async moveIssueToColumn(issueKey: string, columnId: string): Promise<boolean> {
  try {
    // Get the mapping for the target column
    const statusMapping = this.statusMapping[columnId];
    if (!statusMapping) {
      console.error(`No status mapping found for column: ${columnId}`);
      return false;
    }
    
    // Get current transitions available for the issue
    const transitions = await this.jiraService.getTransitions(issueKey);
    
    // Find the transition that matches our target status
    const transition = transitions.find(t => 
      t.to.id === statusMapping.jiraStatusId || 
      t.id === statusMapping.transitionId
    );
    
    if (!transition) {
      console.error(`No valid transition found for issue ${issueKey} to status ${statusMapping.jiraStatusName}`);
      return false;
    }
    
    // Execute the transition
    await this.jiraService.transitionIssue(issueKey, transition.id);
    return true;
  } catch (error) {
    console.error(`Error moving issue ${issueKey} to column ${columnId}:`, error);
    return false;
  }
}
```

### Handling Jira Webhook Events

When Jira sends a webhook event for an issue status change:

```typescript
private async handleIssueUpdated(payload: any): Promise<void> {
  try {
    const issueKey = payload.issue.key;
    const changelog = payload.changelog;
    
    // Check if this update includes a status change
    const statusChange = changelog.items.find(item => item.field === 'status');
    if (!statusChange) {
      return; // Not a status change, ignore
    }
    
    // Find the corresponding column ID for this status
    const newStatusId = statusChange.to;
    const columnId = Object.entries(this.statusMapping)
      .find(([_, mapping]) => mapping.jiraStatusId === newStatusId)?.[0];
    
    if (!columnId) {
      console.warn(`No column mapping found for Jira status ID: ${newStatusId}`);
      return;
    }
    
    // Update the issue in our system
    await this.kanbanStore.updateIssueColumn(issueKey, columnId);
    
    // Notify any subscribers (e.g., WebSocket clients)
    this.eventBus.emit('issue:moved', { issueKey, columnId });
  } catch (error) {
    console.error('Error handling issue updated webhook:', error);
  }
}
```

## Authentication and Security

### API Authentication

The Jira API uses Basic Authentication with an API token:

```typescript
private getHeaders(): Record<string, string> {
  return {
    'Authorization': `Basic ${this.auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

async getIssue(issueKey: string): Promise<JiraIssue> {
  const response = await axios.get(`${this.baseUrl}/issue/${issueKey}`, {
    headers: this.getHeaders()
  });
  return response.data;
}
```

### Webhook Security

Webhooks are secured using a shared secret key:

```typescript
async validateWebhook(headers: Record<string, string>, body: string): Promise<boolean> {
  // Get the secret from headers
  const providedSecret = headers['x-resbyte-secret'];
  
  if (!providedSecret) {
    console.warn('Webhook request missing secret header');
    return false;
  }
  
  // Simple comparison (in production, use a time-constant comparison)
  return providedSecret === this.secretKey;
}
```

## Error Handling and Retries

For robustness, the integration includes error handling and retry logic:

```typescript
async moveIssueToColumn(issueKey: string, columnId: string): Promise<boolean> {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Attempt to move the issue
      const result = await this._moveIssueToColumn(issueKey, columnId);
      return result;
    } catch (error) {
      retries++;
      
      // Check if we should retry
      if (retries >= maxRetries) {
        console.error(`Failed to move issue after ${maxRetries} attempts:`, error);
        return false;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      console.warn(`Retrying move issue after ${delay}ms (attempt ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
}
```

## Caching Strategy

To improve performance and reduce API calls to Jira:

```typescript
export class JiraCache {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Testing

### Unit Tests

Example unit test for the `moveIssueToColumn` method:

```typescript
describe('JiraKanbanService', () => {
  let jiraService: JiraService;
  let kanbanService: JiraKanbanService;
  
  beforeEach(() => {
    // Mock Jira service
    jiraService = {
      getTransitions: jest.fn(),
      transitionIssue: jest.fn()
    } as unknown as JiraService;
    
    // Create service with test board ID and status mapping
    kanbanService = new JiraKanbanService(
      jiraService,
      'BOARD-123',
      {
        'todo': { jiraStatusId: '10000', jiraStatusName: 'To Do', transitionId: '11' },
        'in-progress': { jiraStatusId: '10001', jiraStatusName: 'In Progress', transitionId: '21' }
      }
    );
  });
  
  it('should move an issue to a new column', async () => {
    // Mock the transitions response
    (jiraService.getTransitions as jest.Mock).mockResolvedValue([
      { id: '21', to: { id: '10001', name: 'In Progress' } }
    ]);
    
    // Mock the transition call
    (jiraService.transitionIssue as jest.Mock).mockResolvedValue(undefined);
    
    // Call the method
    const result = await kanbanService.moveIssueToColumn('RES-123', 'in-progress');
    
    // Verify the result
    expect(result).toBe(true);
    expect(jiraService.getTransitions).toHaveBeenCalledWith('RES-123');
    expect(jiraService.transitionIssue).toHaveBeenCalledWith('RES-123', '21');
  });
  
  it('should handle missing transition', async () => {
    // Mock empty transitions
    (jiraService.getTransitions as jest.Mock).mockResolvedValue([]);
    
    // Call the method
    const result = await kanbanService.moveIssueToColumn('RES-123', 'in-progress');
    
    // Verify the result
    expect(result).toBe(false);
    expect(jiraService.transitionIssue).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

Example integration test for the Jira webhook handler:

```typescript
describe('JiraWebhookHandler Integration', () => {
  let handler: JiraWebhookHandler;
  let kanbanStore: KanbanStore;
  
  beforeEach(() => {
    // Mock the Kanban store
    kanbanStore = {
      updateIssueColumn: jest.fn().mockResolvedValue(true)
    } as unknown as KanbanStore;
    
    // Create the handler with test secret
    handler = new JiraWebhookHandler('test-secret');
    handler.setKanbanStore(kanbanStore);
  });
  
  it('should process issue updated webhook', async () => {
    // Mock webhook payload
    const payload = {
      webhookEvent: 'jira:issue_updated',
      issue: {
        key: 'RES-123'
      },
      changelog: {
        items: [
          {
            field: 'status',
            from: '10000',
            fromString: 'To Do',
            to: '10001',
            toString: 'In Progress'
          }
        ]
      }
    };
    
    // Process the webhook
    await handler.processWebhook('jira:issue_updated', payload);
    
    // Verify the Kanban store was updated
    expect(kanbanStore.updateIssueColumn).toHaveBeenCalledWith('RES-123', 'in-progress');
  });
});
```

## Performance Considerations

1. **Batch Updates**: When syncing multiple issues, use batch operations where possible
2. **Pagination**: Use pagination for large board retrievals
3. **Caching**: Cache board configurations and rarely-changing data
4. **Debouncing**: Debounce UI updates to prevent excessive API calls
5. **Background Processing**: Process webhook events asynchronously

## Deployment Considerations

1. **API Rate Limits**: Be aware of Jira Cloud API rate limits (typically 1000 requests per hour)
2. **Webhook Reliability**: Implement retry logic for webhook delivery failures
3. **Error Monitoring**: Set up monitoring for integration errors
4. **Logging**: Implement detailed logging for troubleshooting
5. **Backup**: Maintain local copies of critical Jira data

## Extending the Integration

### Adding Custom Fields

To support custom fields in Jira:

```typescript
// Define custom field interface
interface CustomFields {
  [key: string]: any;
  'customfield_10001'?: string; // Story Points
  'customfield_10002'?: { value: string }; // Custom Dropdown
}

// Extend the issue create interface
interface JiraIssueCreateWithCustomFields extends JiraIssueCreate {
  fields: JiraIssueCreate['fields'] & CustomFields;
}

// Use in create method
async createIssueWithCustomFields(issue: JiraIssueCreateWithCustomFields): Promise<JiraIssue> {
  return this.jiraService.createIssue(issue);
}
```

### Supporting Multiple Boards

To work with multiple Kanban boards:

```typescript
export class JiraMultiBoardService {
  private boards: Map<string, JiraKanbanService> = new Map();
  private jiraService: JiraService;
  
  constructor(jiraService: JiraService) {
    this.jiraService = jiraService;
  }
  
  async addBoard(boardId: string, name: string): Promise<void> {
    // Get board configuration from Jira
    const boardConfig = await this.jiraService.getBoardConfiguration(boardId);
    
    // Extract status mappings from configuration
    const statusMapping = this.extractStatusMappings(boardConfig);
    
    // Create and store board service
    const boardService = new JiraKanbanService(this.jiraService, boardId, statusMapping);
    this.boards.set(boardId, boardService);
  }
  
  getBoard(boardId: string): JiraKanbanService | undefined {
    return this.boards.get(boardId);
  }
  
  private extractStatusMappings(boardConfig: JiraBoardConfig): Record<string, any> {
    // Extract status mappings from board configuration
    // ...implementation
  }
}
```

## Conclusion

This technical implementation guide provides the foundation for integrating the Resbyte.ai platform with Jira Kanban boards. By following these patterns and best practices, developers can create a robust, performant, and maintainable integration that enables seamless workflow management across both systems.
