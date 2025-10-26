import axios from 'axios';
import { GmailEmail } from './gmail';
import { ArchonService, ArchonDocument } from './archon';

// API response interfaces
export interface ZoomRecording {
  topic: string;
  host_email: string;
  start_time: string;
  duration: string;
  [key: string]: any;
}

export interface FireFliesTranscript {
  title: string;
  transcript_text: string;
  [key: string]: any;
}

// Content types that can be extracted
export type ContentType = 'zoom_recording' | 'zoom_transcript' | 'fireflies_transcript' | 'fireflies_summary' | 'readai_transcript' | 'readai_summary' | 'readai_recording';

// Content source platforms
export type ContentPlatform = 'zoom' | 'fireflies' | 'readai';

// Content extraction result
export interface ExtractedContent {
  id: string;
  type: ContentType;
  platform: ContentPlatform;
  title: string;
  content: string;
  metadata: {
    source: string;
    sourceType: string;
    sourceEmail: string;
    extractedAt: string;
    meetingDate?: string;
    duration?: string;
    participants?: string[];
    originalUrl: string;
    [key: string]: any;
  };
  rawData?: any;
}

// Configuration for content extraction
export interface ContentExtractorConfig {
  zoomApiKey?: string;
  zoomApiSecret?: string;
  firefliesApiKey?: string;
  firefliesWorkspaceId?: string;
  readaiApiKey?: string;
  readaiOrgId?: string;
}

/**
 * Service for extracting content from Zoom and FireFlies.ai links in emails
 */
export class ContentExtractorService {
  private config: ContentExtractorConfig;

  constructor(config: ContentExtractorConfig = {}) {
    this.config = config;
  }
  
  /**
   * Check if the service is properly configured with API keys
   */
  isConfigured(): boolean {
    // Check if Zoom API credentials are configured
    const zoomConfigured = !!(this.config.zoomApiKey && this.config.zoomApiSecret);
    
    // Check if FireFlies API credentials are configured
    const firefliesConfigured = !!(this.config.firefliesApiKey && this.config.firefliesWorkspaceId);
    
    // Check if Read.ai API credentials are configured
    const readaiConfigured = !!(this.config.readaiApiKey && this.config.readaiOrgId);
    
    // Service is considered configured if at least one integration is properly set up
    return zoomConfigured || firefliesConfigured || readaiConfigured;
  }

  /**
   * Detect Zoom, FireFlies.ai, and Read.ai links in an email
   */
  detectContentLinks(email: GmailEmail): { 
    zoomLinks: string[]; 
    firefliesLinks: string[];
    readaiLinks: string[];
  } {
    const zoomRegex = /https:\/\/(?:[\w-]+\.)?zoom\.us\/(?:rec\/share|recording)\/[\w\-\.]+/gi;
    const firefliesRegex = /https:\/\/(?:[\w-]+\.)?fireflies\.ai\/(?:calls|transcript)\/[\w\-]+/gi;
    const readaiRegex = /https:\/\/(?:[\w-]+\.)?read\.ai\/(?:meetings|transcripts|recordings)\/[\w\-]+/gi;
    
    const emailContent = `${email.subject}\n${email.body}`;
    
    const zoomLinks = [...new Set(emailContent.match(zoomRegex) || [])];
    const firefliesLinks = [...new Set(emailContent.match(firefliesRegex) || [])];
    const readaiLinks = [...new Set(emailContent.match(readaiRegex) || [])];
    
    return { zoomLinks, firefliesLinks, readaiLinks };
  }

