# Jira Kanban Board Quick Reference Guide

## Overview

This quick reference guide explains how to use the Jira Kanban board integration in the Resbyte.ai project management platform. The integration allows you to view and update your Jira Kanban boards directly from the platform.

## Accessing the Kanban Board

1. Log in to the Resbyte.ai platform
2. Navigate to **Projects** > **[Your Project]** > **Kanban Board**
3. Select the board you want to view from the dropdown menu (if multiple boards are configured)

## Understanding the Board

The Kanban board displays your Jira issues organized by status:

![Kanban Board Layout](../images/kanban-board-layout.png)

1. **Board Header**: Shows the board name and project
2. **Column Headers**: Represent different status categories
3. **Issue Cards**: Individual Jira issues
4. **Quick Filters**: Filter issues by assignee, label, or other criteria
5. **Board Controls**: Options for refreshing, configuring, or creating new issues

## Issue Card Information

Each card on the board represents a Jira issue and displays:

- Issue key (e.g., RES-123)
- Summary/title
- Assignee (with avatar)
- Priority indicator
- Due date (if set)
- Labels
- Epic link (if applicable)
- Story points or other custom fields (if configured)

## Moving Issues Between Columns

To update an issue's status:

1. Click and hold on an issue card
2. Drag the card to the desired column
3. Release to drop the card
4. The platform will automatically update the issue status in Jira

> **Note**: If the status change requires additional fields in Jira, a dialog will appear prompting you to complete these fields.

## Creating New Issues

To create a new issue directly on the board:

1. Click the **+** button in the column where you want to create the issue
2. Enter the issue details in the dialog:
   - Summary (required)
   - Description
   - Assignee
   - Priority
   - Labels
   - Due date
   - Custom fields (if configured)
3. Click **Create** to add the issue to the board and Jira

## Viewing Issue Details

To view detailed information about an issue:

1. Click on the issue card
2. The issue details panel will open on the right side
3. View and edit fields, add comments, or attach files
4. Changes are automatically synchronized with Jira

## Filtering the Board

To filter issues on the board:

1. Click the **Filter** button in the top-right corner
2. Select from the available filter options:
   - Assignee
   - Label
   - Epic
   - Priority
   - Custom fields
3. The board will update to show only matching issues
4. Active filters appear as chips below the filter button
5. Click the **X** on a filter chip to remove it

## Refreshing the Board

The board automatically refreshes every 5 minutes. To manually refresh:

1. Click the **Refresh** button in the top-right corner
2. The board will update with the latest data from Jira

## Board Configuration

To customize the board view:

1. Click the **Settings** gear icon in the top-right corner
2. Adjust the following options:
   - Column visibility
   - Card density (compact, normal, detailed)
   - Fields to display on cards
   - Swimlanes (group by assignee, epic, etc.)
   - WIP limits
3. Click **Save** to apply your changes

## Keyboard Shortcuts

For faster navigation and actions:

- **N**: Create new issue
- **F**: Open filter panel
- **R**: Refresh board
- **C**: Collapse/expand all swimlanes
- **?**: Show keyboard shortcut help

## Common Issues and Solutions

### Issue Won't Move to a Column

**Possible causes**:
- The transition is not allowed by the Jira workflow
- Required fields are missing
- You don't have permission for the transition

**Solution**: Click on the issue to open the details panel and check for any required fields or workflow restrictions.

### Board Is Not Updating

**Possible causes**:
- Connection to Jira is interrupted
- Webhook configuration issue
- Caching delay

**Solution**: Click the **Refresh** button to force a manual update. If issues persist, check your connection status in the bottom-right corner.

### Missing Issues

**Possible causes**:
- Active filters are hiding the issues
- Issues were recently created and haven't synced yet
- JQL query for the board excludes these issues

**Solution**: Clear all filters and refresh the board. If issues are still missing, check the board configuration in Jira.

## Getting Help

If you encounter problems with the Kanban board:

1. Check the connection status indicator in the bottom-right corner
2. Click **Help** > **Troubleshooting** for common solutions
3. Contact your administrator or support at support@resbyte.ai

---

## Appendix: Status Mapping Reference

This table shows how platform statuses map to Jira statuses:

| Platform Column | Jira Status    | Description                                |
|-----------------|----------------|--------------------------------------------|
| To Do           | To Do          | Work that hasn't been started              |
| In Progress     | In Progress    | Work that is actively being done           |
| Review          | Review         | Work that is ready for review              |
| Done            | Done           | Work that is completed                     |

> **Note**: Your Jira project may use different status names. The platform administrator can configure custom status mappings.
