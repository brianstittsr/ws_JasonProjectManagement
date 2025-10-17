import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { PlaybookTemplate } from '../../services/playbookAutomation';
import { JiraPlaybooksService, createJiraPlaybooksService } from '../../services/jiraPlaybooks';

interface PlaybookJiraExportProps {
  template: PlaybookTemplate;
  open: boolean;
  onClose: () => void;
}

const PlaybookJiraExport: React.FC<PlaybookJiraExportProps> = ({ template, open, onClose }) => {
  const [jiraConfig, setJiraConfig] = useState({
    domain: localStorage.getItem('jira-domain') || '',
    email: localStorage.getItem('jira-email') || '',
    apiToken: localStorage.getItem('jira-api-token') || '',
    projectKey: localStorage.getItem('jira-project-key') || '',
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>('untested');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJiraConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    if (!jiraConfig.domain || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
      setError('Please fill in all Jira configuration fields');
      return;
    }
    
    setTestingConnection(true);
    setError(null);
    
    try {
      const jiraService = createJiraPlaybooksService(jiraConfig);
      const isConnected = await jiraService.testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
        setSuccess('Successfully connected to Jira');
        
        // Save config to localStorage
        localStorage.setItem('jira-domain', jiraConfig.domain);
        localStorage.setItem('jira-email', jiraConfig.email);
        localStorage.setItem('jira-api-token', jiraConfig.apiToken);
        localStorage.setItem('jira-project-key', jiraConfig.projectKey);
      } else {
        setConnectionStatus('failed');
        setError('Failed to connect to Jira. Please check your credentials.');
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError(`Error connecting to Jira: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExport = async () => {
    if (connectionStatus !== 'success') {
      setError('Please test the connection first');
      return;
    }
    
    setIsExporting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const jiraService = createJiraPlaybooksService(jiraConfig);
      
      // Convert Mattermost playbook to Jira playbook
      const jiraPlaybook = jiraService.convertMattermostPlaybook(template, jiraConfig.projectKey);
      
      // Create the playbook in Jira
      await jiraService.createPlaybook(jiraPlaybook);
      
      setSuccess(`Successfully exported "${template.name}" to Jira`);
    } catch (err) {
      setError(`Error exporting playbook to Jira: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Playbook to Jira</DialogTitle>
          <DialogDescription>
            Export "{template.name}" as a Jira workflow with issues and automation rules.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Jira Domain</Label>
            <Input 
              id="domain"
              name="domain"
              placeholder="your-domain"
              value={jiraConfig.domain}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              Your Atlassian domain, e.g. "your-domain" for "your-domain.atlassian.net"
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              name="email"
              type="email"
              placeholder="your-email@example.com"
              value={jiraConfig.email}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <Input 
              id="apiToken"
              name="apiToken"
              type="password"
              placeholder="Your Jira API token"
              value={jiraConfig.apiToken}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              <a 
                href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Create an API token
              </a>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectKey">Project Key</Label>
            <Input 
              id="projectKey"
              name="projectKey"
              placeholder="PROJECT"
              value={jiraConfig.projectKey}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              The key of the Jira project where the playbook will be created
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || connectionStatus !== 'success'}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              'Export to Jira'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaybookJiraExport;
