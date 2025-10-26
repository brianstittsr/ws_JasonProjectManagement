import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, Play, Pause, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { GmailConfig } from '../../services/gmail';
import { ContentAutomationService, AutomationRun, ContentAutomationConfig } from '../../services/contentAutomation';
import { Badge } from '../ui/badge';

interface ContentAutomationProps {
  gmailConfig: GmailConfig | null;
}

const ContentAutomation: React.FC<ContentAutomationProps> = ({ gmailConfig }) => {
  const [activeTab, setActiveTab] = useState('config');
  const [isLoading, setIsLoading] = useState(false);
  const [automationService, setAutomationService] = useState<ContentAutomationService | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<ContentAutomationConfig>({
    checkInterval: 15,
    maxEmailsToProcess: 10,
    labelProcessedEmails: true,
    processedLabel: 'Processed-Content',
    searchQuery: 'is:unread (zoom.us OR fireflies.ai)',
    enabled: false,
  });
  const [currentRun, setCurrentRun] = useState<AutomationRun | null>(null);
  const [runHistory, setRunHistory] = useState<AutomationRun[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const initService = async () => {
      if (gmailConfig) {
        try {
          setIsLoading(true);
          
          // Load saved configuration from localStorage
          const savedConfig = localStorage.getItem('content-automation-config');
          const configToUse = savedConfig ? JSON.parse(savedConfig) : config;
          
          // Create automation service
          const { createContentAutomationService } = await import('../../services/contentAutomation');
          const service = await createContentAutomationService(gmailConfig, configToUse);
          
          if (service) {
            setAutomationService(service);
            setConfig(service.getConfig());
            setIsRunning(service.isRunning());
            setCurrentRun(service.getCurrentRun());
            setRunHistory(service.getRunHistory());
            
            // Start automation if enabled
            if (configToUse.enabled && !service.isRunning()) {
              service.start();
              setIsRunning(true);
            }
            
            setResult({
              success: true,
              message: 'Content automation service initialized successfully.',
            });
          } else {
            setResult({
              success: false,
              message: 'Failed to initialize content automation service.',
            });
          }
        } catch (error) {
          console.error('Error initializing content automation service:', error);
          setResult({
            success: false,
            message: 'Error initializing content automation service.',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    initService();
    
    // Cleanup on unmount
    return () => {
      if (automationService?.isRunning()) {
        automationService.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gmailConfig, config]);

  const handleConfigChange = (key: keyof ContentAutomationConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    // Save to localStorage
    localStorage.setItem('content-automation-config', JSON.stringify(newConfig));
    
    // Update service config if available
    if (automationService) {
      automationService.updateConfig({ [key]: value });
    }
  };

  const handleToggleAutomation = () => {
    if (!automationService) return;
    
    if (isRunning) {
      automationService.stop();
      setIsRunning(false);
      handleConfigChange('enabled', false);
      
      setResult({
        success: true,
        message: 'Content automation stopped.',
      });
    } else {
      try {
        automationService.start();
        setIsRunning(true);
        handleConfigChange('enabled', true);
        
        setResult({
          success: true,
          message: 'Content automation started.',
        });
      } catch (error) {
        console.error('Failed to start automation:', error);
        setIsRunning(false);
        handleConfigChange('enabled', false);
        
        setResult({
          success: false,
          message: 'Failed to start content automation.',
        });
      }
    }
  };

  const handleRunNow = async () => {
    if (!automationService) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const run = await automationService.runAutomation();
      setCurrentRun(run);
      setRunHistory(automationService.getRunHistory());
      
      setResult({
        success: run.status === 'completed',
        message: run.status === 'completed'
          ? `Automation run completed. Processed ${run.emailsProcessed} emails and extracted ${run.contentExtracted} content items.`
          : `Automation run failed: ${run.errors.join(', ')}`,
      });
    } catch (error) {
      console.error('Error running automation:', error);
      setResult({
        success: false,
        message: 'Error running automation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = () => {
    if (!automationService) return;
    
    setIsRunning(automationService.isRunning());
    setCurrentRun(automationService.getCurrentRun());
    setRunHistory(automationService.getRunHistory());
  };

  if (!gmailConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Automation</CardTitle>
          <CardDescription>Automatically extract content from emails</CardDescription>
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
        <CardTitle>Content Automation</CardTitle>
        <CardDescription>Automatically extract content from emails containing Zoom and FireFlies.ai links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="config" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="history">Run History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Automation Settings</h3>
                <p className="text-sm text-gray-500">Configure how the content extraction automation works</p>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="automationEnabled">Enabled</Label>
                <Switch 
                  id="automationEnabled" 
                  checked={config.enabled}
                  disabled={isLoading || !automationService}
                  onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkInterval">Check Interval (minutes)</Label>
                <Input 
                  id="checkInterval" 
                  type="number"
                  min="5"
                  value={config.checkInterval}
                  onChange={(e) => handleConfigChange('checkInterval', parseInt(e.target.value) || 15)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxEmailsToProcess">Max Emails to Process</Label>
                <Input 
                  id="maxEmailsToProcess" 
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxEmailsToProcess}
                  onChange={(e) => handleConfigChange('maxEmailsToProcess', parseInt(e.target.value) || 10)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="searchQuery">Gmail Search Query</Label>
                <Input 
                  id="searchQuery" 
                  value={config.searchQuery}
                  onChange={(e) => handleConfigChange('searchQuery', e.target.value)}
                  placeholder="is:unread (zoom.us OR fireflies.ai)"
                />
                <p className="text-xs text-gray-500">
                  Use Gmail search syntax to filter emails to process
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="labelProcessedEmails" 
                  checked={config.labelProcessedEmails}
                  onCheckedChange={(checked) => handleConfigChange('labelProcessedEmails', !!checked)}
                />
                <Label htmlFor="labelProcessedEmails">Label Processed Emails</Label>
              </div>
              
              {config.labelProcessedEmails && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="processedLabel">Label Name</Label>
                  <Input 
                    id="processedLabel" 
                    value={config.processedLabel}
                    onChange={(e) => handleConfigChange('processedLabel', e.target.value)}
                    placeholder="Processed-Content"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant={isRunning ? "destructive" : "default"}
                  onClick={handleToggleAutomation}
                  disabled={isLoading || !automationService}
                >
                  {isRunning ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Stop Automation
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Automation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Automation Status</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshStatus}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>Status: {isRunning ? 'Running' : 'Stopped'}</span>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Current Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="font-medium">Check Interval:</dt>
                      <dd>{config.checkInterval} minutes</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Max Emails:</dt>
                      <dd>{config.maxEmailsToProcess}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Search Query:</dt>
                      <dd className="text-right">{config.searchQuery}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Label Emails:</dt>
                      <dd>{config.labelProcessedEmails ? 'Yes' : 'No'}</dd>
                    </div>
                    {config.labelProcessedEmails && (
                      <div className="flex justify-between">
                        <dt className="font-medium">Label Name:</dt>
                        <dd>{config.processedLabel}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
              
              {currentRun && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Current/Last Run</CardTitle>
                    <CardDescription>
                      Started: {new Date(currentRun.startTime).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          currentRun.status === 'completed' ? 'default' :
                          currentRun.status === 'running' ? 'outline' : 'destructive'
                        }>
                          {currentRun.status}
                        </Badge>
                        {currentRun.endTime && (
                          <span className="text-xs text-gray-500">
                            Ended: {new Date(currentRun.endTime).toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="font-medium">Emails Processed:</dt>
                          <dd>{currentRun.emailsProcessed}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Content Extracted:</dt>
                          <dd>{currentRun.contentExtracted}</dd>
                        </div>
                        {currentRun.errors.length > 0 && (
                          <div className="pt-2">
                            <dt className="font-medium">Errors:</dt>
                            <dd className="text-red-500 mt-1">
                              <ul className="list-disc pl-5 space-y-1">
                                {currentRun.errors.slice(0, 3).map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {currentRun.errors.length > 3 && (
                                  <li>...and {currentRun.errors.length - 3} more errors</li>
                                )}
                              </ul>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleRunNow}
                  disabled={isLoading || !automationService}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run Now'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Run History</h3>
            
            {runHistory.length > 0 ? (
              <div className="space-y-4">
                {runHistory.map((run, index) => (
                  <Card key={run.id} className={index === 0 ? 'border-primary' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Run {index === 0 ? '(Latest)' : `#${runHistory.length - index}`}
                        </CardTitle>
                        <Badge variant={
                          run.status === 'completed' ? 'default' :
                          run.status === 'running' ? 'outline' : 'destructive'
                        }>
                          {run.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(run.startTime).toLocaleString()}
                        {run.endTime && ` - ${new Date(run.endTime).toLocaleString()}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="font-medium">Emails Processed:</dt>
                          <dd>{run.emailsProcessed}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Content Extracted:</dt>
                          <dd>{run.contentExtracted}</dd>
                        </div>
                        {run.errors.length > 0 && (
                          <div className="pt-2">
                            <dt className="font-medium">Errors:</dt>
                            <dd className="text-red-500 mt-1">
                              <ul className="list-disc pl-5 space-y-1">
                                {run.errors.slice(0, 2).map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {run.errors.length > 2 && (
                                  <li>...and {run.errors.length - 2} more errors</li>
                                )}
                              </ul>
                            </dd>
                          </div>
                        )}
                      </dl>
                      
                      {run.details.processedEmails.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Processed Emails</h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {run.details.processedEmails.map((email, emailIndex) => (
                              <div key={emailIndex} className="text-xs border rounded-md p-2">
                                <div className="font-medium">{email.subject}</div>
                                <div className="text-gray-500">From: {email.from}</div>
                                {email.processedLinks.length > 0 ? (
                                  <div className="mt-1">
                                    <span className="font-medium">Processed {email.processedLinks.length} links</span>
                                    {email.extractedContent.length > 0 && (
                                      <span className="ml-2">
                                        (Extracted: {email.extractedContent.map(c => c.type).join(', ')})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-1 text-gray-500">No content links found</div>
                                )}
                                {email.error && (
                                  <div className="mt-1 text-red-500">{email.error}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No run history available yet. Start the automation or run it manually to see results here.
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

export default ContentAutomation;
