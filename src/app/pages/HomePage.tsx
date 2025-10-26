import React, { useState } from 'react';
import HomeLayout from '../layouts/HomeLayout';
import NotionEditor from '../components/notion/NotionEditor';
import { BlockData } from '../components/notion/Block';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  CheckSquare, 
  FileText, 
  PlusCircle, 
  Sparkles, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

// Mock data for WhatsApp chats
const whatsAppChats = [
  {
    id: 'puneet',
    name: 'Puneet Talwar',
    avatar: 'PT',
    avatarColor: 'bg-blue-500',
    lastMessage: 'We need to analyze the Q3 data by Friday',
    time: '10:30 AM',
    unread: 2,
  },
  {
    id: 'jason',
    name: 'Jason Mosby',
    avatar: 'JM',
    avatarColor: 'bg-green-500',
    lastMessage: 'I\'ve updated the dashboard with new metrics',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 'data-science',
    name: 'Data Science Team',
    avatar: 'DS',
    avatarColor: 'bg-purple-500',
    lastMessage: 'The model training is complete, accuracy at 92%',
    time: 'Yesterday',
    unread: 1,
  },
  {
    id: 'brian',
    name: 'Brian Stitt',
    avatar: 'BS',
    avatarColor: 'bg-orange-500',
    lastMessage: 'Let\'s review the implementation plan tomorrow',
    time: '2 days ago',
    unread: 0,
  },
];

// Mock data for detected tasks
const detectedTasks = [
  {
    id: 'task1',
    title: 'Analyze Q3 data and prepare report',
    description: 'Extract insights from Q3 performance data and create summary report',
    priority: 'high',
    assignee: 'Data Science Team',
    dueDate: '2025-10-15',
    status: 'pending',
    source: 'Puneet Talwar',
    sourceChat: 'We need to analyze the Q3 data by Friday and prepare a comprehensive report for the board meeting.',
    timestamp: '2025-10-12 10:30 AM',
  },
  {
    id: 'task2',
    title: 'Update dashboard with conversion metrics',
    description: 'Add new conversion funnel visualization to the main dashboard',
    priority: 'medium',
    assignee: 'Jason Mosby',
    dueDate: '2025-10-14',
    status: 'in_progress',
    source: 'Jason Mosby',
    sourceChat: 'I\'m working on updating the dashboard with the new conversion metrics we discussed yesterday.',
    timestamp: '2025-10-11 02:15 PM',
  },
  {
    id: 'task3',
    title: 'Review ML model performance',
    description: 'Evaluate accuracy and precision of the new prediction model',
    priority: 'medium',
    assignee: 'Data Science Team',
    dueDate: '2025-10-13',
    status: 'pending',
    source: 'Data Science Team',
    sourceChat: 'The model training is complete with 92% accuracy. We should review the performance metrics together.',
    timestamp: '2025-10-11 11:45 AM',
  },
];

// Mock data for SOW items
const sowItems = [
  {
    id: 'sow1',
    title: 'Q3 Data Analysis',
    description: 'Comprehensive analysis of Q3 performance data with actionable insights',
    estimatedHours: 24,
    assignee: 'Data Science Team',
    status: 'pending',
    source: 'Puneet Talwar',
    sourceChat: 'We need to analyze the Q3 data by Friday and prepare a comprehensive report for the board meeting.',
    timestamp: '2025-10-12 10:30 AM',
  },
  {
    id: 'sow2',
    title: 'Dashboard Enhancement',
    description: 'Add new visualizations and metrics to the executive dashboard',
    estimatedHours: 16,
    assignee: 'Jason Mosby',
    status: 'approved',
    source: 'Jason Mosby',
    sourceChat: 'I\'m working on updating the dashboard with the new conversion metrics we discussed yesterday.',
    timestamp: '2025-10-11 02:15 PM',
  },
];

// Mock conversation data
const mockConversation = [
  {
    id: 1,
    sender: 'Puneet Talwar',
    avatar: 'PT',
    avatarColor: 'bg-blue-500',
    message: 'We need to analyze the Q3 data by Friday and prepare a comprehensive report for the board meeting.',
    time: '10:30 AM',
  },
  {
    id: 2,
    sender: 'You',
    avatar: 'You',
    avatarColor: 'bg-primary',
    message: 'I\'ll coordinate with the Data Science team to get that done. Any specific metrics you want highlighted?',
    time: '10:32 AM',
  },
  {
    id: 3,
    sender: 'Puneet Talwar',
    avatar: 'PT',
    avatarColor: 'bg-blue-500',
    message: 'Yes, focus on conversion rates, customer acquisition costs, and the ROI of our new marketing campaign.',
    time: '10:35 AM',
  },
];

