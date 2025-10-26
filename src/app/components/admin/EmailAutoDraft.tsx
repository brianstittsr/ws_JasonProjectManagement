import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Copy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { GmailService, GmailConfig, GmailEmail } from '../../services/gmail';
import { ArchonService, ArchonResponseDraft } from '../../services/archon';

interface EmailAutoDraftProps {
  gmailConfig: GmailConfig | null;
  archonConfig?: any;
}

const EmailAutoDraft: React.FC<EmailAutoDraftProps> = ({ gmailConfig, archonConfig }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState<ArchonResponseDraft | null>(null);
  const [editedResponse, setEditedResponse] = useState({ subject: '', body: '' });
  const [gmailService, setGmailService] = useState<GmailService | null>(null);
  const [archonService, setArchonService] = useState<ArchonService | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [continuousStorageEnabled, setContinuousStorageEnabled] = useState(false);
  const [storageInterval, setStorageInterval] = useState(15);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [labelToMonitor, setLabelToMonitor] = useState('INBOX');

  useEffect(() => {
    const initServices = async () => {
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

      // Initialize Archon service
      try {
        const service = await createArchonService();
        if (service) {
          setArchonService(service);
        } else {
          setResult({
            success: false,
            message: 'Failed to connect to Archon. Please check your configuration.',
          });
        }
      } catch (error) {
        console.error('Error initializing Archon service:', error);
      }
    };

    initServices();
  }, [gmailConfig, archonConfig]);

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
    setSelectedEmail(emailId);
    setResponseDraft(null);
    setEditedResponse({ subject: '', body: '' });
  };

  const handleGenerateResponse = async () => {
    if (!archonService || !selectedEmail) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const email = emails.find(e => e.id === selectedEmail);
      if (!email) {
        setResult({
          success: false,
          message: 'Selected email not found.',
        });
        setIsLoading(false);
        return;
      }

      const draft = await archonService.generateResponseDraft(
        {
          subject: email.subject,
          body: email.body,
          from: email.from
        },
        { useTag: 'resbyte', maxReferences: 5 }
      );

      if (draft) {
        setResponseDraft(draft);
        setEditedResponse({
          subject: draft.subject,
          body: draft.body
        });
        setResult({
          success: true,
          message: 'Response draft generated successfully.',
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to generate response draft. No relevant knowledge found.',
        });
      }
    } catch (error) {
      console.error('Error generating response draft:', error);
      setResult({
        success: false,
        message: 'Error generating response draft. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    const textToCopy = `Subject: ${editedResponse.subject}\n\n${editedResponse.body}`;
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setResult({
          success: true,
          message: 'Response copied to clipboard.',
        });
      },
      () => {
        setResult({
          success: false,
          message: 'Failed to copy response to clipboard.',
        });
      }
    );
  };

  const handleSetupContinuousStorage = async () => {
    if (!archonService || !gmailConfig) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const success = await archonService.setupContinuousEmailStorage(
        gmailConfig,
        {
          storageInterval,
          includeAttachments,
          labelToMonitor
        }
      );

      if (success) {
        setContinuousStorageEnabled(true);
        setResult({
          success: true,
          message: 'Continuous email storage setup successfully.',
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to setup continuous email storage.',
        });
      }
    } catch (error) {
      console.error('Error setting up continuous email storage:', error);
      setResult({
        success: false,
        message: 'Error setting up continuous email storage. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!gmailConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Auto-Draft</CardTitle>
          <CardDescription>Auto-draft responses to emails based on Archon knowledgebase</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Please configure Gmail integration in the API Configurations tab before using this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Auto-Draft</CardTitle>
        <CardDescription>Auto-draft responses to emails based on Archon knowledgebase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inbox">Draft Responses</TabsTrigger>
            <TabsTrigger value="storage">Continuous Storage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Gmail Inbox</h3>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Select an Email</h4>
                {isLoading && emails.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : emails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No unread emails found in your inbox.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {emails.map(email => (
                      <div 
                        key={email.id} 
                        className={`p-4 border rounded-md cursor-pointer ${selectedEmail === email.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                        onClick={() => handleEmailSelection(email.id)}
                      >
                        <div className="font-medium">{email.subject}</div>
                        <div className="text-sm text-gray-500">From: {email.from}</div>
                        <div className="text-sm mt-1 line-clamp-2">{email.snippet}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Email Content</h4>
                {selectedEmail ? (
                  <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                    <div className="font-medium">
                      {emails.find(e => e.id === selectedEmail)?.subject}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      From: {emails.find(e => e.id === selectedEmail)?.from}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {emails.find(e => e.id === selectedEmail)?.body}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-[300px] border rounded-md">
                    <p className="text-gray-500">Select an email to view its content</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateResponse} 
                  disabled={isLoading || !selectedEmail}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Response Draft'
                  )}
                </Button>
              </div>
            </div>
            
            {responseDraft && (
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">Response Draft</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="responseSubject">Subject</Label>
                  <Input 
                    id="responseSubject" 
                    value={editedResponse.subject}
                    onChange={(e) => setEditedResponse(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="responseBody">Body</Label>
                  <Textarea 
                    id="responseBody" 
                    value={editedResponse.body}
                    onChange={(e) => setEditedResponse(prev => ({ ...prev, body: e.target.value }))}
                    className="min-h-[200px]"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
                
                {responseDraft.references.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Knowledge References</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {responseDraft.references.map((ref, index) => (
                        <div key={index} className="border rounded-md p-3">
                          <div className="font-medium">{ref.title}</div>
                          <div className="text-sm text-gray-500">Source: {ref.source}</div>
                          <div className="text-sm text-gray-500">Relevance: {(ref.relevanceScore * 100).toFixed(1)}%</div>
                          <div className="mt-1 text-sm">{ref.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="storage" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Continuous Email Storage</h3>
              
              <div className="space-y-2">
                <Label htmlFor="storageInterval">Storage Interval (minutes)</Label>
                <Input 
                  id="storageInterval" 
                  type="number"
                  min="5"
                  value={storageInterval}
                  onChange={(e) => setStorageInterval(parseInt(e.target.value) || 15)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="labelToMonitor">Label to Monitor</Label>
                <Input 
                  id="labelToMonitor" 
                  value={labelToMonitor}
                  onChange={(e) => setLabelToMonitor(e.target.value)}
                  placeholder="INBOX"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeAttachments" 
                  checked={includeAttachments}
                  onCheckedChange={(checked) => setIncludeAttachments(!!checked)}
                />
                <Label htmlFor="includeAttachments">Include Attachments</Label>
              </div>
              
              <Button 
                onClick={handleSetupContinuousStorage} 
                disabled={isLoading || continuousStorageEnabled}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : continuousStorageEnabled ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Continuous Storage Enabled
                  </>
                ) : (
                  'Setup Continuous Email Storage'
                )}
              </Button>
              
              <Alert>
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                  <p>This feature will periodically check your Gmail inbox for new emails and store them in the Archon knowledgebase.</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Emails will be stored with metadata and content</li>
                    <li>Attachments can be optionally included</li>
                    <li>All stored emails will be available for knowledge retrieval</li>
                    <li>Emails tagged with "resbyte" will be used for response generation</li>
                  </ul>
                </AlertDescription>
              </Alert>
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
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to create Archon service
const createArchonService = async (): Promise<ArchonService | null> => {
  try {
    const config = {
      apiUrl: process.env.REACT_APP_ARCHON_API_URL || '',
      apiKey: process.env.REACT_APP_ARCHON_API_KEY || '',
      vectorDb: process.env.REACT_APP_ARCHON_VECTOR_DB || 'pinecone',
      embeddingModel: process.env.REACT_APP_ARCHON_EMBEDDING_MODEL || 'text-embedding-ada-002',
      completionModel: process.env.REACT_APP_ARCHON_COMPLETION_MODEL || 'gpt-4-turbo'
    };
    
    if (!config.apiUrl || !config.apiKey) {
      console.error('Archon configuration is incomplete');
      return null;
    }
    
    const archonService = new ArchonService(config);
    const isConnected = await archonService.testConnection();
    
    if (isConnected) {
      return archonService;
    }
    return null;
  } catch (error) {
    console.error('Failed to create Archon service:', error);
    return null;
  }
};

export default EmailAutoDraft;
