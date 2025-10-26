# Email to Archon Automation

This feature allows you to automatically extract emails from Gmail and store them in the Archon Knowledge Base with the "resbyte" tag on an hourly schedule.

## Setup Instructions

### 1. Configure Gmail API Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Create OAuth 2.0 credentials (Client ID and Client Secret)
5. Set up the OAuth consent screen
6. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
7. Generate a refresh token using the OAuth 2.0 Playground:
   - Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Set up OAuth 2.0 configuration (gear icon) and use your Client ID and Client Secret
   - Select the Gmail API scopes from step 6
   - Click "Authorize APIs"
   - Exchange the authorization code for tokens
   - Copy the refresh token

### 2. Configure Archon API

1. Make sure your Archon API is properly set up and running
2. Update the Archon configuration in your `.env` file:
   ```
   REACT_APP_ARCHON_API_URL=http://your-archon-api-url
   REACT_APP_ARCHON_API_KEY=your_archon_api_key
   REACT_APP_ARCHON_VECTOR_DB=your_vector_db
   REACT_APP_ARCHON_EMBEDDING_MODEL=your_embedding_model
   REACT_APP_ARCHON_COMPLETION_MODEL=your_completion_model
   ```

### 3. Configure Email to Archon Automation

Update the Email to Archon automation settings in your `.env` file:
```
REACT_APP_EMAIL_ARCHON_ENABLED=true
REACT_APP_EMAIL_ARCHON_INTERVAL=60 # minutes (hourly)
REACT_APP_EMAIL_ARCHON_MAX_EMAILS=20
REACT_APP_EMAIL_ARCHON_LABEL=Archon-Processed
REACT_APP_EMAIL_ARCHON_SEARCH_QUERY=is:unread
REACT_APP_EMAIL_ARCHON_INCLUDE_ATTACHMENTS=true
```

## Using the Email to Archon Automation

1. Navigate to the Email to Archon page in the admin panel
2. Enter your Gmail API credentials (Client ID, Client Secret, and Refresh Token)
3. Configure the automation settings:
   - Check Interval: How often to check for new emails (in minutes)
   - Max Emails to Process: Maximum number of emails to process in each run
   - Gmail Search Query: Query to find emails to process (using Gmail search operators)
   - Label Processed Emails: Whether to label processed emails
   - Processed Label: Label to apply to processed emails
   - Include Attachments: Whether to include email attachments
   - Archon Tags: Tags to add to stored emails (always includes "resbyte")

4. Click "Start Automation" to begin the automated process
5. Monitor the status and history of automation runs in the Status and History tabs

## How It Works

1. The automation service connects to Gmail using your OAuth credentials
2. It searches for emails matching your search query
3. For each email found, it:
   - Extracts the email content and metadata
   - Stores the email in the Archon Knowledge Base with the "resbyte" tag
   - Extracts and stores attachments if configured
   - Marks the email as read and adds a label if configured
4. The process repeats automatically at the configured interval

## Troubleshooting

If you encounter issues with the Email to Archon automation:

1. Check that your Gmail API credentials are correct
2. Verify that your Archon API is properly configured and accessible
3. Check the automation run history for specific error messages
4. Ensure that your Gmail account has the necessary emails to process
5. Try running the automation manually using the "Run Now" button

For persistent issues, check the browser console for detailed error logs.
