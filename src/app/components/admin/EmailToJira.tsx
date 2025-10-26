import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { JiraService, JiraConfig, JiraFollowUp } from '../../services/jira';
import { GmailService, GmailConfig, GmailEmail } from '../../services/gmail';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';

interface EmailToJiraProps {
  jiraConfig: JiraConfig | null;
  gmailConfig: GmailConfig | null;
}

const EmailToJira: React.FC<EmailToJiraProps> = ({ jiraConfig, gmailConfig }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [issueType, setIssueType] = useState('10001'); // Default to Task
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    issues?: { emailId: string; issueKey: string }[];
  } | null>(null);
  const [jiraService, setJiraService] = useState<JiraService | null>(null);
  const [gmailService, setGmailService] = useState<GmailService | null>(null);
  const [followUpData, setFollowUpData] = useState<{
    issueKey: string;
    message: string;
    channel: 'slack' | 'whatsapp' | 'email';
    recipient: string;
  } | null>(null);

  useEffect(() => {
    const initServices = async () => {
      // Initialize Jira service
      if (jiraConfig) {
        try {
          const service = new JiraService(jiraConfig);
          const connected = await service.testConnection();
          
          if (connected) {
            setJiraService(service);
          } else {
            setResult({
              success: false,
              message: 'Failed to connect to Jira. Please check your configuration.',
            });
          }
        } catch (error) {
          console.error('Error initializing Jira service:', error);
        }
      }

      // Initialize Gmail service
      if (gmailConfig) {
        try {
          const service = new GmailService(gmailConfig);
          const connected = await service.testConnection();
          
          if (connected) {
            setGmailService(service);
            // Load emails
            fetchEmails(service);
          } else {
            setResult({
              success: false,
              message: 'Failed to connect to Gmail. Please check your configuration.',
            });
          }
        } catch (error) {
          console.error('Error initializing Gmail service:', error);
        }
      }
    };

    initServices();
  }, [jiraConfig, gmailConfig]);

  const fetchEmails = async (service: GmailService) => {
    setIsLoading(true);
    try {
      const fetchedEmails = await service.listUnreadEmails(10);
      setEmails(fetchedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setResult({
        success: false,
        message: 'Failed to fetch emails from Gmail.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshEmails = () => {
    if (gmailService) {
      fetchEmails(gmailService);
    }
  };

  const handleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(emailId)) {
        return prev.filter(id => id !== emailId);
      } else {
        return [...prev, emailId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };

  const handleConvertToJira = async () => {
    if (!jiraService || !gmailService) {
      setResult({
        success: false,
        message: 'Services not initialized. Please check your configuration.',
      });
      return;
    }

    if (selectedEmails.length === 0) {
      setResult({
        success: false,
        message: 'Please select at least one email to convert.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const results: { emailId: string; issueKey: string }[] = [];
      
      for (const emailId of selectedEmails) {
        const email = emails.find(e => e.id === emailId);
        if (!email) continue;
        
        const issueKey = await jiraService.convertEmailToIssue(
          {
            subject: email.subject,
            from: email.from,
            body: email.body,
          },
          issueType
        );
        
        if (issueKey) {
          results.push({ emailId, issueKey });
          
          // Mark email as read and add label
          await gmailService.markAsRead(emailId);
          await gmailService.addLabel(emailId, 'Jira-Task');
        }
      }
      
      if (results.length > 0) {
        setResult({
          success: true,
          message: `Successfully created ${results.length} Jira ${results.length === 1 ? 'issue' : 'issues'}.`,
          issues: results,
        });
        
        // Refresh emails
        fetchEmails(gmailService);
      } else {
        setResult({
          success: false,
          message: 'Failed to create any Jira issues.',
        });
      }
    } catch (error) {
      console.error('Error converting emails to Jira issues:', error);
      setResult({
        success: false,
        message: 'Error converting emails to Jira issues. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFollowUp = async () => {
    if (!jiraService || !followUpData) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await jiraService.createFollowUp(followUpData as JiraFollowUp);
      
      if (success) {
        setResult({
          success: true,
          message: `Successfully created follow-up via ${followUpData.channel} for issue ${followUpData.issueKey}.`,
        });
        setFollowUpData(null);
      } else {
        setResult({
          success: false,
          message: 'Failed to create follow-up.',
        });
      }
    } catch (error) {
      console.error('Error creating follow-up:', error);
      setResult({
        success: false,
        message: 'Error creating follow-up. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!jiraConfig || !gmailConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email to Jira</CardTitle>
          <CardDescription>Convert emails to Jira tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Please configure both Jira and Gmail integrations in the API Configurations tab before using this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email to Jira</CardTitle>
        <CardDescription>Convert emails to Jira tasks and create follow-ups</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inbox">Gmail Inbox</TabsTrigger>
            <TabsTrigger value="followup">Create Follow-ups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="selectAll" 
                  checked={selectedEmails.length === emails.length && emails.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll">Select All</Label>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshEmails}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {isLoading && emails.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No unread emails found in your inbox.
              </div>
            ) : (
              <div className="space-y-2">
                {emails.map(email => (
                  <div 
                    key={email.id} 
                    className={`p-4 border rounded-md ${selectedEmails.includes(email.id) ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id={`email-${email.id}`} 
                        checked={selectedEmails.includes(email.id)}
                        onCheckedChange={() => handleEmailSelection(email.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{email.subject}</div>
                        <div className="text-sm text-gray-500">From: {email.from}</div>
                        <div className="text-sm mt-1 line-clamp-2">{email.snippet}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Issue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10001">Task</SelectItem>
                  <SelectItem value="10002">Story</SelectItem>
                  <SelectItem value="10004">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="followup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="issueKey">Jira Issue Key</Label>
              <Input 
                id="issueKey" 
                placeholder="e.g., PROJ-123" 
                value={followUpData?.issueKey || ''}
                onChange={e => setFollowUpData(prev => ({ ...prev || { message: '', channel: 'slack', recipient: '' }, issueKey: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="followupChannel">Follow-up Channel</Label>
              <Select 
                value={followUpData?.channel || 'slack'} 
                onValueChange={value => setFollowUpData(prev => ({ ...prev || { issueKey: '', message: '', recipient: '' }, channel: value as 'slack' | 'whatsapp' | 'email' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input 
                id="recipient" 
                placeholder={followUpData?.channel === 'email' ? 'Email address' : followUpData?.channel === 'slack' ? 'Slack user ID or channel' : 'Phone number'}
                value={followUpData?.recipient || ''}
                onChange={e => setFollowUpData(prev => ({ ...prev || { issueKey: '', message: '', channel: 'slack' }, recipient: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="followupMessage">Message</Label>
              <Input 
                id="followupMessage" 
                placeholder="Follow-up message"
                value={followUpData?.message || ''}
                onChange={e => setFollowUpData(prev => ({ ...prev || { issueKey: '', channel: 'slack', recipient: '' }, message: e.target.value }))}
              />
            </div>
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
            <AlertDescription>
              {result.message}
              {result.issues && result.issues.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Created Issues:</p>
                  <ul className="list-disc pl-5">
                    {result.issues.map((issue, index) => (
                      <li key={index}>
                        <a 
                          href={`${jiraConfig.domain}/browse/${issue.issueKey}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {issue.issueKey}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {activeTab === 'inbox' ? (
          <Button 
            onClick={handleConvertToJira} 
            disabled={isLoading || selectedEmails.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert to Jira Tasks'
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleCreateFollowUp} 
            disabled={isLoading || !followUpData?.issueKey || !followUpData?.message || !followUpData?.recipient}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Follow-up...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Follow-up
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmailToJira;
