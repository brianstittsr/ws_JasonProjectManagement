import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Send, Loader2, Database, FileText, Globe } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: {
    id: string;
    name: string;
    type: 'url' | 'document' | 'database';
  }[];
  isFollowUp?: boolean;
  isThinking?: boolean;
}

interface AiAssistantProps {
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to the AI IT Assistant. I can help you with project management, CI/CD deployment, and enterprise system architecture questions. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!input.trim() || isProcessing) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI thinking
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: '',
      isThinking: true
    };
    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate AI response with follow-up questions
    setTimeout(() => {
      // Remove thinking message
      setMessages(prev => prev.filter(msg => !msg.isThinking));

      // Determine if we need follow-up questions or a final answer
      const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;
      const isSecondUserMessage = messages.filter(m => m.role === 'user').length === 1;
      
      if (isFirstUserMessage) {
        // First user message - ask follow-up questions
        const followUpMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `I'd be happy to help with that. To provide you with the most accurate information, I need a few more details:

1. Could you specify which systems or technologies you're working with?
2. Are you looking for information about a specific part of the process or architecture?
3. What's your current level of experience with this topic?

This will help me tailor my response to your specific needs.`,
          isFollowUp: true
        };
        setMessages(prev => [...prev, followUpMessage]);
      } else if (isSecondUserMessage) {
        // Second user message - ask more specific questions
        const followUpMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Thank you for providing that information. I have a couple more questions to ensure I give you the most helpful response:

1. What specific challenges are you facing with this implementation?
2. Have you already tried any solutions or approaches?
3. Are there any particular constraints or requirements I should be aware of?

Once I have this information, I'll be able to provide a comprehensive answer.`,
          isFollowUp: true
        };
        setMessages(prev => [...prev, followUpMessage]);
      } else {
        // Final comprehensive answer
        const finalAnswer: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Based on all the information you've provided, here's a comprehensive answer to your question:

The approach you're looking for involves several key components working together. First, you'll need to ensure your CI/CD pipeline is properly configured to handle the deployment requirements. This typically involves setting up automated testing, build processes, and deployment strategies.

For the specific architecture concerns you mentioned, I recommend implementing a microservices approach with containerization to improve scalability and maintainability. This will allow for more granular control over each component and make future updates easier.

Regarding the integration points between systems, you'll want to establish clear API contracts and consider implementing an API gateway to manage traffic and security.

Here are the specific steps I recommend:

1. Refactor the monolithic application into domain-specific services
2. Containerize each service using Docker
3. Set up Kubernetes for orchestration
4. Implement a CI/CD pipeline using Jenkins or GitHub Actions
5. Establish monitoring and observability with Prometheus and Grafana

Would you like me to elaborate on any specific part of this solution?`,
          sources: [
            {
              id: 'source-1',
              name: 'Company Documentation',
              type: 'url'
            },
            {
              id: 'source-4',
              name: 'API Documentation',
              type: 'url'
            },
            {
              id: 'source-5',
              name: 'Architecture Diagrams',
              type: 'document'
            }
          ]
        };
        setMessages(prev => [...prev, finalAnswer]);
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderSourceIcon = (type: 'url' | 'document' | 'database') => {
    switch (type) {
      case 'url':
        return <Globe className="h-3 w-3" />;
      case 'document':
        return <FileText className="h-3 w-3" />;
      case 'database':
        return <Database className="h-3 w-3" />;
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="mr-2 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>AI IT Assistant</CardTitle>
            <CardDescription>
              Ask questions across multiple knowledge sources
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.role === 'system'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.isThinking ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap">
                      {message.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map(source => (
                            <div 
                              key={source.id}
                              className="flex items-center text-xs bg-background text-foreground rounded-full px-2 py-0.5"
                            >
                              {renderSourceIcon(source.type)}
                              <span className="ml-1">{source.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center space-x-2">
          <textarea
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            rows={1}
            style={{ height: 'auto', minHeight: '40px', maxHeight: '120px' }}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AiAssistant;
