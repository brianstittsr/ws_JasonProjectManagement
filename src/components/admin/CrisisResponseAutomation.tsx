import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, Play, Pause, RefreshCw, CheckCircle, AlertCircle, Clock, Send, ListChecks, CheckSquare, XSquare, FileCheck, Bell, BellRing } from 'lucide-react';
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

  const handleToggleAutomation = async () => {
    if (!automationService) return;
    
    try {
      if (isRunning) {
        automationService.stop();
        setIsRunning(false);
        setSuccess('Automation stopped successfully.');
      } else {
        automationService.start();
        setIsRunning(true);
        setSuccess('Automation started successfully.');
      }
      
      // Update config
      setConfig(automationService.getConfig());
    } catch (err) {
      console.error('Error toggling automation:', err);
      setError('Failed to toggle automation.');
    }
  };

  const handleConfigChange = (key: keyof CrisisResponseAutomationConfig, value: any) => {
    if (!automationService) return;
    
    try {
      // Update local state
      setConfig(prev => ({ ...prev, [key]: value }));
      
      // Update service config
      automationService.updateConfig({ [key]: value });
      
      setSuccess('Configuration updated successfully.');
    } catch (err) {
      console.error('Error updating configuration:', err);
      setError('Failed to update configuration.');
    }
  };

  // Task management functions
  const handleCreateTaskFromTemplate = (templateId: string) => {
    if (!taskTemplateService) return;
    
    try {
      const newTask = taskTemplateService.createTaskFromTemplate(templateId);
      if (newTask) {
        setTasks(taskTemplateService.getTasks());
        setSelectedTask(newTask);
        setSuccess('Task created successfully from template.');
      } else {
        setError('Failed to create task from template.');
      }
    } catch (err) {
      console.error('Error creating task from template:', err);
      setError('Failed to create task from template.');
    }
  };
  
  const handleUpdateTaskStatus = (taskId: string, status: TaskInstance['status']) => {
    if (!taskTemplateService) return;
    
    try {
      const updatedTask = taskTemplateService.updateTaskStatus(taskId, status);
      if (updatedTask) {
        setTasks(taskTemplateService.getTasks());
        setSelectedTask(updatedTask);
        setSuccess(`Task status updated to ${status}.`);
      } else {
        setError('Failed to update task status.');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status.');
    }
  };
  
  const handleUpdateChecklistItem = (taskId: string, itemId: string, completed: boolean) => {
    if (!taskTemplateService) return;
    
    try {
      const updatedTask = taskTemplateService.updateChecklistItem(taskId, itemId, completed);
      if (updatedTask) {
        setTasks(taskTemplateService.getTasks());
        setSelectedTask(updatedTask);
      } else {
        setError('Failed to update checklist item.');
      }
    } catch (err) {
      console.error('Error updating checklist item:', err);
      setError('Failed to update checklist item.');
    }
  };
  
  const handleUpdateFollowUpAction = (taskId: string, actionId: string, completed: boolean) => {
    if (!taskTemplateService) return;
    
    try {
      const updatedTask = taskTemplateService.updateFollowUpAction(taskId, actionId, completed);
      if (updatedTask) {
        setTasks(taskTemplateService.getTasks());
        setSelectedTask(updatedTask);
        setPendingFollowUps(taskTemplateService.getPendingFollowUps());
      } else {
        setError('Failed to update follow-up action.');
      }
    } catch (err) {
      console.error('Error updating follow-up action:', err);
      setError('Failed to update follow-up action.');
    }
  };
  
  const handleAddTaskNote = (taskId: string, note: string) => {
    if (!taskTemplateService || !note.trim()) return;
    
    try {
      const updatedTask = taskTemplateService.addTaskNote(taskId, note);
      if (updatedTask) {
        setTasks(taskTemplateService.getTasks());
        setSelectedTask(updatedTask);
        setSuccess('Note added successfully.');
      } else {
        setError('Failed to add note.');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note.');
    }
  };
  
  const handleAssignTask = (taskId: string, assigneeId: string) => {
    if (!taskTemplateService) return;
    
    try {
      const assignee = assignees.find(a => a.id === assigneeId);
      if (!assignee) {
        setError('Invalid assignee selected.');
        return;
      }
      
      const updatedTask = taskTemplateService.updateTask(taskId, { assignedTo: assigneeId });
      if (updatedTask) {
        setTasks(taskTemplateService.getTasks());
        setSelectedTask(updatedTask);
        setSuccess(`Task assigned to ${assignee.name}.`);
      } else {
        setError('Failed to assign task.');
      }
    } catch (err) {
      console.error('Error assigning task:', err);
      setError('Failed to assign task.');
    }
  };
  
  const handleManualRun = async () => {
    if (!automationService || !taskTemplateService) return;
    
    setManualRunning(true);
    setError(null);
    setSuccess(null);
    
    try {
      const run = await automationService.checkForNewMessages();
      
      if (run) {
        // Update runs list
        setRuns(automationService.getRuns());
        
        if (run.status === 'completed') {
          // Create tasks from the estimates
          if (run.tasksGenerated > 0 && taskEstimates.length > 0) {
            for (const estimate of taskEstimates) {
              taskTemplateService.createTaskFromMessage(estimate);
            }
            
            // Update tasks list
            setTasks(taskTemplateService.getTasks());
          }
          
          setSuccess(`Manual run completed successfully. Processed ${run.messagesProcessed} messages and generated ${run.tasksGenerated} tasks.`);
        } else {
          setError(`Manual run failed: ${run.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error running manual check:', err);
      setError('Failed to run manual check.');
    } finally {
      setManualRunning(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!automationService || taskEstimates.length === 0) return;
    
    setSendingEmail(true);
    setError(null);
    setSuccess(null);
    
    try {
      const sent = await automationService.sendTaskEstimatesEmail(taskEstimates);
      
      if (sent) {
        setSuccess('Test email sent successfully.');
      } else {
        setError('Failed to send test email.');
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Failed to send test email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const simulateMessages = async () => {
    if (!automationService) return;
    
    // Simulate WhatsApp messages
    const messages: WhatsAppMessage[] = [
      {
        id: 'wamid.123456789',
        from: '15551234567',
        timestamp: new Date().toISOString(),
        text: {
          body: "We need immediate assistance with a server outage affecting our main production environment. All services are down and customers can't access their accounts. Need emergency response team to investigate and resolve ASAP."
        },
        type: 'text'
      },
      {
        id: 'wamid.987654321',
        from: '15559876543',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
        text: {
          body: "Security breach detected in our authentication system. Multiple failed login attempts and suspicious activities observed. Need security experts to analyze logs and implement countermeasures."
        },
        type: 'text'
      },
      {
        id: 'wamid.456789123',
        from: '15555555555',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
        text: {
          body: "Database performance has degraded significantly. Queries taking 10x longer than usual. Need database optimization expert to identify bottlenecks and implement fixes before end of day."
        },
        type: 'text'
      }
    ];
    
    // Process each message
    const estimates: TaskEstimate[] = [];
    
    for (const message of messages) {
      const estimate = await automationService.processMessage(message);
      if (estimate) {
        estimates.push(estimate);
      }
    }
    
    setTaskEstimates(estimates);
    setActiveTab('test');
    setSuccess('Generated test task estimates from simulated messages.');
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crisis Response Automation</CardTitle>
        <CardDescription>
          Automatically process WhatsApp messages, create tasks, and track completion with validation checkpoints.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
                  onClick={handleToggleAutomation}
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
                <Button 
                  variant="outline" 
                  onClick={handleManualRun}
                  disabled={manualRunning}
                >
                  {manualRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Now
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {pendingFollowUps.length > 0 && (
              <Alert className="bg-amber-50 border-amber-200 mb-4">
                <BellRing className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-600">Pending Follow-ups</AlertTitle>
                <AlertDescription className="text-amber-700">
                  You have {pendingFollowUps.length} pending follow-up {pendingFollowUps.length === 1 ? 'action' : 'actions'} that require attention.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Crisis Response Tasks</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('templates')}
                      disabled={templates.length === 0}
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      Create from Template
                    </Button>
                  </div>
                </div>
                
                {tasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 border rounded-md p-4 h-[600px] overflow-y-auto">
                      <h4 className="font-medium mb-4">Task List</h4>
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <div 
                            key={task.id} 
                            className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedTask?.id === task.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{task.title}</h5>
                                <p className="text-sm text-muted-foreground truncate">
                                  {task.description.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
                                </p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${task.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-green-50 text-green-700 border-green-200'}
                                `}
                              >
                                {task.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{taskTemplateService?.getTaskProgress(task.id) || 0}%</span>
                              </div>
                              <Progress value={taskTemplateService?.getTaskProgress(task.id) || 0} className="h-2" />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    task.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                    task.status === 'cancelled' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'}
                                `}
                              >
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(task.totalCost)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 border rounded-md p-4 h-[600px] overflow-y-auto">
                      {selectedTask ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xl font-medium">{selectedTask.title}</h4>
                              <p className="text-muted-foreground">{selectedTask.description}</p>
                            </div>
                            <div className="flex space-x-2">
                              {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'completed')}
                                  disabled={!taskTemplateService?.getTaskValidation(selectedTask.id).isValid}
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                >
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </Button>
                              )}
                              {selectedTask.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'in_progress')}
                                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Task
                                </Button>
                              )}
                              {selectedTask.status !== 'cancelled' && selectedTask.status !== 'completed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'cancelled')}
                                  className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
                                >
                                  <XSquare className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 bg-muted/30 p-3 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Priority</p>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${selectedTask.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    selectedTask.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    selectedTask.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-green-50 text-green-700 border-green-200'}
                                `}
                              >
                                {selectedTask.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${selectedTask.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    selectedTask.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    selectedTask.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                    selectedTask.status === 'cancelled' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'}
                                `}
                              >
                                {selectedTask.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Assignee</p>
                              <div className="flex items-center">
                                {selectedTask.assignedTo ? (
                                  <span>{assignees.find(a => a.id === selectedTask.assignedTo)?.name || 'Unknown'}</span>
                                ) : (
                                  <Select onValueChange={(value) => handleAssignTask(selectedTask.id, value)}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {assignees.map(assignee => (
                                        <SelectItem key={assignee.id} value={assignee.id}>
                                          {assignee.name} ({assignee.role})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Checklist</h5>
                            <div className="space-y-2 border rounded-md p-3">
                              {selectedTask.checklistItems.map(item => (
                                <div key={item.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`checklist-${item.id}`} 
                                    checked={item.completed} 
                                    onCheckedChange={(checked) => handleUpdateChecklistItem(selectedTask.id, item.id, !!checked)}
                                    disabled={selectedTask.status === 'completed' || selectedTask.status === 'cancelled'}
                                  />
                                  <label 
                                    htmlFor={`checklist-${item.id}`}
                                    className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''} ${item.required ? 'font-medium' : ''}`}
                                  >
                                    {item.text} {item.required && <span className="text-red-500">*</span>}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Follow-up Actions</h5>
                            <div className="space-y-2 border rounded-md p-3">
                              {selectedTask.followUpActions.map(action => (
                                <div key={action.id} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`followup-${action.id}`} 
                                      checked={action.completed} 
                                      onCheckedChange={(checked) => handleUpdateFollowUpAction(selectedTask.id, action.id, !!checked)}
                                    />
                                    <label 
                                      htmlFor={`followup-${action.id}`}
                                      className={`text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}
                                    >
                                      {action.text}
                                    </label>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Due: {formatDateTime(action.dueDate)}
                                    {new Date(action.dueDate) < new Date() && !action.completed && (
                                      <span className="ml-2 text-red-500">(Overdue)</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Details</h5>
                            <div className="grid grid-cols-3 gap-4 border rounded-md p-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Estimated Hours</p>
                                <p>{selectedTask.estimatedHours}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Hourly Rate</p>
                                <p>{formatCurrency(selectedTask.hourlyRate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Cost</p>
                                <p>{formatCurrency(selectedTask.totalCost)}</p>
                              </div>
                            </div>
                          </div>
                          
                          {selectedTask.notes && (
                            <div className="space-y-2">
                              <h5 className="font-medium">Notes</h5>
                              <div className="border rounded-md p-3 whitespace-pre-line text-sm">
                                {selectedTask.notes}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2 pt-4 border-t">
                            <h5 className="font-medium">Add Note</h5>
                            <div className="flex space-x-2">
                              <Input 
                                id="note"
                                placeholder="Add a note about this task..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value) {
                                    handleAddTaskNote(selectedTask.id, e.currentTarget.value);
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  const noteInput = document.getElementById('note') as HTMLInputElement;
                                  if (noteInput && noteInput.value) {
                                    handleAddTaskNote(selectedTask.id, noteInput.value);
                                    noteInput.value = '';
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium mb-2">No Task Selected</h4>
                          <p className="text-muted-foreground mb-4">
                            Select a task from the list to view details and manage its progress.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Tasks Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Run the automation to process WhatsApp messages and generate tasks,<br />
                      or create tasks from templates.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={handleManualRun} disabled={manualRunning}>
                        {manualRunning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Run Automation
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('templates')}
                        disabled={templates.length === 0}
                      >
                        <ListChecks className="h-4 w-4 mr-2" />
                        Use Templates
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkInterval">Check Interval (minutes)</Label>
                      <Input 
                        id="checkInterval"
                        type="number"
                        min="1"
                        value={config.checkInterval}
                        onChange={(e) => handleConfigChange('checkInterval', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappChannel">WhatsApp Channel</Label>
                      <Input 
                        id="whatsappChannel"
                        value={config.whatsappChannel}
                        onChange={(e) => handleConfigChange('whatsappChannel', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isProduction"
                      checked={config.isProduction}
                      onCheckedChange={(checked) => handleConfigChange('isProduction', checked)}
                    />
                    <Label htmlFor="isProduction">Production Mode</Label>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Email Recipients</h4>
                    <p className="text-sm">
                      {config.isProduction ? (
                        <>
                          In production mode, emails will be sent to: <strong>jason@resbyte.ai</strong> and <strong>pt@resbyte.ai</strong>
                        </>
                      ) : (
                        <>
                          In test mode, emails will be sent to: <strong>brian@resbyte.ai</strong>
                        </>
                      )}
                    </p>
                  </div>
                  
                  {config.lastChecked && (
                    <div className="text-sm text-muted-foreground">
                      Last checked: {formatDateTime(config.lastChecked)} ({formatTimeAgo(config.lastChecked)})
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Task Templates</h3>
                </div>
                
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 border rounded-md p-4 h-[600px] overflow-y-auto">
                      <h4 className="font-medium mb-4">Available Templates</h4>
                      <div className="space-y-2">
                        {templates.map(template => (
                          <div 
                            key={template.id} 
                            className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{template.name}</h5>
                                <p className="text-sm text-muted-foreground truncate">
                                  {template.description.length > 60 ? `${template.description.substring(0, 60)}...` : template.description}
                                </p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${template.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    template.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    template.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-green-50 text-green-700 border-green-200'}
                                `}
                              >
                                {template.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {template.category.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(template.estimatedHours * template.hourlyRate)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 border rounded-md p-4 h-[600px] overflow-y-auto">
                      {selectedTemplate ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xl font-medium">{selectedTemplate.name}</h4>
                              <p className="text-muted-foreground">{selectedTemplate.description}</p>
                            </div>
                            <Button 
                              onClick={() => handleCreateTaskFromTemplate(selectedTemplate.id)}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                            >
                              <ListChecks className="h-4 w-4 mr-2" />
                              Create Task
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 bg-muted/30 p-3 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Category</p>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {selectedTemplate.category.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Priority</p>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${selectedTemplate.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    selectedTemplate.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    selectedTemplate.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-green-50 text-green-700 border-green-200'}
                                `}
                              >
                                {selectedTemplate.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Required Skills</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedTemplate.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Checklist Items</h5>
                            <div className="space-y-2 border rounded-md p-3">
                              {selectedTemplate.checklistItems.map(item => (
                                <div key={item.id} className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border rounded-sm" />
                                  <span className={`text-sm ${item.required ? 'font-medium' : ''}`}>
                                    {item.text} {item.required && <span className="text-red-500">*</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Follow-up Actions</h5>
                            <div className="space-y-2 border rounded-md p-3">
                              {selectedTemplate.followUpActions.map(action => (
                                <div key={action.id} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border rounded-sm" />
                                    <span className="text-sm">{action.text}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Due: {action.daysAfter} {action.daysAfter === 1 ? 'day' : 'days'} after completion
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Details</h5>
                            <div className="grid grid-cols-3 gap-4 border rounded-md p-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Estimated Hours</p>
                                <p>{selectedTemplate.estimatedHours}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Hourly Rate</p>
                                <p>{formatCurrency(selectedTemplate.hourlyRate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Cost</p>
                                <p>{formatCurrency(selectedTemplate.estimatedHours * selectedTemplate.hourlyRate)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <ListChecks className="h-16 w-16 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium mb-2">No Template Selected</h4>
                          <p className="text-muted-foreground mb-4">
                            Select a template from the list to view details and create tasks.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                    <p className="text-muted-foreground mb-4">
                      There are no task templates available.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="followups" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Pending Follow-ups</h3>
                </div>
                
                {pendingFollowUps.length > 0 ? (
                  <div className="space-y-4">
                    {pendingFollowUps.map(({ task, action }) => (
                      <div 
                        key={`${task.id}-${action.id}`} 
                        className="p-4 border rounded-md bg-amber-50 border-amber-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{action.text}</h4>
                            <p className="text-sm text-muted-foreground">
                              For task: {task.title}
                            </p>
                            <p className="text-sm text-red-600">
                              Due: {formatDateTime(action.dueDate)} ({formatTimeAgo(action.dueDate)})
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateFollowUpAction(task.id, action.id, true)}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            >
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTask(task)}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                            >
                              View Task
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Follow-ups</h3>
                    <p className="text-muted-foreground mb-4">
                      There are no pending follow-up actions at this time.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4 mt-4">
                {runs.length > 0 ? (
                  <div className="space-y-4">
                    {runs.slice().reverse().map((run) => (
                      <div 
                        key={run.id} 
                        className={`p-4 rounded-md border ${
                          run.status === 'completed' ? 'bg-green-50 border-green-200' : 
                          run.status === 'failed' ? 'bg-red-50 border-red-200' : 
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              Run {run.id.split('-')[1]}
                              {run.status === 'running' && (
                                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700">Running</Badge>
                              )}
                              {run.status === 'completed' && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700">Completed</Badge>
                              )}
                              {run.status === 'failed' && (
                                <Badge variant="outline" className="ml-2 bg-red-100 text-red-700">Failed</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Started: {formatDateTime(run.startTime)} ({formatTimeAgo(run.startTime)})
                            </p>
                            {run.endTime && (
                              <p className="text-sm text-muted-foreground">
                                Ended: {formatDateTime(run.endTime)} ({formatTimeAgo(run.endTime)})
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="font-medium">Messages:</span> {run.messagesProcessed}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Tasks:</span> {run.tasksGenerated}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Email:</span> {run.emailSent ? 'Sent' : 'Not sent'}
                            </p>
                          </div>
                        </div>
                        
                        {run.error && (
                          <div className="mt-2 text-sm text-red-600">
                            <span className="font-medium">Error:</span> {run.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Run History</h3>
                    <p className="text-muted-foreground mb-4">
                      The automation hasn't been run yet.
                    </p>
                    <Button onClick={handleManualRun} disabled={manualRunning}>
                      {manualRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="test" className="space-y-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Test Task Estimates</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={simulateMessages}
                    >
                      Generate Test Data
                    </Button>
                    <Button 
                      onClick={handleSendTestEmail}
                      disabled={taskEstimates.length === 0 || sendingEmail}
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Test Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {taskEstimates.length > 0 ? (
                  <div className="space-y-4">
                    {taskEstimates.map((task) => (
                      <Card key={task.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{task.title}</CardTitle>
                            <Badge 
                              variant="outline" 
                              className={`
                                ${task.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                  task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-green-50 text-green-700 border-green-200'}
                              `}
                            >
                              {task.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm">{task.description}</p>
                          
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-sm font-medium">Estimated Hours</p>
                              <p>{task.estimatedHours}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Hourly Rate</p>
                              <p>{formatCurrency(task.hourlyRate)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total Cost</p>
                              <p>{formatCurrency(task.totalCost)}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-1">Required Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {task.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Test Data</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate test data to see how task estimates will look.
                    </p>
                    <Button onClick={simulateMessages}>
                      Generate Test Data
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CrisisResponseAutomation;
