import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, Bell, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { JiraConfig } from '../../services/jira';
import { JiraNotificationService, JiraNotification } from '../../services/jiraNotification';

interface JiraNotificationsProps {
  jiraConfig: JiraConfig | null;
  whatsAppConfig?: {
    apiUrl: string;
    phoneNumberId: string;
    businessAccountId: string;
    accessToken: string;
  } | null;
}

const JiraNotifications: React.FC<JiraNotificationsProps> = ({ jiraConfig, whatsAppConfig }) => {
  const [activeTab, setActiveTab] = useState('critical');
  const [isLoading, setIsLoading] = useState(false);
  const [jiraNotificationService, setJiraNotificationService] = useState<JiraNotificationService | null>(null);
  const [criticalMonitoringEnabled, setCriticalMonitoringEnabled] = useState(false);
  const [deadlineMonitoringEnabled, setDeadlineMonitoringEnabled] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState(15);
  const [deadlineThreshold, setDeadlineThreshold] = useState(48);
  const [whatsAppRecipients, setWhatsAppRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [notifications, setNotifications] = useState<JiraNotification[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const initService = async () => {
      if (jiraConfig) {
        try {
          const service = await createJiraNotificationService(jiraConfig);
          if (service) {
            setJiraNotificationService(service);
          } else {
            setResult({
              success: false,
              message: 'Failed to initialize Jira notification service. Please check your configuration.',
            });
          }
        } catch (error) {
          console.error('Error initializing Jira notification service:', error);
          setResult({
            success: false,
            message: 'Error initializing Jira notification service.',
          });
        }
      }
    };

    initService();
    
    // Cleanup on unmount
    return () => {
      if (jiraNotificationService) {
        jiraNotificationService.stopAllMonitoring();
      }
    };
  }, [jiraConfig]);

  const handleNotificationCallback = (newNotifications: JiraNotification[]) => {
    setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
    
    // Send WhatsApp notifications if configured
    if (whatsAppConfig && whatsAppRecipients.length > 0) {
      newNotifications.forEach(async notification => {
        for (const recipient of whatsAppRecipients) {
          await jiraNotificationService?.sendWhatsAppNotification(
            notification,
            recipient,
            {
              apiUrl: whatsAppConfig.apiUrl,
              phoneNumberId: whatsAppConfig.phoneNumberId,
              accessToken: whatsAppConfig.accessToken
            }
          );
        }
      });
    }
  };

  const handleStartCriticalMonitoring = () => {
    if (!jiraNotificationService) return;
    
    setIsLoading(true);
    
    try {
      jiraNotificationService.startCriticalIssuesMonitoring(handleNotificationCallback);
      setCriticalMonitoringEnabled(true);
      setResult({
        success: true,
        message: 'Critical issues monitoring started successfully.',
      });
    } catch (error) {
      console.error('Error starting critical issues monitoring:', error);
      setResult({
        success: false,
        message: 'Error starting critical issues monitoring.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDeadlineMonitoring = () => {
    if (!jiraNotificationService) return;
    
    setIsLoading(true);
    
    try {
      jiraNotificationService.startDeadlineMonitoring(
        handleNotificationCallback,
        deadlineThreshold
      );
      setDeadlineMonitoringEnabled(true);
      setResult({
        success: true,
        message: 'Deadline monitoring started successfully.',
      });
    } catch (error) {
      console.error('Error starting deadline monitoring:', error);
      setResult({
        success: false,
        message: 'Error starting deadline monitoring.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMonitoring = (type: 'critical' | 'deadline' | 'all') => {
    if (!jiraNotificationService) return;
    
    jiraNotificationService.stopAllMonitoring();
    
    if (type === 'critical' || type === 'all') {
      setCriticalMonitoringEnabled(false);
    }
    
    if (type === 'deadline' || type === 'all') {
      setDeadlineMonitoringEnabled(false);
    }
    
    setResult({
      success: true,
      message: `${type === 'all' ? 'All' : type} monitoring stopped successfully.`,
    });
  };

  const handleAddRecipient = () => {
    if (!newRecipient) return;
    
    // Basic validation for international phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(newRecipient)) {
      setResult({
        success: false,
        message: 'Please enter a valid international phone number (e.g., +1234567890).',
      });
      return;
    }
    
    setWhatsAppRecipients(prev => [...prev, newRecipient]);
    setNewRecipient('');
  };

  const handleRemoveRecipient = (recipient: string) => {
    setWhatsAppRecipients(prev => prev.filter(r => r !== recipient));
  };

  const handleTestNotification = async () => {
    if (!jiraNotificationService || !whatsAppConfig || whatsAppRecipients.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const testNotification: JiraNotification = {
        id: `test-${Date.now()}`,
        issueKey: 'TEST-123',
        issueTitle: 'Test Notification',
        priority: 'High',
        status: 'To Do',
        assignee: 'Test User',
        dueDate: new Date().toISOString(),
        issueTags: ['test', 'notification'],
        notificationType: 'critical',
        message: 'This is a test notification to verify WhatsApp integration.',
        createdAt: new Date().toISOString()
      };
      
      let successCount = 0;
      
      for (const recipient of whatsAppRecipients) {
        const success = await jiraNotificationService.sendWhatsAppNotification(
          testNotification,
          recipient,
          {
            apiUrl: whatsAppConfig.apiUrl,
            phoneNumberId: whatsAppConfig.phoneNumberId,
            accessToken: whatsAppConfig.accessToken
          }
        );
        
        if (success) {
          successCount++;
        }
      }
      
      setResult({
        success: successCount > 0,
        message: successCount > 0
          ? `Test notification sent successfully to ${successCount} recipient(s).`
          : 'Failed to send test notification to any recipients.',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setResult({
        success: false,
        message: 'Error sending test notification.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!jiraConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jira Notifications</CardTitle>
          <CardDescription>Monitor critical issues and deadlines in Jira</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Please configure Jira integration in the API Configurations tab before using this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Jira Notifications</CardTitle>
        <CardDescription>Monitor critical issues and deadlines in Jira</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="critical" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="critical">Critical Issues</TabsTrigger>
            <TabsTrigger value="deadline">Deadline Monitoring</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Setup</TabsTrigger>
            <TabsTrigger value="history">Notification History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="critical" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Critical Issues Monitoring</h3>
                  <p className="text-sm text-gray-500">Monitor issues tagged as 'critical' in Jira</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="criticalMonitoring">Enabled</Label>
                  <Switch 
                    id="criticalMonitoring" 
                    checked={criticalMonitoringEnabled}
                    disabled={isLoading}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        handleStartCriticalMonitoring();
                      } else {
                        handleStopMonitoring('critical');
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notificationInterval">Check Interval (minutes)</Label>
                <Input 
                  id="notificationInterval" 
                  type="number"
                  min="5"
                  value={notificationInterval}
                  onChange={(e) => setNotificationInterval(parseInt(e.target.value) || 15)}
                  disabled={criticalMonitoringEnabled}
                />
              </div>
              
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertTitle>How Critical Monitoring Works</AlertTitle>
                <AlertDescription>
                  <p>This feature will periodically check your Jira project for issues tagged as 'critical' and send notifications.</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Issues must have the label 'critical' in Jira</li>
                    <li>Only unresolved issues will trigger notifications</li>
                    <li>Notifications will be sent to configured WhatsApp recipients</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="deadline" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Deadline Monitoring</h3>
                  <p className="text-sm text-gray-500">Get notified before issue deadlines</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="deadlineMonitoring">Enabled</Label>
                  <Switch 
                    id="deadlineMonitoring" 
                    checked={deadlineMonitoringEnabled}
                    disabled={isLoading}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        handleStartDeadlineMonitoring();
                      } else {
                        handleStopMonitoring('deadline');
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadlineThreshold">Hours Before Deadline</Label>
                <Input 
                  id="deadlineThreshold" 
                  type="number"
                  min="1"
                  value={deadlineThreshold}
                  onChange={(e) => setDeadlineThreshold(parseInt(e.target.value) || 48)}
                  disabled={deadlineMonitoringEnabled}
                />
                <p className="text-sm text-gray-500">
                  Receive notifications this many hours before a deadline. Default is 48 hours (2 days).
                </p>
              </div>
              
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>How Deadline Monitoring Works</AlertTitle>
                <AlertDescription>
                  <p>This feature will check for issues with approaching deadlines and send notifications.</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Issues must have a due date set in Jira</li>
                    <li>Only unresolved issues will trigger notifications</li>
                    <li>You'll receive notifications 2 hours before any deadline</li>
                    <li>Additional notifications will be sent at the configured threshold</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">WhatsApp Notification Recipients</h3>
              
              <div className="space-y-2">
                <Label htmlFor="newRecipient">Add Recipient Phone Number</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="newRecipient" 
                    placeholder="+1234567890"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                  />
                  <Button onClick={handleAddRecipient}>Add</Button>
                </div>
                <p className="text-sm text-gray-500">
                  Enter phone numbers in international format (e.g., +1234567890)
                </p>
              </div>
              
              {whatsAppRecipients.length > 0 ? (
                <div className="space-y-2">
                  <Label>Current Recipients</Label>
                  <div className="space-y-2">
                    {whatsAppRecipients.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{recipient}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveRecipient(recipient)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No recipients added yet
                </p>
              )}
              
              <Button 
                onClick={handleTestNotification}
                disabled={isLoading || !whatsAppConfig || whatsAppRecipients.length === 0}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test Notification'
                )}
              </Button>
              
              {!whatsAppConfig && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>WhatsApp Not Configured</AlertTitle>
                  <AlertDescription>
                    Please configure WhatsApp Business API in the API Configurations tab to enable WhatsApp notifications.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Notification History</h3>
            
            {notifications.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-md ${
                      notification.notificationType === 'critical' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        notification.notificationType === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {notification.notificationType === 'critical' ? 'CRITICAL' : 'DEADLINE'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-medium mt-2">{notification.issueKey}: {notification.issueTitle}</div>
                    <div className="text-sm mt-1">{notification.message}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Priority: {notification.priority} | Status: {notification.status}
                      {notification.assignee && ` | Assignee: ${notification.assignee}`}
                      {notification.dueDate && ` | Due: ${new Date(notification.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No notifications yet. Start monitoring to see notifications here.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to create Jira notification service
const createJiraNotificationService = async (
  jiraConfig: JiraConfig
): Promise<JiraNotificationService | null> => {
  try {
    const notificationConfig = {
      webhookUrl: process.env.REACT_APP_JIRA_WEBHOOK_URL || '',
      notificationInterval: parseInt(process.env.REACT_APP_JIRA_NOTIFICATION_INTERVAL || '15')
    };
    
    const service = new JiraNotificationService(jiraConfig, notificationConfig);
    const isConnected = await service.testConnection();
    
    if (isConnected) {
      return service;
    }
    return null;
  } catch (error) {
    console.error('Failed to create Jira notification service:', error);
    return null;
  }
};

export default JiraNotifications;
