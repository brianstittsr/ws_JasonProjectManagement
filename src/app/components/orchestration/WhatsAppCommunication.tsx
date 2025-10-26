import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ArrowRight, Send } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: string;
  avatar: string;
  avatarColor: string;
  message: string;
  time: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface WhatsAppCommunicationProps {
  chats: Chat[];
  onMessageSent?: (chatId: string, message: string) => void;
}

const WhatsAppCommunication: React.FC<WhatsAppCommunicationProps> = ({
  chats,
  onMessageSent
}) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    'puneet': [
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
    ],
    'jason': [
      {
        id: 1,
        sender: 'Jason Mosby',
        avatar: 'JM',
        avatarColor: 'bg-green-500',
        message: 'I\'ve updated the dashboard with new metrics as requested.',
        time: 'Yesterday',
      },
      {
        id: 2,
        sender: 'You',
        avatar: 'You',
        avatarColor: 'bg-primary',
        message: 'Great! Can you add the conversion funnel visualization as well?',
        time: 'Yesterday',
      },
      {
        id: 3,
        sender: 'Jason Mosby',
        avatar: 'JM',
        avatarColor: 'bg-green-500',
        message: 'Sure, I\'ll work on that today and have it ready by tomorrow.',
        time: 'Yesterday',
      },
    ],
    'data-science': [
      {
        id: 1,
        sender: 'Data Science Team',
        avatar: 'DS',
        avatarColor: 'bg-purple-500',
        message: 'The model training is complete with 92% accuracy.',
        time: 'Yesterday',
      },
      {
        id: 2,
        sender: 'You',
        avatar: 'You',
        avatarColor: 'bg-primary',
        message: 'That\'s excellent! When can we review the results?',
        time: 'Yesterday',
      },
      {
        id: 3,
        sender: 'Data Science Team',
        avatar: 'DS',
        avatarColor: 'bg-purple-500',
        message: 'We can schedule a review meeting tomorrow at 2 PM if that works for you.',
        time: 'Yesterday',
      },
    ],
    'brian': [
      {
        id: 1,
        sender: 'Brian Stitt',
        avatar: 'BS',
        avatarColor: 'bg-orange-500',
        message: 'Let\'s review the implementation plan tomorrow.',
        time: '2 days ago',
      },
      {
        id: 2,
        sender: 'You',
        avatar: 'You',
        avatarColor: 'bg-primary',
        message: 'Sounds good. I\'ll prepare the documentation.',
        time: '2 days ago',
      },
    ],
  });

  const handleSendMessage = () => {
    if (!message.trim() || !activeChat) return;
    
    const newMessage = {
      id: (conversations[activeChat]?.length || 0) + 1,
      sender: 'You',
      avatar: 'You',
      avatarColor: 'bg-primary',
      message: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setConversations(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage]
    }));
    
    if (onMessageSent) {
      onMessageSent(activeChat, message);
    }
    
    setMessage('');
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = {
        id: (conversations[activeChat]?.length || 0) + 2,
        sender: 'AI Assistant',
        avatar: '🤖',
        avatarColor: 'bg-violet-500',
        message: 'I\'ve detected a new task in this conversation. Would you like me to create a task for this?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), aiResponse]
      }));
    }, 1000);
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
  };

  const activeConversation = activeChat ? conversations[activeChat] || [] : [];
  const selectedChat = chats.find(chat => chat.id === activeChat);

  return (
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
              {chats.map(chat => (
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
                <div className={`w-8 h-8 rounded-full ${selectedChat?.avatarColor} flex items-center justify-center text-white text-sm mr-2`}>
                  {selectedChat?.avatar}
                </div>
                <h4 className="font-medium">{selectedChat?.name}</h4>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {activeConversation.map(msg => (
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
  );
};

export default WhatsAppCommunication;
