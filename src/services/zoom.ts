import axios from 'axios';

export interface ZoomConfig {
  apiKey: string;
  apiSecret: string;
  accountEmail: string;
}

export interface ZoomMeeting {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  password?: string;
  host_email: string;
  participants?: string[];
  agenda?: string;
}

export interface CreateMeetingParams {
  topic: string;
  start_time: string; // Format: 'YYYY-MM-DDTHH:MM:SS'
  duration: number; // In minutes
  timezone?: string; // Default: 'UTC'
  agenda?: string;
  password?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    auto_recording?: 'none' | 'local' | 'cloud';
  };
}

export class ZoomService {
  private config: ZoomConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ZoomConfig) {
    this.config = config;
  }

  /**
   * Test the connection to Zoom API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      const response = await axios.get('https://api.zoom.us/v2/users/me', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Zoom API:', error);
      return false;
    }
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        {},
        {
          params: {
            grant_type: 'account_credentials',
            account_id: this.config.accountEmail,
          },
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
          },
        }
      );

      interface TokenResponse {
        access_token: string;
        expires_in: number;
      }

      const data = response.data as TokenResponse;
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Zoom access token:', error);
      throw new Error('Failed to authenticate with Zoom API');
    }
  }

  /**
   * Create a new Zoom meeting
   */
  async createMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          topic: params.topic,
          type: 2, // Scheduled meeting
          start_time: params.start_time,
          duration: params.duration,
          timezone: params.timezone || 'UTC',
          agenda: params.agenda || '',
          password: params.password,
          settings: params.settings || {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
            auto_recording: 'none',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      interface ZoomMeetingResponse {
        id: string;
        topic: string;
        start_time: string;
        duration: number;
        timezone: string;
        join_url: string;
        password?: string;
      }

      const data = response.data as ZoomMeetingResponse;

      return {
        id: data.id,
        topic: data.topic,
        start_time: data.start_time,
        duration: data.duration,
        timezone: data.timezone,
        join_url: data.join_url,
        password: data.password,
        host_email: this.config.accountEmail,
        agenda: params.agenda,
      };
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  /**
   * Get a list of upcoming meetings
   */
  async listMeetings(): Promise<ZoomMeeting[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          params: {
            type: 'upcoming',
            page_size: 30,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      interface ZoomMeetingsListResponse {
        meetings: Array<{
          id: string;
          topic: string;
          start_time: string;
          duration: number;
          timezone: string;
          join_url: string;
        }>;
      }

      const data = response.data as ZoomMeetingsListResponse;

      return data.meetings.map(meeting => ({
        id: meeting.id,
        topic: meeting.topic,
        start_time: meeting.start_time,
        duration: meeting.duration,
        timezone: meeting.timezone,
        join_url: meeting.join_url,
        host_email: this.config.accountEmail,
      }));
    } catch (error) {
      console.error('Failed to list Zoom meetings:', error);
      throw new Error('Failed to list Zoom meetings');
    }
  }

  /**
   * Get details of a specific meeting
   */
  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      interface ZoomMeetingDetailResponse {
        id: string;
        topic: string;
        start_time: string;
        duration: number;
        timezone: string;
        join_url: string;
        password?: string;
        agenda?: string;
      }

      const data = response.data as ZoomMeetingDetailResponse;

      return {
        id: data.id,
        topic: data.topic,
        start_time: data.start_time,
        duration: data.duration,
        timezone: data.timezone,
        join_url: data.join_url,
        password: data.password,
        host_email: this.config.accountEmail,
        agenda: data.agenda,
      };
    } catch (error) {
      console.error(`Failed to get Zoom meeting ${meetingId}:`, error);
      throw new Error('Failed to get Zoom meeting details');
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      
      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to delete Zoom meeting ${meetingId}:`, error);
      throw new Error('Failed to delete Zoom meeting');
    }
  }
}

// Helper function to create a ZoomService from environment variables or localStorage
export const createZoomService = (): ZoomService | null => {
  // Try to get config from localStorage first
  const storedConfig = localStorage.getItem('zoom-config');
  
  if (storedConfig) {
    try {
      const config = JSON.parse(storedConfig);
      if (config.apiKey && config.apiSecret && config.accountEmail) {
        return new ZoomService(config);
      }
    } catch (error) {
      console.error('Failed to parse stored Zoom config:', error);
    }
  }
  
  // Fall back to environment variables
  const apiKey = process.env.REACT_APP_ZOOM_API_KEY;
  const apiSecret = process.env.REACT_APP_ZOOM_API_SECRET;
  const accountEmail = process.env.REACT_APP_ZOOM_ACCOUNT_EMAIL;
  
  if (apiKey && apiSecret && accountEmail) {
    return new ZoomService({
      apiKey,
      apiSecret,
      accountEmail,
    });
  }
  
  return null;
};
