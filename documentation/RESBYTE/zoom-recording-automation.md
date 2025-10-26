# Zoom Recording and Transcript Automation Guide

## Overview

This guide explains how to configure the Resbyte.ai project management platform to automatically record all Zoom meetings and send transcripts to brian@resbyte.ai. This ensures that all meeting content is captured, transcribed, and properly distributed for documentation and follow-up purposes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Zoom Account Configuration](#zoom-account-configuration)
3. [Platform Configuration](#platform-configuration)
4. [Automated Workflow Setup](#automated-workflow-setup)
5. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
6. [Security and Privacy Considerations](#security-and-privacy-considerations)
7. [Appendix: API Reference](#appendix-api-reference)

## Prerequisites

Before setting up automatic recording and transcript distribution, ensure you have:

- **Zoom Pro, Business, or Enterprise account** with admin privileges
- **Zoom API credentials** configured in the Resbyte.ai platform
- **FireFlies.ai account** for enhanced transcription (optional but recommended)
- **Email delivery service** configured in the platform

## Zoom Account Configuration

### Step 1: Enable Automatic Recording in Zoom

1. Log in to the [Zoom web portal](https://zoom.us) as an administrator
2. Navigate to **Account Management** > **Account Settings**
3. Click the **Recording** tab
4. Enable **Automatic recording**
5. Select **Cloud recording**
6. Check the following options:
   - **Record active speaker with shared screen**
   - **Audio transcript**
   - **Save chat messages**
7. Click **Save**

### Step 2: Configure Recording Settings

1. Still in the Recording tab, scroll down to **Cloud recording**
2. Enable the following options:
   - **Record gallery view**
   - **Record active speaker and gallery view**
   - **Audio only**
   - **Add a timestamp to the recording**
   - **Display participants' names**
   - **Record thumbnails when sharing**
3. Under **Recording formats**, select:
   - **Shared screen with speaker view**
   - **Active speaker**
   - **Gallery view**
   - **Audio only**
4. Click **Save**

### Step 3: Configure Advanced Settings

1. Enable **IP Address Access Control** if needed for security
2. Set **Cloud recording downloads** to be accessible by account members only
3. Enable **Auto delete cloud recordings after [90] days**
4. Click **Save**

## Platform Configuration

### Step 1: Configure Zoom Integration

1. Log in to the Resbyte.ai platform
2. Navigate to **Admin** > **API Configurations**
3. Find the **Zoom** card and click **Configure**
4. Enter your Zoom API credentials:
   - **API Key**
   - **API Secret**
   - **Account Email**
5. Click **Test Connection** to verify
6. Click **Save Configuration**

### Step 2: Configure Transcript Distribution

1. Navigate to **Admin** > **Zoom Integration** > **Transcript Settings**
2. Enable **Automatic Transcript Distribution**
3. Add recipient email: `brian@resbyte.ai`
4. Configure transcript format:
   - **Format**: Text and JSON (both)
   - **Include timestamps**: Yes
   - **Include speaker identification**: Yes
   - **Include meeting metadata**: Yes
5. Click **Save Settings**

### Step 3: Configure FireFlies.ai Integration (Optional)

For enhanced transcription quality:

1. Navigate to **Admin** > **API Configurations**
2. Find the **FireFlies.AI** card and click **Configure**
3. Enter your FireFlies.ai API credentials:
   - **API Key**
   - **Workspace ID**
4. Click **Test Connection** to verify
5. Click **Save Configuration**
6. Navigate to **Admin** > **Zoom Integration** > **Transcript Settings**
7. Enable **Use FireFlies.ai for transcription**
8. Click **Save Settings**

## Automated Workflow Setup

### Step 1: Create the Recording Enforcement Workflow

1. Navigate to **Admin** > **Workflows** > **New Workflow**
2. Enter workflow details:
   - **Name**: Zoom Recording Enforcement
   - **Description**: Ensures all Zoom meetings are recorded and transcripts are sent to brian@resbyte.ai
   - **Trigger**: Zoom Meeting Created
3. Add the following actions:
   - **Action 1**: Enforce Recording Settings
   - **Action 2**: Process Transcript
   - **Action 3**: Send Email Notification
4. Click **Create Workflow**

### Step 2: Configure the Workflow Actions

#### Action 1: Enforce Recording Settings

1. Select **Zoom API** as the action type
2. Configure the action:
   - **Operation**: Update Meeting
   - **Settings to Update**: Recording Settings
   - **Recording Type**: Cloud
   - **Auto Recording**: True
   - **Generate Transcript**: True
3. Click **Save Action**

#### Action 2: Process Transcript

1. Select **Transcript Processing** as the action type
2. Configure the action:
   - **Source**: Zoom Cloud Recording
   - **Processing Type**: Full Processing
   - **Store in Archon**: True
   - **Tag**: resbyte, meeting, transcript
3. Click **Save Action**

#### Action 3: Send Email Notification

1. Select **Email** as the action type
2. Configure the action:
   - **Recipient**: brian@resbyte.ai
   - **Subject Template**: "Zoom Meeting Transcript: {{meeting.topic}}"
   - **Body Template**: 
     ```
     Hello,
     
     A transcript for the following Zoom meeting is attached:
     
     Topic: {{meeting.topic}}
     Date: {{meeting.start_time}}
     Duration: {{meeting.duration}} minutes
     Host: {{meeting.host_email}}
     Participants: {{meeting.participants_count}}
     
     The transcript and recording are also available in the Resbyte.ai platform.
     
     Regards,
     Resbyte.ai Platform
     ```
   - **Attachments**: Include Transcript
3. Click **Save Action**

### Step 3: Activate the Workflow

1. Toggle the workflow status to **Active**
2. Select **Apply to all future meetings**
3. Click **Save Workflow**

## Monitoring and Troubleshooting

### Monitoring Workflow Execution

1. Navigate to **Admin** > **Workflows** > **Execution History**
2. Filter by "Zoom Recording Enforcement" workflow
3. Review the status of each execution:
   - **Success**: All actions completed successfully
   - **Partial Success**: Some actions completed
   - **Failed**: Workflow execution failed

### Common Issues and Solutions

#### Recording Not Starting Automatically

**Possible causes**:
- Meeting created before workflow activation
- Meeting created outside the platform
- Zoom account permissions issue

**Solution**:
1. Navigate to **Admin** > **Zoom Meetings**
2. Find the affected meeting
3. Click **Edit**
4. Enable **Auto Recording**
5. Click **Save**

#### Transcript Not Being Sent

**Possible causes**:
- Email delivery issues
- Transcript processing delay
- Zoom API rate limiting

**Solution**:
1. Check the workflow execution logs
2. Verify email delivery service status
3. Check if transcript was generated in Zoom
4. Manually trigger the transcript processing action

#### Poor Transcript Quality

**Possible causes**:
- Audio quality issues
- Multiple speakers talking simultaneously
- Background noise

**Solution**:
1. Enable FireFlies.ai integration for better transcription
2. Provide meeting guidelines to participants
3. Use noise-cancelling microphones

### Workflow Logs

To access detailed logs:

1. Navigate to **Admin** > **System** > **Logs**
2. Filter by "Zoom" and "Workflow"
3. Set log level to "Debug" for more detailed information
4. Review logs for error messages or warnings

## Security and Privacy Considerations

### Data Protection

- All recordings and transcripts are stored securely in the platform
- Access is restricted based on user permissions
- Data is encrypted at rest and in transit
- Retention policies automatically delete old recordings after the configured period

### Privacy Notifications

To comply with privacy regulations:

1. Configure automatic meeting notifications:
   - Navigate to **Admin** > **Zoom Integration** > **Notification Settings**
   - Enable **Recording Notification**
   - Customize the notification message
   - Click **Save Settings**

2. Add a privacy disclaimer to meeting invitations:
   - Navigate to **Admin** > **Zoom Integration** > **Template Settings**
   - Edit the **Meeting Invitation Template**
   - Add the privacy disclaimer:
     ```
     Note: This meeting will be recorded and transcribed for documentation purposes.
     The recording and transcript will be shared with the project team.
     ```
   - Click **Save Template**

### Compliance Settings

For regulatory compliance:

1. Navigate to **Admin** > **Compliance** > **Recording Settings**
2. Configure retention periods based on your organization's policies
3. Enable **Audit Logging** for all recording access
4. Configure **Data Residency** settings if needed
5. Click **Save Settings**

## Appendix: API Reference

### Zoom API Endpoints Used

- `GET /users/{userId}/meetings` - List user's meetings
- `PATCH /meetings/{meetingId}` - Update meeting settings
- `GET /meetings/{meetingId}/recordings` - Get meeting recordings
- `GET /meetings/{meetingId}/recordings/settings` - Get recording settings

### Platform API Endpoints

- `/api/zoom/meetings` - Meeting management
- `/api/zoom/recordings` - Recording management
- `/api/zoom/transcripts` - Transcript management
- `/api/workflows` - Workflow management

### Sample API Request to Enforce Recording

```javascript
// Update meeting to enforce recording
const updateMeetingRecordingSettings = async (meetingId) => {
  const response = await axios.patch(
    `https://api.zoom.us/v2/meetings/${meetingId}`,
    {
      settings: {
        auto_recording: "cloud",
        audio_transcript: true,
        save_chat_text: true
      }
    },
    {
      headers: {
        Authorization: `Bearer ${zoomToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};
```

### Sample Webhook Payload for Recording Completed

```json
{
  "event": "recording.completed",
  "payload": {
    "account_id": "abcdefg123456",
    "object": {
      "uuid": "meeting-uuid",
      "id": 12345678,
      "host_id": "host-id",
      "topic": "Project Status Meeting",
      "type": 2,
      "start_time": "2025-10-24T08:00:00Z",
      "duration": 60,
      "timezone": "America/New_York",
      "host_email": "host@resbyte.ai",
      "total_size": 54321,
      "recording_count": 3,
      "recording_files": [
        {
          "id": "file-id-1",
          "meeting_id": "meeting-uuid",
          "recording_start": "2025-10-24T08:00:00Z",
          "recording_end": "2025-10-24T09:00:00Z",
          "file_type": "MP4",
          "file_size": 32000,
          "play_url": "https://zoom.us/rec/play/recording-url",
          "download_url": "https://zoom.us/rec/download/recording-url",
          "status": "completed",
          "recording_type": "shared_screen_with_speaker_view"
        },
        {
          "id": "file-id-2",
          "meeting_id": "meeting-uuid",
          "recording_start": "2025-10-24T08:00:00Z",
          "recording_end": "2025-10-24T09:00:00Z",
          "file_type": "TRANSCRIPT",
          "file_size": 12000,
          "play_url": "https://zoom.us/rec/play/transcript-url",
          "download_url": "https://zoom.us/rec/download/transcript-url",
          "status": "completed",
          "recording_type": "audio_transcript"
        }
      ]
    }
  }
}
```
