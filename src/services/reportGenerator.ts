import axios from 'axios';
import { JiraConfig } from './jira';

export interface ReportConfig {
  title: string;
  description: string;
  jqlQueries: {
    name: string;
    query: string;
    limit: number;
  }[];
  includeMetrics: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
}

export interface ReportRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM in 24-hour format
  days: string[]; // Days of week for weekly reports, or days of month for monthly
  timezone: string;
}

export interface ReportData {
  id: string;
  title: string;
  description: string;
  generatedAt: string;
  sections: {
    name: string;
    issues: {
      key: string;
      summary: string;
      status: string;
      assignee: string | null;
      priority: string;
      created: string;
      updated: string;
      dueDate: string | null;
      labels: string[];
      link: string;
    }[];
  }[];
  metrics: {
    totalIssues: number;
    issuesByStatus: Record<string, number>;
    issuesByAssignee: Record<string, number>;
    issuesByPriority: Record<string, number>;
    overdueTasks: number;
    completedToday: number;
    createdToday: number;
  } | null;
  summary: string | null;
}

export class ReportGeneratorService {
  private jiraConfig: JiraConfig;
  private auth: {
    username: string;
    password: string;
  };

  constructor(jiraConfig: JiraConfig) {
    this.jiraConfig = jiraConfig;
    this.auth = {
      username: jiraConfig.email,
      password: jiraConfig.apiToken,
    };
  }

  private getApiUrl(endpoint: string): string {
    const domain = this.jiraConfig.domain.endsWith('/') 
      ? this.jiraConfig.domain 
      : `${this.jiraConfig.domain}/`;
    return `${domain}rest/api/3/${endpoint}`;
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
   * Search for issues using JQL
   */
  private async searchIssues(jql: string, maxResults: number = 50): Promise<any[]> {
    try {
      const response = await axios.post(
        this.getApiUrl('search'),
        {
          jql,
          fields: [
            'summary', 
            'status', 
            'assignee', 
            'priority', 
            'created', 
            'updated', 
            'duedate', 
            'labels'
          ],
          maxResults
        },
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return (response.data as { issues?: any[] }).issues || [];
    } catch (error) {
      console.error('Failed to search for issues:', error);
      return [];
    }
  }

  /**
   * Generate a CEO report based on the provided configuration
   */
  async generateReport(config: ReportConfig): Promise<ReportData> {
    const reportId = `report-${Date.now()}`;
    const generatedAt = new Date().toISOString();
    
    // Generate sections based on JQL queries
    const sections = [];
    for (const jqlConfig of config.jqlQueries) {
      const issues = await this.searchIssues(jqlConfig.query, jqlConfig.limit);
      
      sections.push({
        name: jqlConfig.name,
        issues: issues.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name || 'Unknown',
          assignee: issue.fields.assignee?.displayName || null,
          priority: issue.fields.priority?.name || 'Unknown',
          created: issue.fields.created,
          updated: issue.fields.updated,
          dueDate: issue.fields.duedate || null,
          labels: issue.fields.labels || [],
          link: `${this.jiraConfig.domain}/browse/${issue.key}`
        }))
      });
    }
    
    // Generate metrics if requested
    let metrics = null;
    if (config.includeMetrics) {
      // Collect all issues from all sections
      const allIssues = sections.flatMap(section => section.issues);
      
      // Count issues by status
      const issuesByStatus: Record<string, number> = {};
      allIssues.forEach(issue => {
        issuesByStatus[issue.status] = (issuesByStatus[issue.status] || 0) + 1;
      });
      
      // Count issues by assignee
      const issuesByAssignee: Record<string, number> = {};
      allIssues.forEach(issue => {
        const assignee = issue.assignee || 'Unassigned';
        issuesByAssignee[assignee] = (issuesByAssignee[assignee] || 0) + 1;
      });
      
      // Count issues by priority
      const issuesByPriority: Record<string, number> = {};
      allIssues.forEach(issue => {
        issuesByPriority[issue.priority] = (issuesByPriority[issue.priority] || 0) + 1;
      });
      
      // Count overdue tasks
      const now = new Date();
      const overdueTasks = allIssues.filter(issue => {
        if (!issue.dueDate) return false;
        const dueDate = new Date(issue.dueDate);
        return dueDate < now && issue.status !== 'Done' && issue.status !== 'Completed';
      }).length;
      
      // Count tasks completed today
      const today = new Date().toISOString().split('T')[0];
      const completedToday = allIssues.filter(issue => {
        if (issue.status !== 'Done' && issue.status !== 'Completed') return false;
        const updatedDate = new Date(issue.updated).toISOString().split('T')[0];
        return updatedDate === today;
      }).length;
      
      // Count tasks created today
      const createdToday = allIssues.filter(issue => {
        const createdDate = new Date(issue.created).toISOString().split('T')[0];
        return createdDate === today;
      }).length;
      
      metrics = {
        totalIssues: allIssues.length,
        issuesByStatus,
        issuesByAssignee,
        issuesByPriority,
        overdueTasks,
        completedToday,
        createdToday
      };
    }
    
