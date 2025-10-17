import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, Plus, Play, Pause, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { JiraConfig } from '../../services/jira';
import { 
  ReportSchedulerService, 
  ScheduledReportConfig,
  ReportRunResult,
  ReportScheduleConfig,
  ReportDeliveryConfig
} from '../../services/reportScheduler';
import { EmailRecipient } from '../../services/emailDelivery';
import ReportRecipients from './ReportRecipients';
import ReportScheduleForm from './ReportScheduleForm';
import ReportConfigForm from './ReportConfigForm';

interface ReportAutomationProps {
  jiraConfig: JiraConfig | null;
}

const ReportAutomation: React.FC<ReportAutomationProps> = ({ jiraConfig }) => {
  const [activeTab, setActiveTab] = useState('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [reportScheduler, setReportScheduler] = useState<ReportSchedulerService | null>(null);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportConfig[]>([]);
  const [runHistory, setRunHistory] = useState<ReportRunResult[]>([]);
  const [selectedReport, setSelectedReport] = useState<ScheduledReportConfig | null>(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [newReportData, setNewReportData] = useState<{
    name: string;
    description: string;
    recipients: EmailRecipient[];
    ccRecipients: EmailRecipient[];
    scheduleConfig: ReportScheduleConfig;
  }>({
    name: 'Daily CEO Report',
    description: 'Daily summary of project status and tasks',
    recipients: [],
    ccRecipients: [],
    scheduleConfig: {
      enabled: true,
      frequency: 'daily',
      time: '08:00',
      days: ['1', '2', '3', '4', '5'],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const initService = async () => {
      if (jiraConfig) {
        try {
          setIsLoading(true);
          
          // Create report scheduler service
          const { createReportSchedulerService } = await import('../../services/reportScheduler');
          const scheduler = await createReportSchedulerService(jiraConfig);
          
          if (scheduler) {
            setReportScheduler(scheduler);
            setScheduledReports(scheduler.getScheduledReports());
            setRunHistory(scheduler.getRunHistory());
            
            setResult({
              success: true,
              message: 'Report automation service initialized successfully.',
            });
          } else {
            setResult({
              success: false,
              message: 'Failed to initialize report automation service.',
            });
          }
        } catch (error) {
          console.error('Error initializing report automation service:', error);
          setResult({
            success: false,
            message: 'Error initializing report automation service.',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    initService();
  }, [jiraConfig]);

  const handleRefreshReports = () => {
    if (!reportScheduler) return;
    
    setScheduledReports(reportScheduler.getScheduledReports());
    setRunHistory(reportScheduler.getRunHistory());
  };

  const handleToggleReport = (report: ScheduledReportConfig) => {
    if (!reportScheduler) return;
    
    const updatedReport = reportScheduler.updateScheduledReport(
      report.id, 
      { enabled: !report.enabled }
    );
    
    if (updatedReport) {
      setScheduledReports(reportScheduler.getScheduledReports());
      
      setResult({
        success: true,
        message: `Report ${updatedReport.name} ${updatedReport.enabled ? 'enabled' : 'disabled'}.`,
      });
    }
  };

  const handleRunNow = async (report: ScheduledReportConfig) => {
    if (!reportScheduler) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const runResult = await reportScheduler.runReport(report);
      setRunHistory(reportScheduler.getRunHistory());
      setScheduledReports(reportScheduler.getScheduledReports());
      
      setResult({
        success: runResult.delivery.success,
        message: runResult.delivery.success
          ? `Report ${report.name} generated and sent successfully.`
          : `Failed to generate or send report: ${runResult.delivery.error}`,
      });
    } catch (error) {
      console.error('Error running report:', error);
      setResult({
        success: false,
        message: 'Error running report.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReport = (report: ScheduledReportConfig) => {
    if (!reportScheduler) return;
    
    const success = reportScheduler.deleteScheduledReport(report.id);
    
    if (success) {
      setScheduledReports(reportScheduler.getScheduledReports());
      
      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }
      
      setResult({
        success: true,
        message: `Report ${report.name} deleted.`,
      });
    }
  };

  const handleCreateReport = () => {
    if (!reportScheduler) return;
    
    const deliveryConfig: ReportDeliveryConfig = {
      recipients: newReportData.recipients,
      ccRecipients: newReportData.ccRecipients,
      includeHtml: true,
      includeText: true,
    };
    
    // Find CEO and PM recipients
    const ceoRecipient = newReportData.recipients.find(r => r.role === 'CEO');
    const pmRecipient = newReportData.recipients.find(r => r.role === 'Project Manager') || 
                        newReportData.ccRecipients.find(r => r.role === 'Project Manager');
    
    if (ceoRecipient && pmRecipient) {
      const newReport = reportScheduler.createDefaultCEOReport(
        ceoRecipient.email,
        ceoRecipient.name,
        pmRecipient.email,
        pmRecipient.name
      );
      
      setScheduledReports(reportScheduler.getScheduledReports());
      setIsCreatingReport(false);
      setNewReportData({
        name: 'Daily CEO Report',
        description: 'Daily summary of project status and tasks',
        recipients: [],
        ccRecipients: [],
        scheduleConfig: {
          enabled: true,
          frequency: 'daily',
          time: '08:00',
          days: ['1', '2', '3', '4', '5'],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      
      setResult({
        success: true,
        message: `Report ${newReport.name} created.`,
      });
    } else {
      setResult({
        success: false,
        message: 'Please specify at least one CEO recipient and one Project Manager recipient.',
      });
    }
  };

  if (!jiraConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Automation</CardTitle>
          <CardDescription>Automate CEO reports from Jira tasks</CardDescription>
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
        <CardTitle>Report Automation</CardTitle>
        <CardDescription>Automate CEO reports from Jira tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reports">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="create">Create Report</TabsTrigger>
            <TabsTrigger value="history">Run History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Scheduled Reports</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshReports}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {scheduledReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No scheduled reports found. Create a new report to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledReports.map(report => (
                  <Card key={report.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{report.name}</CardTitle>
                          <CardDescription>{report.description}</CardDescription>
                        </div>
                        <Badge variant={report.enabled ? 'default' : 'outline'}>
                          {report.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Schedule:</span> {report.scheduleConfig.frequency}
                            {report.scheduleConfig.frequency === 'daily' && ' (Daily)'}
                            {report.scheduleConfig.frequency === 'weekly' && 
                              ` (${report.scheduleConfig.days.map(d => 
                                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(d)]
                              ).join(', ')})`
                            }
                            {report.scheduleConfig.frequency === 'monthly' && 
                              ` (Day ${report.scheduleConfig.days.join(', ')})`
                            }
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {report.scheduleConfig.time}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Recipients:</span> {report.deliveryConfig.recipients.length} primary, 
                          {report.deliveryConfig.ccRecipients?.length || 0} CC
                        </div>
                        
                        {report.lastRun && (
                          <div className="text-sm">
                            <span className="font-medium">Last Run:</span> {new Date(report.lastRun.timestamp).toLocaleString()}
                            <span className={`ml-2 ${report.lastRun.success ? 'text-green-500' : 'text-red-500'}`}>
                              {report.lastRun.success ? 'Successful' : 'Failed'}
                            </span>
                            {report.lastRun.error && (
                              <div className="text-red-500 mt-1">{report.lastRun.error}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button 
                        variant={report.enabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleReport(report)}
                      >
                        {report.enabled ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunNow(report)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Run Now'
                        )}
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReport(report)}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Create CEO Report</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input 
                  id="reportName"
                  value={newReportData.name}
                  onChange={(e) => setNewReportData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportDescription">Description</Label>
                <Input 
                  id="reportDescription"
                  value={newReportData.description}
                  onChange={(e) => setNewReportData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Schedule</Label>
                <ReportScheduleForm 
                  scheduleConfig={newReportData.scheduleConfig}
                  onScheduleChange={(config) => setNewReportData(prev => ({ ...prev, scheduleConfig: config }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Primary Recipients (CEO)</Label>
                <ReportRecipients 
                  recipients={newReportData.recipients}
                  onRecipientsChange={(recipients) => setNewReportData(prev => ({ ...prev, recipients }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>CC Recipients (Project Manager)</Label>
                <ReportRecipients 
                  recipients={newReportData.ccRecipients}
                  onRecipientsChange={(recipients) => setNewReportData(prev => ({ ...prev, ccRecipients: recipients }))}
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleCreateReport}
                  disabled={isLoading || !reportScheduler}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create CEO Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Run History</h3>
            
            {runHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No run history available yet. Run a report to see results here.
              </div>
            ) : (
              <div className="space-y-4">
                {runHistory.map(run => {
                  const report = scheduledReports.find(r => r.id === run.scheduledReportId);
                  
                  return (
                    <Card key={run.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{report?.name || 'Unknown Report'}</CardTitle>
                            <CardDescription>
                              {new Date(run.timestamp).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Badge variant={run.delivery.success ? 'default' : 'destructive'}>
                            {run.delivery.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Recipients:</span> {run.delivery.recipients.join(', ')}
                          </div>
                          
                          {run.delivery.error && (
                            <div className="text-red-500">
                              <span className="font-medium">Error:</span> {run.delivery.error}
                            </div>
                          )}
                          
                          {run.report.sections && (
                            <div>
                              <span className="font-medium">Sections:</span> {run.report.sections.length}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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

export default ReportAutomation;