  /**
   * Extract content from a Zoom recording link
   */
  async extractZoomContent(url: string, email: GmailEmail): Promise<ExtractedContent | null> {
    try {
      if (!this.config.zoomApiKey || !this.config.zoomApiSecret) {
        console.error('Zoom API credentials not configured');
        return null;
      }
      
      // Extract meeting ID from URL
      const meetingIdMatch = url.match(/\/rec\/share\/([^?#]+)/);
      const meetingId = meetingIdMatch ? meetingIdMatch[1] : null;
      
      if (!meetingId) {
        console.error('Could not extract meeting ID from Zoom URL:', url);
        return null;
      }
      
      // Get access token
      const tokenResponse = await axios.post(
        'https://zoom.us/oauth/token',
        {},
        {
          params: {
            grant_type: 'client_credentials',
          },
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.config.zoomApiKey}:${this.config.zoomApiSecret}`).toString('base64')}`,
          },
        }
      );
      
      const accessToken = (tokenResponse.data as { access_token: string }).access_token;
      
      // Get recording details
      const recordingResponse = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const recording = recordingResponse.data as ZoomRecording & { recording_files?: Array<{ file_type: string; download_url: string }> };
      
      if (!recording || !recording.recording_files || recording.recording_files.length === 0) {
        console.error('No recording files found for meeting:', meetingId);
        return null;
      }
      
      // Find transcript file if available
      const transcriptFile = recording.recording_files.find(
        (file: any) => file.file_type === 'TRANSCRIPT'
      );
      
      if (transcriptFile) {
        // Download transcript
        const transcriptResponse = await axios.get(transcriptFile.download_url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        return {
          id: `zoom-transcript-${meetingId}`,
          type: 'zoom_transcript',
          platform: 'zoom',
          title: `Zoom Transcript: ${recording.topic || 'Untitled Meeting'}`,
          content: (transcriptResponse.data as string).toString(),
          metadata: {
            source: 'zoom',
            sourceType: 'transcript',
            sourceEmail: email.from,
            extractedAt: new Date().toISOString(),
            meetingDate: recording.start_time,
            duration: recording.duration,
            participants: recording.participants?.map((p: any) => p.name) || [],
            originalUrl: url,
            meetingId,
            meetingTopic: recording.topic,
            hostEmail: recording.host_email,
          },
          rawData: recording,
        };
      } else {
        // If no transcript, return recording metadata
        return {
          id: `zoom-recording-${meetingId}`,
          type: 'zoom_recording',
          platform: 'zoom',
          title: `Zoom Recording: ${recording.topic || 'Untitled Meeting'}`,
          content: `Meeting Topic: ${recording.topic || 'Untitled Meeting'}\n` +
                  `Host: ${recording.host_email || 'Unknown'}\n` +
                  `Date: ${recording.start_time || 'Unknown'}\n` +
                  `Duration: ${recording.duration || 'Unknown'} minutes\n` +
                  `Recording URL: ${url}`,
          metadata: {
            source: 'zoom',
            sourceType: 'recording_metadata',
            sourceEmail: email.from,
            extractedAt: new Date().toISOString(),
            meetingDate: recording.start_time,
            duration: recording.duration,
            originalUrl: url,
            meetingId,
            meetingTopic: recording.topic,
            hostEmail: recording.host_email,
          },
          rawData: recording,
        };
      }
    } catch (error) {
      console.error('Error extracting Zoom content:', error);
      return null;
    }
  }

  /**
   * Extract content from a FireFlies.ai transcript link
   */
  async extractFirefliesContent(url: string, email: GmailEmail): Promise<ExtractedContent | null> {
    try {
      if (!this.config.firefliesApiKey) {
        console.error('FireFlies.ai API key not configured');
        return null;
      }
      
      // Extract transcript ID from URL
      const transcriptIdMatch = url.match(/\/(?:calls|transcript)\/([^?#]+)/);
      const transcriptId = transcriptIdMatch ? transcriptIdMatch[1] : null;
      
      if (!transcriptId) {
        console.error('Could not extract transcript ID from FireFlies.ai URL:', url);
        return null;
      }
      
      // Get transcript details
      const transcriptResponse = await axios.get(
        `https://api.fireflies.ai/graphql`,
        {
          params: {
            query: `
              query GetTranscript($id: ID!) {
                transcript(id: $id) {
                  id
                  title
                  date
                  duration
                  transcript_text
                  summary
                  attendees {
                    name
                    email
                  }
                }
              }
            `,
            variables: { id: transcriptId },
          },
          headers: {
            Authorization: `Bearer ${this.config.firefliesApiKey}`,
          },
        }
      );
      
      interface FireFliesResponse {
        data?: {
          transcript?: FireFliesTranscript;
        };
      }
      
      const transcript = (transcriptResponse.data as FireFliesResponse)?.data?.transcript;
      
      if (!transcript) {
        console.error('No transcript found with ID:', transcriptId);
        return null;
      }
      
      // Create transcript content
      const transcriptContent: ExtractedContent = {
        id: `fireflies-transcript-${transcriptId}`,
        type: 'fireflies_transcript',
        platform: 'fireflies',
        title: `FireFlies Transcript: ${transcript.title || 'Untitled Meeting'}`,
        content: transcript.transcript_text,
        metadata: {
          source: 'fireflies',
          sourceType: 'transcript',
          sourceEmail: email.from,
          extractedAt: new Date().toISOString(),
          meetingDate: transcript.date,
          duration: transcript.duration,
          participants: transcript.attendees?.map((a: any) => a.name || a.email) || [],
          originalUrl: url,
          transcriptId,
          meetingTitle: transcript.title,
        },
        rawData: transcript,
      };
      
      // If summary is available, create a separate summary content
      if (transcript.summary) {
        const summaryContent: ExtractedContent = {
          id: `fireflies-summary-${transcriptId}`,
          type: 'fireflies_summary',
          platform: 'fireflies',
          title: `FireFlies Summary: ${transcript.title || 'Untitled Meeting'}`,
          content: transcript.summary,
          metadata: {
            source: 'fireflies',
            sourceType: 'summary',
            sourceEmail: email.from,
            extractedAt: new Date().toISOString(),
            meetingDate: transcript.date,
            duration: transcript.duration,
            participants: transcript.attendees?.map((a: any) => a.name || a.email) || [],
            originalUrl: url,
            transcriptId,
            meetingTitle: transcript.title,
          },
          rawData: transcript,
        };
        
        // Return both transcript and summary
        return transcriptContent;
      }
      
      return transcriptContent;
    } catch (error) {
      console.error('Error extracting FireFlies.ai content:', error);
      return null;
    }
  }

  /**
   * Extract content from a Read.ai link
   */
  async extractReadAiContent(url: string, email: GmailEmail): Promise<ExtractedContent | null> {
    try {
      if (!this.config.readaiApiKey || !this.config.readaiOrgId) {
        console.error('Read.ai API credentials not configured');
        return null;
      }
      
      // Extract meeting ID from URL
      const meetingIdMatch = url.match(/\/(?:meetings|transcripts|recordings)\/([^?#]+)/);
      const meetingId = meetingIdMatch ? meetingIdMatch[1] : null;
      
      if (!meetingId) {
        console.error('Could not extract meeting ID from Read.ai URL:', url);
        return null;
      }
      
      // Get meeting details
      const meetingResponse = await axios.get(
        `https://api.read.ai/v1/meetings/${meetingId}`,
        {
          headers: {
            'X-API-KEY': this.config.readaiApiKey,
            'X-ORG-ID': this.config.readaiOrgId,
          },
        }
      );
      
      interface ReadAiMeeting {
        id: string;
        title: string;
        start_time: string;
        duration_seconds: number;
        transcript?: string;
        summary?: string;
        participants?: Array<{ name: string; email?: string }>;
        recording_url?: string;
      }
      
      const meeting = meetingResponse.data as ReadAiMeeting;
      
      if (!meeting) {
        console.error('No meeting found with ID:', meetingId);
        return null;
      }
      
      // Create transcript content if available
      if (meeting.transcript) {
        const transcriptContent: ExtractedContent = {
          id: `readai-transcript-${meetingId}`,
          type: 'readai_transcript',
          platform: 'readai',
          title: `Read.ai Transcript: ${meeting.title || 'Untitled Meeting'}`,
          content: meeting.transcript,
          metadata: {
            source: 'readai',
            sourceType: 'transcript',
            sourceEmail: email.from,
            extractedAt: new Date().toISOString(),
            meetingDate: meeting.start_time,
            duration: String(Math.floor(meeting.duration_seconds / 60)),
            participants: meeting.participants?.map(p => p.name || p.email || 'Unknown') || [],
            originalUrl: url,
            meetingId,
            meetingTitle: meeting.title,
          },
          rawData: meeting,
        };
        
        return transcriptContent;
      }
      
      // If no transcript but summary is available
      if (meeting.summary) {
        const summaryContent: ExtractedContent = {
          id: `readai-summary-${meetingId}`,
          type: 'readai_summary',
          platform: 'readai',
          title: `Read.ai Summary: ${meeting.title || 'Untitled Meeting'}`,
          content: meeting.summary,
          metadata: {
            source: 'readai',
            sourceType: 'summary',
            sourceEmail: email.from,
            extractedAt: new Date().toISOString(),
            meetingDate: meeting.start_time,
            duration: String(Math.floor(meeting.duration_seconds / 60)),
            participants: meeting.participants?.map(p => p.name || p.email || 'Unknown') || [],
            originalUrl: url,
            meetingId,
            meetingTitle: meeting.title,
          },
          rawData: meeting,
        };
        
        return summaryContent;
      }
      
      // If neither transcript nor summary, but recording URL is available
      if (meeting.recording_url) {
        const recordingContent: ExtractedContent = {
          id: `readai-recording-${meetingId}`,
          type: 'readai_recording',
          platform: 'readai',
          title: `Read.ai Recording: ${meeting.title || 'Untitled Meeting'}`,
          content: `Meeting Title: ${meeting.title || 'Untitled Meeting'}\n` +
                  `Date: ${meeting.start_time || 'Unknown'}\n` +
                  `Duration: ${Math.floor(meeting.duration_seconds / 60) || 'Unknown'} minutes\n` +
                  `Recording URL: ${meeting.recording_url}`,
          metadata: {
            source: 'readai',
            sourceType: 'recording_metadata',
            sourceEmail: email.from,
            extractedAt: new Date().toISOString(),
            meetingDate: meeting.start_time,
            duration: String(Math.floor(meeting.duration_seconds / 60)),
            originalUrl: url,
            meetingId,
            meetingTitle: meeting.title,
            recordingUrl: meeting.recording_url,
          },
          rawData: meeting,
        };
        
        return recordingContent;
      }
      
      // If no useful content is available
      return null;
    } catch (error) {
      console.error('Error extracting Read.ai content:', error);
      return null;
    }
  }

  /**
   * Process an email to extract and store content from Zoom, FireFlies.ai, and Read.ai links
   */
  async processEmail(
    email: GmailEmail, 
    archonService: ArchonService
  ): Promise<{
    processedLinks: string[];
    extractedContents: ExtractedContent[];
  }> {
    const { zoomLinks, firefliesLinks, readaiLinks } = this.detectContentLinks(email);
    const processedLinks: string[] = [];
    const extractedContents: ExtractedContent[] = [];
    
    // Process Zoom links
    for (const link of zoomLinks) {
      try {
        const content = await this.extractZoomContent(link, email);
        if (content) {
          // Store in Archon
          const archonDocument: ArchonDocument = {
            content: content.content,
            metadata: {
              ...content.metadata,
              tags: ['zoom', 'meeting', content.type],
              title: content.title,
            },
          };
          
          await archonService.storeDocument(archonDocument);
          
          extractedContents.push(content);
          processedLinks.push(link);
        }
      } catch (error) {
        console.error(`Error processing Zoom link ${link}:`, error);
      }
    }
    
    // Process FireFlies.ai links
    for (const link of firefliesLinks) {
      try {
        const content = await this.extractFirefliesContent(link, email);
        if (content) {
          // Store in Archon
          const archonDocument: ArchonDocument = {
            content: content.content,
            metadata: {
              ...content.metadata,
              tags: ['fireflies', 'meeting', content.type],
              title: content.title,
            },
          };
          
          await archonService.storeDocument(archonDocument);
          
          extractedContents.push(content);
          processedLinks.push(link);
        }
      } catch (error) {
        console.error(`Error processing FireFlies.ai link ${link}:`, error);
      }
    }
    
    // Process Read.ai links
    for (const link of readaiLinks) {
      try {
        const content = await this.extractReadAiContent(link, email);
        if (content) {
          // Store in Archon
          const archonDocument: ArchonDocument = {
            content: content.content,
            metadata: {
              ...content.metadata,
              tags: ['readai', 'meeting', content.type],
              title: content.title,
            },
          };
          
          await archonService.storeDocument(archonDocument);
          
          extractedContents.push(content);
          processedLinks.push(link);
        }
      } catch (error) {
        console.error(`Error processing Read.ai link ${link}:`, error);
      }
    }
    
    return { processedLinks, extractedContents };
  }
}

// Helper function to create a ContentExtractorService from environment variables
export const createContentExtractorService = (): ContentExtractorService => {
  const config: ContentExtractorConfig = {
    zoomApiKey: process.env.REACT_APP_ZOOM_API_KEY,
    zoomApiSecret: process.env.REACT_APP_ZOOM_API_SECRET,
    firefliesApiKey: process.env.REACT_APP_FIREFLIES_API_KEY,
    firefliesWorkspaceId: process.env.REACT_APP_FIREFLIES_WORKSPACE_ID,
    readaiApiKey: process.env.REACT_APP_READAI_API_KEY,
    readaiOrgId: process.env.REACT_APP_READAI_ORG_ID,
  };
  
  return new ContentExtractorService(config);
};