    // Generate summary if requested
    let summary = null;
    if (config.includeSummary) {
      // Create a simple text summary
      const allIssues = sections.flatMap(section => section.issues);
      const statusCounts = Object.entries(metrics?.issuesByStatus || {})
        .map(([status, count]) => `${status}: ${count}`)
        .join(', ');
      
      summary = `Daily CEO Report Summary (${new Date().toLocaleDateString()})\n\n` +
        `Total Issues: ${allIssues.length}\n` +
        `Status Breakdown: ${statusCounts}\n` +
        `Overdue Tasks: ${metrics?.overdueTasks || 0}\n` +
        `Completed Today: ${metrics?.completedToday || 0}\n` +
        `Created Today: ${metrics?.createdToday || 0}\n\n` +
        `Key Sections:\n` +
        sections.map(section => 
          `- ${section.name}: ${section.issues.length} issues`
        ).join('\n');
    }
    
    return {
      id: reportId,
      title: config.title,
      description: config.description,
      generatedAt,
      sections,
      metrics,
      summary
    };
  }

  /**
   * Generate an HTML representation of the report
   */
  generateHtmlReport(report: ReportData): string {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${report.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #1a73e8;
          }
          .report-header {
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
          }
          .report-section {
            margin-bottom: 30px;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .report-table th, .report-table td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          .report-table th {
            background-color: #f2f2f2;
          }
          .report-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .metrics-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 30px;
          }
          .metric-card {
            flex: 1;
            min-width: 200px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            background-color: #f9f9f9;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1a73e8;
          }
          .metric-label {
            font-size: 14px;
            color: #666;
          }
          .summary-box {
            background-color: #f0f7ff;
            border-left: 4px solid #1a73e8;
            padding: 15px;
            margin-bottom: 30px;
          }
          .priority-high {
            color: #d50000;
            font-weight: bold;
          }
          .priority-medium {
            color: #ff6d00;
          }
          .priority-low {
            color: #2e7d32;
          }
          .status-done {
            color: #2e7d32;
          }
          .status-progress {
            color: #1976d2;
          }
          .status-todo {
            color: #616161;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>${report.title}</h1>
          <p>${report.description}</p>
          <p><em>Generated on ${new Date(report.generatedAt).toLocaleString()}</em></p>
        </div>
        
        ${report.summary ? `
        <div class="summary-box">
          <h2>Executive Summary</h2>
          <pre>${report.summary}</pre>
        </div>
        ` : ''}
        
        ${report.metrics ? `
        <h2>Key Metrics</h2>
        <div class="metrics-container">
          <div class="metric-card">
            <div class="metric-value">${report.metrics.totalIssues}</div>
            <div class="metric-label">Total Issues</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.overdueTasks}</div>
            <div class="metric-label">Overdue Tasks</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.completedToday}</div>
            <div class="metric-label">Completed Today</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.createdToday}</div>
            <div class="metric-label">Created Today</div>
          </div>
        </div>
        
        <h3>Issues by Status</h3>
        <table class="report-table">
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
          ${Object.entries(report.metrics.issuesByStatus).map(([status, count]) => `
          <tr>
            <td>${status}</td>
            <td>${count}</td>
          </tr>
          `).join('')}
        </table>
        
        <h3>Issues by Priority</h3>
        <table class="report-table">
          <tr>
            <th>Priority</th>
            <th>Count</th>
          </tr>
          ${Object.entries(report.metrics.issuesByPriority).map(([priority, count]) => `
          <tr>
            <td>${priority}</td>
            <td>${count}</td>
          </tr>
          `).join('')}
        </table>
        
        <h3>Issues by Assignee</h3>
        <table class="report-table">
          <tr>
            <th>Assignee</th>
            <th>Count</th>
          </tr>
          ${Object.entries(report.metrics.issuesByAssignee).map(([assignee, count]) => `
          <tr>
            <td>${assignee}</td>
            <td>${count}</td>
          </tr>
          `).join('')}
        </table>
        ` : ''}
        
        ${report.sections.map(section => `
        <div class="report-section">
          <h2>${section.name}</h2>
          ${section.issues.length > 0 ? `
          <table class="report-table">
            <tr>
              <th>Key</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Due Date</th>
            </tr>
            ${section.issues.map(issue => `
            <tr>
              <td><a href="${issue.link}" target="_blank">${issue.key}</a></td>
              <td>${issue.summary}</td>
              <td class="${issue.status.toLowerCase().includes('done') ? 'status-done' : 
                          issue.status.toLowerCase().includes('progress') ? 'status-progress' : 
                          'status-todo'}">${issue.status}</td>
              <td>${issue.assignee || 'Unassigned'}</td>
              <td class="${issue.priority.toLowerCase().includes('high') ? 'priority-high' : 
                          issue.priority.toLowerCase().includes('medium') ? 'priority-medium' : 
                          'priority-low'}">${issue.priority}</td>
              <td>${issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'No due date'}</td>
            </tr>
            `).join('')}
          </table>
          ` : '<p>No issues found in this section.</p>'}
        </div>
        `).join('')}
        
        <div class="footer">
          <p>This report was automatically generated from Jira data.</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate a plain text representation of the report
   */
  generateTextReport(report: ReportData): string {
    let text = `${report.title.toUpperCase()}\n`;
    text += '='.repeat(report.title.length) + '\n\n';
    text += `${report.description}\n`;
    text += `Generated on: ${new Date(report.generatedAt).toLocaleString()}\n\n`;
    
    if (report.summary) {
      text += 'EXECUTIVE SUMMARY\n';
      text += '-'.repeat(17) + '\n';
      text += `${report.summary}\n\n`;
    }
    
    if (report.metrics) {
      text += 'KEY METRICS\n';
      text += '-'.repeat(11) + '\n';
      text += `Total Issues: ${report.metrics.totalIssues}\n`;
      text += `Overdue Tasks: ${report.metrics.overdueTasks}\n`;
      text += `Completed Today: ${report.metrics.completedToday}\n`;
      text += `Created Today: ${report.metrics.createdToday}\n\n`;
      
      text += 'Issues by Status:\n';
      Object.entries(report.metrics.issuesByStatus).forEach(([status, count]) => {
        text += `  ${status}: ${count}\n`;
      });
      text += '\n';
      
      text += 'Issues by Priority:\n';
      Object.entries(report.metrics.issuesByPriority).forEach(([priority, count]) => {
        text += `  ${priority}: ${count}\n`;
      });
      text += '\n';
    }
    
    report.sections.forEach(section => {
      text += `${section.name.toUpperCase()}\n`;
      text += '-'.repeat(section.name.length) + '\n';
      
      if (section.issues.length === 0) {
        text += 'No issues found in this section.\n\n';
        return;
      }
      
      section.issues.forEach(issue => {
        text += `${issue.key}: ${issue.summary}\n`;
        text += `  Status: ${issue.status}\n`;
        text += `  Assignee: ${issue.assignee || 'Unassigned'}\n`;
        text += `  Priority: ${issue.priority}\n`;
        if (issue.dueDate) {
          text += `  Due Date: ${new Date(issue.dueDate).toLocaleDateString()}\n`;
        }
        text += `  Link: ${issue.link}\n\n`;
      });
    });
    
    text += '\nThis report was automatically generated from Jira data.\n';
    
    return text;
  }
}

// Helper function to create a ReportGeneratorService from stored config
export const createReportGeneratorService = async (
  jiraConfig: JiraConfig
): Promise<ReportGeneratorService | null> => {
  try {
    const service = new ReportGeneratorService(jiraConfig);
    const isConnected = await service.testConnection();
    
    if (isConnected) {
      return service;
    }
    return null;
  } catch (error) {
    console.error('Failed to create ReportGeneratorService:', error);
    return null;
  }
};
