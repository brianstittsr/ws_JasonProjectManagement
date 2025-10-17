import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Loader2, Calendar, Clock, Users, Link, ExternalLink, Trash2 } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import AdminLayout from '../layouts/AdminLayout';
import ZoomAiChat from '../components/zoom/ZoomAiChat';
import { ZoomService, ZoomMeeting, createZoomService } from '../services/zoom';

const ZoomMeetingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ai-chat');
  const [zoomService, setZoomService] = useState<ZoomService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initZoomService = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create Zoom service
        const service = createZoomService();
        setZoomService(service);
        
        if (service) {
          // Test connection
          const connected = await service.testConnection();
          setIsConnected(connected);
          
          if (connected) {
            // Load meetings
            const meetingsList = await service.listMeetings();
            setMeetings(meetingsList);
          } else {
            setError('Failed to connect to Zoom API. Please check your credentials.');
          }
        } else {
          setError('Zoom API is not configured. Please set up your Zoom API credentials.');
        }
      } catch (err) {
        console.error('Error initializing Zoom service:', err);
        setError('An error occurred while connecting to Zoom API.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initZoomService();
  }, []);

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!zoomService) return;
    
    try {
      await zoomService.deleteMeeting(meetingId);
      setMeetings(meetings.filter(meeting => meeting.id !== meetingId));
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError('Failed to delete meeting. Please try again.');
    }
  };

  const refreshMeetings = async () => {
    if (!zoomService) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const meetingsList = await zoomService.listMeetings();
      setMeetings(meetingsList);
    } catch (err) {
      console.error('Error refreshing meetings:', err);
      setError('Failed to refresh meetings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Zoom Meetings</h1>
          {isConnected && (
            <Button 
              variant="outline" 
              onClick={refreshMeetings} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Refresh Meetings
            </Button>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="ai-chat" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai-chat" className="space-y-4 mt-6">
            <ZoomAiChat zoomService={zoomService} />
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : meetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map(meeting => {
                  const startTime = parseISO(meeting.start_time);
                  const endTime = addMinutes(startTime, meeting.duration);
                  
                  return (
                    <Card key={meeting.id}>
                      <CardHeader>
                        <CardTitle>{meeting.topic}</CardTitle>
                        <CardDescription>
                          {format(startTime, 'EEEE, MMMM d, yyyy')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Host: {meeting.host_email}</span>
                          </div>
                          <div className="flex items-center">
                            <Link className="h-4 w-4 mr-2" />
                            <a 
                              href={meeting.join_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 underline truncate"
                            >
                              Join Meeting
                            </a>
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(meeting.join_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No upcoming meetings</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any upcoming Zoom meetings scheduled.
                </p>
                <Button onClick={() => setActiveTab('ai-chat')}>
                  Create a Meeting with AI Chat
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ZoomMeetingsPage;
