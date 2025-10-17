import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import TranscriptToJira from '../components/admin/TranscriptToJira';
import EmailToJira from '../components/admin/EmailToJira';
import EmailAutoDraft from '../components/admin/EmailAutoDraft';
import JiraNotifications from '../components/admin/JiraNotifications';
import ContentAutomation from '../components/admin/ContentAutomation';
import { JiraConfig } from '../services/jira';
import { GmailConfig } from '../services/gmail';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const TranscriptProcessingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('jira');
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(null);
  const [firefliesConfig, setFirefliesConfig] = useState<any | null>(null);
  const [gmailConfig, setGmailConfig] = useState<GmailConfig | null>(null);
  const [whatsAppConfig, setWhatsAppConfig] = useState<any | null>(null);

  useEffect(() => {
    // Load configurations from localStorage or your backend
    const loadConfigurations = () => {
      try {
        // Load Jira config
        const savedJiraConfig = localStorage.getItem('jira-config');
        if (savedJiraConfig) {
          setJiraConfig(JSON.parse(savedJiraConfig));
        }

        // Load FireFlies config
        const savedFirefliesConfig = localStorage.getItem('fireflies-config');
        if (savedFirefliesConfig) {
          setFirefliesConfig(JSON.parse(savedFirefliesConfig));
        }

        // Load Gmail config
        const savedGmailConfig = localStorage.getItem('gmail-config');
        if (savedGmailConfig) {
          setGmailConfig(JSON.parse(savedGmailConfig));
        }
        
        // Load WhatsApp config
        const savedWhatsAppConfig = localStorage.getItem('whatsapp-config');
        if (savedWhatsAppConfig) {
          setWhatsAppConfig(JSON.parse(savedWhatsAppConfig));
        }
      } catch (error) {
        console.error('Error loading configurations:', error);
      }
    };

    loadConfigurations();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Content Processing</h1>
        <p className="text-gray-600 mb-6">
          Convert meeting transcripts and emails into actionable items in your project management tools.
        </p>

        <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="jira">Transcript to Jira</TabsTrigger>
            <TabsTrigger value="email">Email to Jira</TabsTrigger>
            <TabsTrigger value="autodraft">Auto-Draft Responses</TabsTrigger>
            <TabsTrigger value="notifications">Jira Notifications</TabsTrigger>
            <TabsTrigger value="automation">Content Automation</TabsTrigger>
            <TabsTrigger value="fireflies">FireFlies Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira" className="mt-6">
            <TranscriptToJira jiraConfig={jiraConfig} />
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            <EmailToJira jiraConfig={jiraConfig} gmailConfig={gmailConfig} />
          </TabsContent>
          
          <TabsContent value="autodraft" className="mt-6">
            <EmailAutoDraft gmailConfig={gmailConfig} />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <JiraNotifications jiraConfig={jiraConfig} whatsAppConfig={whatsAppConfig} />
          </TabsContent>
          
          <TabsContent value="automation" className="mt-6">
            <ContentAutomation gmailConfig={gmailConfig} />
          </TabsContent>
          
          <TabsContent value="fireflies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>FireFlies.AI Integration</CardTitle>
                <CardDescription>Automatically process FireFlies.AI transcripts</CardDescription>
              </CardHeader>
              <CardContent>
                {firefliesConfig ? (
                  <p>FireFlies.AI integration configuration would go here</p>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Configured</AlertTitle>
                    <AlertDescription>
                      Please configure FireFlies.AI integration in the API Configurations tab before using this feature.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default TranscriptProcessingPage;