// Initial blocks for the NotionEditor
const initialBlocks: BlockData[] = [
  {
    id: '1',
    type: 'heading-1',
    content: 'Project Orchestration Hub',
  },
  {
    id: '2',
    type: 'text',
    content: 'This workspace helps you coordinate tasks between team members by analyzing WhatsApp communications and automatically identifying tasks and SOW items.',
  },
  {
    id: '3',
    type: 'heading-2',
    content: 'Recent Updates',
  },
  {
    id: '4',
    type: 'bulleted-list',
    content: 'New task detected from Puneet: Analyze Q3 data by Friday',
  },
  {
    id: '5',
    type: 'bulleted-list',
    content: 'Dashboard updates from Jason are in progress',
  },
  {
    id: '6',
    type: 'bulleted-list',
    content: 'Data Science team completed model training with 92% accuracy',
  },
];

const HomePage: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState(mockConversation);
  const [activeTab, setActiveTab] = useState('detected');

  const handleBlocksChange = (newBlocks: BlockData[]) => {
    setBlocks(newBlocks);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: conversations.length + 1,
      sender: 'You',
      avatar: 'You',
      avatarColor: 'bg-primary',
      message: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setConversations([...conversations, newMessage]);
    setMessage('');
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = {
        id: conversations.length + 2,
        sender: 'AI Assistant',
        avatar: '🤖',
        avatarColor: 'bg-violet-500',
        message: 'I\'ve detected a new task in this conversation. Would you like me to create a task for "Analyze Q3 data with focus on conversion rates, CAC, and marketing ROI"?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    // In a real app, this would load the actual conversation
    setConversations(mockConversation);
  };

  return (
    <HomeLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Notion-like editor */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Notes</CardTitle>
              <CardDescription>
                Use this space for notes, ideas, and project planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotionEditor 
                initialBlocks={blocks} 
                onChange={handleBlocksChange} 
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Middle column - WhatsApp chats and conversation */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>WhatsApp Communications</CardTitle>
              <CardDescription>
                Monitor and respond to team conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                {!activeChat ? (
                  <div className="space-y-2">
                    {whatsAppChats.map(chat => (
                      <div 
                        key={chat.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${chat.avatarColor} flex items-center justify-center text-white text-sm mr-3`}>
                            {chat.avatar}
                          </div>
                          <div>
                            <h4 className="font-medium">{chat.name}</h4>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {chat.lastMessage}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">{chat.time}</span>
                          {chat.unread > 0 && (
                            <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-1">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center p-3 border-b">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => setActiveChat(null)}
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <div className={`w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm mr-2`}>
                        PT
                      </div>
                      <h4 className="font-medium">Puneet Talwar</h4>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                      {conversations.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.sender !== 'You' && (
                            <div className={`w-8 h-8 rounded-full ${msg.avatarColor} flex items-center justify-center text-white text-sm mr-2 flex-shrink-0`}>
                              {msg.avatar}
                            </div>
                          )}
                          <div 
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender === 'You' 
                                ? 'bg-primary text-primary-foreground' 
                                : msg.sender === 'AI Assistant'
                                  ? 'bg-violet-100 dark:bg-violet-900'
                                  : 'bg-accent'
                            }`}
                          >
                            {msg.sender === 'AI Assistant' && (
                              <div className="flex items-center mb-1">
                                <Sparkles className="h-3 w-3 mr-1" />
                                <span className="text-xs font-medium">AI Assistant</span>
                              </div>
                            )}
                            <p>{msg.message}</p>
                            <span className="text-xs opacity-70 block text-right mt-1">
                              {msg.time}
                            </span>
                          </div>
                          {msg.sender === 'You' && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm ml-2 flex-shrink-0">
                              You
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 border-t">
                      <div className="flex items-center">
                        <Input
                          placeholder="Type a message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button 
                          size="icon" 
                          className="ml-2"
                          onClick={handleSendMessage}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - AI Orchestration */}
        <div className="lg:col-span-1">
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
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium flex items-center">
                        <CheckSquare className="h-4 w-4 mr-1" /> 
                        Tasks
                      </h3>
                      <Button variant="outline" size="sm" className="h-7">
                        <PlusCircle className="h-3 w-3 mr-1" /> New
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {detectedTasks.map(task => (
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
                    
                    <div className="flex justify-between items-center mt-6">
                      <h3 className="font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-1" /> 
                        Statement of Work Items
                      </h3>
                      <Button variant="outline" size="sm" className="h-7">
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
        </div>
      </div>
    </HomeLayout>
  );
};

export default HomePage;
