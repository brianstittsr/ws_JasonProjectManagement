import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Send, Calendar, Clock, Users, FileText, Link, Copy } from 'lucide-react';
import { ZoomService, ZoomMeeting, CreateMeetingParams } from '../../services/zoom';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { format, parseISO, addMinutes } from 'date-fns';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  meeting?: ZoomMeeting;
}

interface ZoomAiChatProps {
  zoomService: ZoomService | null;
}

const ZoomAiChat: React.FC<ZoomAiChatProps> = ({ zoomService }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Welcome to Zoom AI Chat! I can help you create and manage Zoom meetings. Just tell me what kind of meeting you need to schedule.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    // Check if Zoom service is available
    if (!zoomService) {
      setError('Zoom service is not configured. Please set up your Zoom API credentials first.');
      return;
    }
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);
    
    try {
      // Process the user message to extract meeting details
      const meetingDetails = await processUserMessage(input);
      
      if (meetingDetails) {
        // Create the meeting
        const meeting = await zoomService.createMeeting(meetingDetails);
        
        // Format response with meeting details
        const responseContent = formatMeetingResponse(meeting);
        
        // Add assistant message with meeting details
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: responseContent,
          meeting 
        }]);
      } else {
        // If we couldn't extract meeting details, ask for more information
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I need more details to create your meeting. Please provide information like topic, date, time, and duration. For example: 'Schedule a team meeting tomorrow at 2pm for 1 hour.'" 
        }]);
      }
    } catch (err) {
      console.error('Error processing message:', err);
      setError('Failed to create meeting. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't create the meeting. Please try again with different details." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process user message to extract meeting details
  const processUserMessage = async (message: string): Promise<CreateMeetingParams | null> => {
    // This is a simplified version - in a real app, you'd use NLP or an AI service
    // to extract meeting details from natural language
    
    // For now, we'll use some basic regex patterns to extract information
    let topic = '';
    let dateTime = '';
    let duration = 30; // Default duration: 30 minutes
    let agenda = '';
    
    // Extract topic (anything after "schedule", "create", "set up" followed by "a", "an", "the" and then the topic)
    const topicMatch = message.match(/(?:schedule|create|set up|organize)(?:\s+an?|\s+the)?\s+(.+?)(?:\s+on|\s+at|\s+for|\s+tomorrow|\s+today|$)/i);
    if (topicMatch) {
      topic = topicMatch[1].trim();
    } else {
      // Fallback: just use the first part of the message
      topic = message.split(' ').slice(0, 3).join(' ') + ' Meeting';
    }
    
    // Extract date and time
    const dateTimeRegex = /(?:on|for)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i;
    const dateTimeMatch = message.match(dateTimeRegex);
    
    if (dateTimeMatch) {
      const date = dateTimeMatch[1];
      const time = dateTimeMatch[2] || '9:00am'; // Default time if not specified
      
      // Convert to ISO format (simplified)
      const now = new Date();
      let meetingDate = now;
      
      if (date.toLowerCase() === 'today') {
        meetingDate = now;
      } else if (date.toLowerCase() === 'tomorrow') {
        meetingDate = new Date(now);
        meetingDate.setDate(meetingDate.getDate() + 1);
      } else {
        // For simplicity, we'll just use today's date
        // In a real app, you'd parse the date properly
        meetingDate = now;
      }
      
      // Parse time (simplified)
      const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const ampm = timeMatch[3]?.toLowerCase();
        
        // Convert to 24-hour format
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        meetingDate.setHours(hours, minutes, 0, 0);
      }
      
      // Format as ISO string
      dateTime = meetingDate.toISOString();
    } else {
      // Default to 1 hour from now
      dateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    }
    
    // Extract duration
    const durationMatch = message.match(/for\s+(\d+)\s*(?:min(?:ute)?s?|hours?)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[0].includes('hour') ? 60 : 1; // Convert hours to minutes
      duration = value * unit;
    }
    
    // Extract agenda
    const agendaMatch = message.match(/(?:agenda|discuss|about)(?:\s+is|\s*:)?\s+(.+?)(?:$|\.)/i);
    if (agendaMatch) {
      agenda = agendaMatch[1].trim();
    }
    
    // Return meeting parameters
    return {
      topic,
      start_time: dateTime,
      duration,
      agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
      }
    };
  };

  // Format meeting response
  const formatMeetingResponse = (meeting: ZoomMeeting): string => {
    const startTime = parseISO(meeting.start_time);
    const endTime = addMinutes(startTime, meeting.duration);
    
    return `✅ Meeting created successfully!

**${meeting.topic}**
📅 ${format(startTime, 'EEEE, MMMM d, yyyy')}
🕒 ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')} (${meeting.timezone})
⏱️ ${meeting.duration} minutes
${meeting.agenda ? `📝 Agenda: ${meeting.agenda}` : ''}

Join URL: ${meeting.join_url}
${meeting.password ? `Password: ${meeting.password}` : ''}`;
  };

  // Copy meeting link to clipboard
  const copyMeetingLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setError('Meeting link copied to clipboard!');
    setTimeout(() => setError(null), 3000);
  };

  // Render a message
  const renderMessage = (message: Message, index: number) => {
    if (message.role === 'system') {
      return (
        <div key={index} className="text-center text-sm text-gray-500 my-4">
          {message.content}
        </div>
      );
    }
    
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={index} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div 
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}
        >
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line.startsWith('**') && line.endsWith('**') ? (
                <div className="font-bold text-lg">
                  {line.substring(2, line.length - 2)}
                </div>
              ) : line.startsWith('Join URL:') ? (
                <div className="flex items-center gap-2 mt-2">
                  <Link className="h-4 w-4" />
                  <a 
                    href={line.substring(10).trim()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 underline break-all"
                  >
                    {line.substring(10).trim()}
                  </a>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyMeetingLink(line.substring(10).trim())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : line.startsWith('Password:') ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Password:</span>
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    {line.substring(10).trim()}
                  </code>
                </div>
              ) : line.startsWith('📅') ? (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{line.substring(2).trim()}</span>
                </div>
              ) : line.startsWith('🕒') ? (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  <span>{line.substring(2).trim()}</span>
                </div>
              ) : line.startsWith('⏱️') ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{line.substring(2).trim()}</Badge>
                </div>
              ) : line.startsWith('📝') ? (
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="h-4 w-4" />
                  <span>{line.substring(2).trim()}</span>
                </div>
              ) : (
                <div>{line || <br />}</div>
              )}
            </React.Fragment>
          ))}
          
          {message.meeting && (
            <div className="mt-4 flex justify-end">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(message.meeting?.join_url, '_blank')}
              >
                Open in Zoom
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Zoom AI Chat</CardTitle>
        <CardDescription>
          Create and manage Zoom meetings using natural language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[400px] overflow-y-auto p-4 border rounded-md">
          {messages.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
        </div>
        
        {error && (
          <Alert variant={error.includes('copied') ? 'default' : 'destructive'}>
            <AlertTitle>{error.includes('copied') ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isProcessing || !zoomService}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isProcessing || !input.trim() || !zoomService}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        {!zoomService ? (
          <div className="w-full text-center">
            <p className="mb-2">Zoom API is not configured.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/admin/api-config'}
            >
              Configure Zoom API
            </Button>
          </div>
        ) : (
          <p>
            Try saying: "Schedule a team meeting tomorrow at 2pm for 1 hour" or "Create a project review meeting on Friday at 10am"
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default ZoomAiChat;
