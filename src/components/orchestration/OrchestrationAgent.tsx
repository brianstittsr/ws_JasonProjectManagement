import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  MessageSquare, 
  Send, 
  CheckSquare, 
  FileText, 
  PlusCircle, 
  Sparkles, 
  AlertCircle,
  Clock,
  ArrowRight,
  X,
  Save,
  User
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'review' | 'done';
  source: string;
  sourceChat: string;
  timestamp: string;
}

interface SowItem {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  assignee: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed';
  source: string;
  sourceChat: string;
  timestamp: string;
}

interface OrchestrationAgentProps {
  tasks: Task[];
  sowItems: SowItem[];
  onAddTask?: (task: Omit<Task, 'id'>) => void;
  onAddSowItem?: (item: Omit<SowItem, 'id'>) => void;
}

const OrchestrationAgent: React.FC<OrchestrationAgentProps> = ({
  tasks,
  sowItems,
  onAddTask,
  onAddSowItem
}) => {
  const [activeTab, setActiveTab] = useState('detected');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddSow, setShowAddSow] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    status: 'pending',
    source: '',
    sourceChat: '',
    timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString()
  });
  const [newSowItem, setNewSowItem] = useState<Omit<SowItem, 'id'>>({
    title: '',
    description: '',
    estimatedHours: 0,
    assignee: '',
    status: 'pending',
    source: '',
    sourceChat: '',
    timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString()
  });

  const handleAddTask = () => {
    if (onAddTask && newTask.title) {
      onAddTask(newTask);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        status: 'pending',
        source: '',
        sourceChat: '',
        timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString()
      });
      setShowAddTask(false);
    }
  };

  const handleAddSowItem = () => {
    if (onAddSowItem && newSowItem.title) {
      onAddSowItem(newSowItem);
      setNewSowItem({
        title: '',
        description: '',
        estimatedHours: 0,
        assignee: '',
        status: 'pending',
        source: '',
        sourceChat: '',
        timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString()
      });
      setShowAddSow(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Orchestration Agent</CardTitle>
        <CardDescription>
          Automatically detects tasks and SOW items from conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="detected" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="detected">Detected Items</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detected" className="h-full">
            <div className="space-y-4">
              {showAddTask ? (
                <div className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Add New Task</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAddTask(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="task-title">Title</Label>
                      <Input 
                        id="task-title" 
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        placeholder="Task title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea 
                        id="task-description" 
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="Task description"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="task-priority">Priority</Label>
                        <select 
                          id="task-priority"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                          value={newTask.priority}
                          onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'high' | 'medium' | 'low'})}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="task-assignee">Assignee</Label>
                        <select 
                          id="task-assignee"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                          value={newTask.assignee}
                          onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        >
                          <option value="">Select assignee</option>
                          <option value="Puneet Talwar">Puneet Talwar</option>
                          <option value="Jason Mosby">Jason Mosby</option>
                          <option value="Data Science Team">Data Science Team</option>
                          <option value="Brian Stitt">Brian Stitt</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="task-due-date">Due Date</Label>
                      <Input 
                        id="task-due-date" 
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="task-source">Source</Label>
                      <Input 
                        id="task-source" 
                        value={newTask.source}
                        onChange={(e) => setNewTask({...newTask, source: e.target.value})}
                        placeholder="Where did this task come from?"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mr-2"
                        onClick={() => setShowAddTask(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleAddTask}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Task
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center">
                      <CheckSquare className="h-4 w-4 mr-1" /> 
                      Tasks
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7"
                      onClick={() => setShowAddTask(true)}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" /> New
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {tasks.map(task => (
                      <div key={task.id} className="border rounded-md p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : 'outline'}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mb-2">{task.description}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {task.dueDate}
                          </span>
                          <span>{task.assignee}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                          <p>From: {task.source}</p>
                          <p className="italic">"{task.sourceChat.substring(0, 60)}..."</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {showAddSow ? (
                <div className="border rounded-md p-3 mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Add New SOW Item</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAddSow(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="sow-title">Title</Label>
                      <Input 
                        id="sow-title" 
                        value={newSowItem.title}
                        onChange={(e) => setNewSowItem({...newSowItem, title: e.target.value})}
                        placeholder="SOW item title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sow-description">Description</Label>
                      <Textarea 
                        id="sow-description" 
                        value={newSowItem.description}
                        onChange={(e) => setNewSowItem({...newSowItem, description: e.target.value})}
                        placeholder="SOW item description"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="sow-hours">Estimated Hours</Label>
                        <Input 
                          id="sow-hours" 
                          type="number"
                          value={newSowItem.estimatedHours.toString()}
                          onChange={(e) => setNewSowItem({...newSowItem, estimatedHours: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="sow-assignee">Assignee</Label>
                        <select 
                          id="sow-assignee"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                          value={newSowItem.assignee}
                          onChange={(e) => setNewSowItem({...newSowItem, assignee: e.target.value})}
                        >
                          <option value="">Select assignee</option>
                          <option value="Puneet Talwar">Puneet Talwar</option>
                          <option value="Jason Mosby">Jason Mosby</option>
                          <option value="Data Science Team">Data Science Team</option>
                          <option value="Brian Stitt">Brian Stitt</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="sow-status">Status</Label>
                      <select 
                        id="sow-status"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        value={newSowItem.status}
                        onChange={(e) => setNewSowItem({...newSowItem, status: e.target.value as 'pending' | 'approved' | 'in_progress' | 'completed'})}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sow-source">Source</Label>
                      <Input 
                        id="sow-source" 
                        value={newSowItem.source}
                        onChange={(e) => setNewSowItem({...newSowItem, source: e.target.value})}
                        placeholder="Where did this SOW item come from?"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mr-2"
                        onClick={() => setShowAddSow(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleAddSowItem}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save SOW Item
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mt-6">
                    <h3 className="font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-1" /> 
                      Statement of Work Items
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7"
                      onClick={() => setShowAddSow(true)}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" /> New
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {sowItems.map(item => (
                      <div key={item.id} className="border rounded-md p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge 
                            variant={item.status === 'approved' ? 'default' : 'secondary'}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mb-2">{item.description}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Est. {item.estimatedHours} hours
                          </span>
                          <span>{item.assignee}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                          <p>From: {item.source}</p>
                          <p className="italic">"{item.sourceChat.substring(0, 60)}..."</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="h-full">
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-accent/50">
                <div className="flex items-start mb-2">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <h4 className="font-medium">Communication Analysis</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on recent conversations, the team is focused on Q3 data analysis and dashboard improvements.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-accent/50">
                <div className="flex items-start mb-2">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                  <div>
                    <h4 className="font-medium">Upcoming Deadline Alert</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Q3 data analysis is due this Friday. Consider prioritizing this task for the Data Science team.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-accent/50">
                <div className="flex items-start mb-2">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <h4 className="font-medium">Resource Allocation Suggestion</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jason is currently working on dashboard updates. Consider assigning new visualization tasks to him once complete.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-accent/50">
                <div className="flex items-start mb-2">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <h4 className="font-medium">SOW Recommendation</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on recent requirements from Puneet, consider adding "Executive Dashboard Enhancement" as a new SOW item.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrchestrationAgent;
