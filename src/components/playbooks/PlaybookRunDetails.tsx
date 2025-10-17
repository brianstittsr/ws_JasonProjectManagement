import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { PlaybookRun, PlaybookStep } from '../../services/playbookAutomation';
import { ArrowLeft, CheckCircle, ClipboardList, MessageSquare, Bell, Clock, Calendar, Archive, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PlaybookRunDetailsProps {
  run: PlaybookRun;
  onBack: () => void;
  onAddUpdate: (runId: string, stepId: string, content: string) => void;
  onCompleteStep: (runId: string, stepId: string) => void;
  onSkipStep: (runId: string, stepId: string) => void;
  onAddSchedule: (
    runId: string, 
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom',
    days: number[] | undefined,
    time: string,
    timezone: string,
    updatePrompt: string,
    notifyParticipants: boolean
  ) => void;
  onArchive: (runId: string) => void;
}

const PlaybookRunDetails: React.FC<PlaybookRunDetailsProps> = ({ 
  run, 
  onBack,
  onAddUpdate,
  onCompleteStep,
  onSkipStep,
  onAddSchedule,
  onArchive
}) => {
  const [activeTab, setActiveTab] = useState('steps');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [updateContent, setUpdateContent] = useState<Record<string, string>>({});
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'daily' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom',
    days: [1, 3, 5], // Monday, Wednesday, Friday
    time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    updatePrompt: '',
    notifyParticipants: true
  });

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-5 w-5" />;
      case 'checklist':
        return <ClipboardList className="h-5 w-5" />;
      case 'update':
        return <MessageSquare className="h-5 w-5" />;
      case 'notification':
        return <Bell className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy h:mm a');
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

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleUpdateSubmit = (stepId: string) => {
    const content = updateContent[stepId];
    if (content && content.trim()) {
      onAddUpdate(run.id, stepId, content);
      setUpdateContent(prev => ({
        ...prev,
        [stepId]: ''
      }));
    }
  };

  const handleScheduleSubmit = () => {
    onAddSchedule(
      run.id,
      scheduleForm.frequency,
      scheduleForm.frequency === 'weekly' ? scheduleForm.days : undefined,
      scheduleForm.time,
      scheduleForm.timezone,
      scheduleForm.updatePrompt,
      scheduleForm.notifyParticipants
    );
    setShowScheduleDialog(false);
  };

  const isCurrentStep = (index: number) => index === run.currentStepIndex;
  const isStepCompleted = (step: PlaybookStep) => step.status === 'completed' || step.status === 'skipped';
  const isStepAvailable = (index: number) => index <= run.currentStepIndex || isStepCompleted(run.steps[index]);

  const getProgressPercentage = () => {
    const totalSteps = run.steps.length;
    const completedSteps = run.steps.filter(step => 
      step.status === 'completed' || step.status === 'skipped'
    ).length;
    
    return totalSteps > 0 
      ? Math.round((completedSteps / totalSteps) * 100) 
      : 0;
  };

  const getStepUpdates = (stepId: string) => {
    return run.updates.filter(update => update.stepId === stepId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={onBack} className="h-8 w-8 p-0">
            <span className="sr-only">Back</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{run.name}</h2>
        </div>
        {run.status === 'active' && (
          <Button 
            variant="outline" 
            onClick={() => onArchive(run.id)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{run.name}</CardTitle>
              <CardDescription>{run.description}</CardDescription>
            </div>
            <Badge 
              variant={run.status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {run.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Started {formatDate(run.startedAt)} ({formatTimeAgo(run.startedAt)})</span>
            </div>
            {run.completedAt && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Completed {formatDate(run.completedAt)} ({formatTimeAgo(run.completedAt)})</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{run.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length} of {run.steps.length} steps ({getProgressPercentage()}%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="steps" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="schedules">Scheduled Updates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="steps" className="space-y-4 mt-6">
          <div className="space-y-4">
            {run.steps.map((step, index) => {
              const isExpanded = expandedSteps[step.id] || false;
              const stepUpdates = getStepUpdates(step.id);
              const isAvailable = isStepAvailable(index);
              
              return (
                <Card 
                  key={step.id} 
                  className={`transition-colors ${isCurrentStep(index) ? 'border-primary' : ''} ${!isAvailable ? 'opacity-60' : ''}`}
                >
                  <CardHeader className="cursor-pointer" onClick={() => toggleStepExpanded(step.id)}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 text-primary">
                          {getStepIcon(step.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{index + 1}. {step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStepStatusBadge(step.status)}
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <>
                      <CardContent className="space-y-4">
                        {step.type === 'checklist' && step.checklistItems && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Checklist</h4>
                            <div className="space-y-2">
                              {step.checklistItems.map(item => (
                                <div key={item.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={item.id} 
                                    checked={item.checked}
                                    disabled={!isAvailable || step.status === 'completed'}
                                  />
                                  <Label 
                                    htmlFor={item.id}
                                    className={item.checked ? 'line-through text-muted-foreground' : ''}
                                  >
                                    {item.text}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {stepUpdates.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Updates</h4>
                            <div className="space-y-3">
                              {stepUpdates.map(update => (
                                <div key={update.id} className="bg-muted p-3 rounded-md">
                                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>{update.createdBy}</span>
                                    <span>{formatDate(update.createdAt)}</span>
                                  </div>
                                  <div className="text-sm whitespace-pre-wrap">{update.content}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {isAvailable && run.status === 'active' && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Add Update</h4>
                            <Textarea 
                              placeholder="Enter your update..."
                              value={updateContent[step.id] || ''}
                              onChange={(e) => setUpdateContent(prev => ({
                                ...prev,
                                [step.id]: e.target.value
                              }))}
                              rows={3}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateSubmit(step.id)}
                              disabled={!updateContent[step.id]?.trim()}
                            >
                              Add Update
                            </Button>
                          </div>
                        )}
                      </CardContent>
                      
                      {isCurrentStep(index) && run.status === 'active' && (
                        <CardFooter className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => onSkipStep(run.id, step.id)}
                          >
                            Skip Step
                          </Button>
                          <Button 
                            onClick={() => onCompleteStep(run.id, step.id)}
                          >
                            Complete Step
                          </Button>
                        </CardFooter>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="updates" className="space-y-4 mt-6">
          {run.updates.length > 0 ? (
            <div className="space-y-4">
              {run.updates.map(update => {
                const step = run.steps.find(s => s.id === update.stepId);
                
                return (
                  <Card key={update.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base">{update.createdBy}</CardTitle>
                          <CardDescription>{formatDate(update.createdAt)} ({formatTimeAgo(update.createdAt)})</CardDescription>
                        </div>
                        {step && (
                          <Badge variant="outline">{step.title}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap">{update.content}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No updates yet</h3>
              <p className="text-muted-foreground">
                There are no updates for this playbook run yet.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="schedules" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Scheduled Updates</h3>
            {run.status === 'active' && (
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Scheduled Update</DialogTitle>
                    <DialogDescription>
                      Configure when and how often to request updates for this playbook.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select 
                        value={scheduleForm.frequency} 
                        onValueChange={(value: any) => setScheduleForm(prev => ({ ...prev, frequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {scheduleForm.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="flex flex-wrap gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`day-${index}`}
                                checked={scheduleForm.days.includes(index)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setScheduleForm(prev => ({
                                      ...prev,
                                      days: [...prev.days, index].sort()
                                    }));
                                  } else {
                                    setScheduleForm(prev => ({
                                      ...prev,
                                      days: prev.days.filter(d => d !== index)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`day-${index}`}>{day}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input 
                        id="time"
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input 
                        id="timezone"
                        value={scheduleForm.timezone}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, timezone: e.target.value }))}
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="updatePrompt">Update Prompt</Label>
                      <Textarea 
                        id="updatePrompt"
                        value={scheduleForm.updatePrompt}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, updatePrompt: e.target.value }))}
                        placeholder="What would you like to ask for in the update? Use [ARCHON] prefix to retrieve content from Archon."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use [ARCHON] prefix to retrieve content from Archon with the "resbyte" tag.
                        Example: [ARCHON] daily standup questions
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="notifyParticipants"
                        checked={scheduleForm.notifyParticipants}
                        onCheckedChange={(checked) => setScheduleForm(prev => ({ ...prev, notifyParticipants: !!checked }))}
                      />
                      <Label htmlFor="notifyParticipants">Notify participants</Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowScheduleDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleScheduleSubmit}
                      disabled={!scheduleForm.updatePrompt.trim()}
                    >
                      Add Schedule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {run.scheduledUpdates.length > 0 ? (
            <div className="space-y-4">
              {run.scheduledUpdates.map(schedule => (
                <Card key={schedule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base capitalize">{schedule.frequency} Updates</CardTitle>
                      <Badge variant="outline">
                        {schedule.time} {schedule.timezone}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Next update: {formatDate(schedule.nextRun)} ({formatTimeAgo(schedule.nextRun)})
                        </span>
                      </div>
                      
                      {schedule.lastRun && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Last update: {formatDate(schedule.lastRun)} ({formatTimeAgo(schedule.lastRun)})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-1">Update Prompt</h4>
                      <p className="text-sm">{schedule.updatePrompt}</p>
                    </div>
                    
                    {schedule.frequency === 'weekly' && schedule.days && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Days</h4>
                        <div className="flex flex-wrap gap-2">
                          {schedule.days.map(day => (
                            <Badge key={day} variant="outline">
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No scheduled updates</h3>
              <p className="text-muted-foreground">
                There are no scheduled updates for this playbook run.
              </p>
              {run.status === 'active' && (
                <Button 
                  className="mt-4"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlaybookRunDetails;
