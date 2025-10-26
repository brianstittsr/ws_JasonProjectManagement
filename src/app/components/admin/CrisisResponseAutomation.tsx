import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, Play, Pause, RefreshCw, CheckCircle, AlertCircle, Clock, Send, ListChecks, CheckSquare, XSquare, FileCheck, BellRing } from 'lucide-react';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import { 
  CrisisResponseAutomation as CrisisResponseAutomationService, 
  AutomationRun, 
  CrisisResponseAutomationConfig,
  createCrisisResponseAutomation 
} from '../../services/crisisResponseAutomation';
import { WhatsAppMessage } from '../../services/whatsappIntegration';
import { TaskEstimate } from '../../services/crisisResponseAnalyzer';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

// Import the task template service
import { CrisisTaskTemplateService, TaskTemplate, TaskInstance, createCrisisTaskTemplateService } from '../../services/crisisTaskTemplates';

interface TaskAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DEFAULT_ASSIGNEES: TaskAssignee[] = [
  { id: 'assignee-1', name: 'John Smith', email: 'john@resbyte.ai', role: 'DevOps Engineer' },
  { id: 'assignee-2', name: 'Sarah Johnson', email: 'sarah@resbyte.ai', role: 'Security Specialist' },
  { id: 'assignee-3', name: 'Michael Chen', email: 'michael@resbyte.ai', role: 'Database Administrator' },
  { id: 'assignee-4', name: 'Emily Rodriguez', email: 'emily@resbyte.ai', role: 'Software Developer' },
  { id: 'assignee-5', name: 'David Kim', email: 'david@resbyte.ai', role: 'Network Engineer' },
];

const CrisisResponseAutomation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [automationService, setAutomationService] = useState<CrisisResponseAutomationService | null>(null);
  const [taskTemplateService, setTaskTemplateService] = useState<CrisisTaskTemplateService | null>(null);
  const [config, setConfig] = useState<CrisisResponseAutomationConfig>({
    enabled: false,
    checkInterval: 5,
    whatsappChannel: 'Resbyte Crisis Response',
    isProduction: false,
  });
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualRunning, setManualRunning] = useState(false);
  const [taskEstimates, setTaskEstimates] = useState<TaskEstimate[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [assignees] = useState<TaskAssignee[]>(DEFAULT_ASSIGNEES);
  const [pendingFollowUps, setPendingFollowUps] = useState<{ task: TaskInstance; action: TaskInstance['followUpActions'][0] }[]>([]);

  useEffect(() => {
    const initServices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create automation service
        const automationSvc = createCrisisResponseAutomation();
        setAutomationService(automationSvc);
        
        // Create task template service
        const templateSvc = createCrisisTaskTemplateService();
        setTaskTemplateService(templateSvc);
        
        if (automationSvc) {
          // Get configuration and runs
          const serviceConfig = automationSvc.getConfig();
          const serviceRuns = automationSvc.getRuns();
          
          setConfig(serviceConfig);
          setRuns(serviceRuns);
          setIsRunning(serviceConfig.enabled);
        } else {
          setError('Failed to initialize crisis response automation service.');
        }
        
        if (templateSvc) {
          // Get templates and tasks
          const taskTemplates = templateSvc.getTemplates();
          const taskInstances = templateSvc.getTasks();
          const followUps = templateSvc.getPendingFollowUps();
          
          setTemplates(taskTemplates);
          setTasks(taskInstances);
          setPendingFollowUps(followUps);
        } else {
          setError('Failed to initialize crisis task template service.');
        }
      } catch (err) {
        console.error('Error initializing services:', err);
        setError('An error occurred while initializing the services.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initServices();
  }, []);

  // Simplified component for demo purposes
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crisis Response Automation</CardTitle>
        <CardDescription>
          Automatically process WhatsApp messages, create tasks, and track completion with validation checkpoints.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Automation Status</h3>
                <p className="text-sm text-muted-foreground">
                  {isRunning ? 'Running' : 'Stopped'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={isRunning ? "destructive" : "default"}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks">
                <p>Tasks content would go here</p>
              </TabsContent>
              
              <TabsContent value="templates">
                <p>Templates content would go here</p>
              </TabsContent>
              
              <TabsContent value="followups">
                <p>Follow-ups content would go here</p>
              </TabsContent>
              
              <TabsContent value="history">
                <p>History content would go here</p>
              </TabsContent>
              
              <TabsContent value="config">
                <p>Config content would go here</p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Export the component as default
export default CrisisResponseAutomation;
