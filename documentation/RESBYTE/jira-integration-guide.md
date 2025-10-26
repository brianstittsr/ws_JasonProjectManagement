# Jira Integration Guide for Resbyte.ai Project Management Platform

## Overview

This guide explains how to connect the Resbyte.ai project management platform to Atlassian Jira to enable Kanban board updates, task creation, and synchronization. The integration allows for:

- Automatic creation of Jira issues from meeting transcripts and action items
- Updating Kanban board status from the platform
- Bi-directional synchronization of comments and attachments
- Custom field mapping for project-specific requirements
- Webhook notifications for real-time updates

## Prerequisites

Before setting up the integration, you'll need:

1. **Jira Cloud or Server instance** with administrator access
2. **Jira API token** for authentication
3. **Project keys** for the Jira projects you want to integrate with
4. **Custom field IDs** (if using custom fields)

## Step 1: Create a Jira API Token

1. Log in to your Atlassian account at [id.atlassian.com](https://id.atlassian.com/)
2. Navigate to **Security** > **API tokens**
3. Click **Create API token**
4. Enter a label for your token (e.g., "Resbyte.ai Integration")
5. Click **Create**
6. Copy the generated token and store it securely

## Step 2: Configure Jira in the Resbyte.ai Platform

1. Log in to the Resbyte.ai platform
2. Navigate to **Admin** > **API Configurations**
3. Find the **Jira** card and click **Configure**
4. Enter the following information:
   - **Domain**: Your Jira domain (e.g., `your-company.atlassian.net`)
   - **Email**: Your Atlassian account email
   - **API Token**: The token generated in Step 1
   - **Default Project Key**: The key of your primary project (e.g., `RES` for Resbyte)
5. Click **Test Connection** to verify the credentials
6. Click **Save Configuration**

## Step 3: Set Up Kanban Board Integration

### 3.1 Map Jira Statuses to Platform Statuses

1. Navigate to **Admin** > **Jira Integration** > **Status Mapping**
2. For each platform status, select the corresponding Jira status:
   - **To Do** → "To Do" (or equivalent)
   - **In Progress** → "In Progress" (or equivalent)
   - **Review** → "Review" (or equivalent)
   - **Done** → "Done" (or equivalent)
3. Click **Save Mapping**

### 3.2 Configure Issue Type Mapping

1. Navigate to **Admin** > **Jira Integration** > **Issue Type Mapping**
2. Map platform task types to Jira issue types:
   - **Task** → "Task"
   - **Bug** → "Bug"
   - **Feature** → "Story"
   - **Meeting Action** → "Task" (with custom label)
3. Click **Save Mapping**

### 3.3 Set Up Field Mapping

1. Navigate to **Admin** > **Jira Integration** > **Field Mapping**
2. Configure how platform fields map to Jira fields:
   - **Title** → "Summary"
   - **Description** → "Description"
   - **Assignee** → "Assignee"
   - **Due Date** → "Due Date"
   - **Priority** → "Priority"
   - **Labels** → "Labels"
3. For custom fields, click **Add Custom Field Mapping**
4. Enter the Jira custom field ID and select the corresponding platform field
5. Click **Save Mapping**

## Step 4: Configure Webhooks for Real-time Updates

### 4.1 Create a Webhook in Jira

1. Log in to your Jira instance as an administrator
2. Navigate to **Settings** > **System** > **WebHooks**
3. Click **Create a WebHook**
4. Enter the following information:
   - **Name**: "Resbyte.ai Integration"
   - **URL**: `https://your-resbyte-platform.com/api/webhooks/jira`
   - **Description**: "Webhook for Resbyte.ai platform integration"
5. Under **Events**, select:
   - Issue: created, updated, deleted
   - Comment: created, updated, deleted
6. Click **Create**

### 4.2 Configure Webhook in the Platform

1. Navigate to **Admin** > **Jira Integration** > **Webhooks**
2. Enable **Receive Jira Webhooks**
3. Copy the **Webhook Secret Key** displayed
4. Return to your Jira webhook configuration and add the secret key as a custom header:
   - Header Name: `X-Resbyte-Secret`
   - Value: [Your copied secret key]
5. Click **Update** in Jira

## Step 5: Test the Integration

### 5.1 Create a Test Issue

1. Navigate to **Projects** > **[Your Project]** > **Tasks**
2. Click **Create Task**
3. Fill in the required fields
4. Enable **Sync with Jira**
5. Click **Create**
6. Verify that the issue appears in your Jira project

### 5.2 Update Kanban Status

1. Navigate to **Projects** > **[Your Project]** > **Kanban Board**
2. Find your test task
3. Drag it to a different status column
4. Verify that the status is updated in Jira

## Advanced Configuration

### Custom Workflows

To map custom Jira workflows to the platform:

1. Navigate to **Admin** > **Jira Integration** > **Workflow Mapping**
2. Click **Add Workflow Mapping**
3. Select the Jira workflow
4. Map each workflow status to a platform status
5. Configure transition requirements
6. Click **Save Workflow Mapping**

### Multiple Project Support

To work with multiple Jira projects:

1. Navigate to **Admin** > **Jira Integration** > **Projects**
2. Click **Add Project**
3. Enter the Jira project key
4. Configure project-specific mappings
5. Click **Save Project**

### Automated Synchronization

Configure how often the platform synchronizes with Jira:

1. Navigate to **Admin** > **Jira Integration** > **Sync Settings**
2. Set the **Sync Interval** (e.g., 5 minutes)
3. Configure **Conflict Resolution** preferences
4. Enable/disable **Attachment Sync**
5. Click **Save Settings**

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify your API token is correct and not expired
   - Ensure your email address matches your Atlassian account

2. **Missing Issues**
   - Check project key configuration
   - Verify user permissions in Jira

3. **Status Updates Not Working**
   - Confirm status mapping configuration
   - Check for workflow restrictions in Jira

4. **Webhook Failures**
   - Verify webhook URL is accessible
   - Check secret key configuration
   - Review Jira webhook logs

### Logs and Diagnostics

Access integration logs:

1. Navigate to **Admin** > **Jira Integration** > **Logs**
2. Set log level (Info, Debug, Error)
3. View recent log entries
4. Click **Download Logs** for detailed analysis

## Security Considerations

- API tokens should be treated as sensitive credentials
- The platform encrypts all Jira credentials in storage
- Webhook endpoints use HTTPS and authentication
- User permissions in Jira determine what actions can be performed
- Regular audit logs track all Jira operations

## Best Practices

1. **Start Small**: Begin with a single project before expanding to multiple projects
2. **Test Thoroughly**: Validate all mappings with test issues before full deployment
3. **Document Custom Fields**: Keep a record of all custom field IDs and their purpose
4. **Regular Audits**: Periodically review integration logs and permissions
5. **User Training**: Ensure team members understand how the integration works

## Support

For assistance with Jira integration:

- Email: support@resbyte.ai
- Documentation: https://docs.resbyte.ai/integrations/jira
- Community Forum: https://community.resbyte.ai/jira-integration

---

## Appendix A: API Reference

### Jira REST API Endpoints Used

- `/rest/api/3/issue` - Issue CRUD operations
- `/rest/api/3/search` - JQL search queries
- `/rest/api/3/project` - Project information
- `/rest/api/3/field` - Field definitions
- `/rest/api/3/workflow` - Workflow operations

### Platform API Endpoints

- `/api/jira/issues` - Issue management
- `/api/jira/sync` - Manual synchronization
- `/api/jira/webhooks` - Webhook management
- `/api/jira/config` - Integration configuration

## Appendix B: Sample JQL Queries

### Recent Tasks

```sql
project = "RES" AND created >= -7d ORDER BY created DESC
```

### Overdue Tasks

```sql
project = "RES" AND status != Done AND duedate < now() ORDER BY duedate ASC
```

### Current Sprint Tasks

```sql
project = "RES" AND sprint in openSprints() ORDER BY status
```

## Appendix C: Webhook Payload Examples

### Issue Created Event

```json
{
  "webhookEvent": "jira:issue_created",
  "issue": {
    "id": "10001",
    "key": "RES-123",
    "fields": {
      "summary": "Implement Jira integration",
      "status": {
        "id": "10000",
        "name": "To Do"
      },
      "assignee": {
        "displayName": "John Doe"
      }
    }
  }
}
```

### Issue Updated Event

```json
{
  "webhookEvent": "jira:issue_updated",
  "issue": {
    "id": "10001",
    "key": "RES-123",
    "fields": {
      "summary": "Implement Jira integration",
      "status": {
        "id": "10001",
        "name": "In Progress"
      }
    }
  },
  "changelog": {
    "items": [
      {
        "field": "status",
        "fromString": "To Do",
        "toString": "In Progress"
      }
    ]
  }
}
```
