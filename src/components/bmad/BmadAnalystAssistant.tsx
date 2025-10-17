import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Send, Loader2, Database, FileText, Globe, Tag } from 'lucide-react';
import { ArchonService } from '../../services/archon';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: {
    id: string;
    name: string;
    type: 'url' | 'document' | 'database';
    content?: string;
  }[];
  isThinking?: boolean;
}

interface BmadAnalystAssistantProps {
  onClose: () => void;
  archonService?: ArchonService;
}

const BmadAnalystAssistant: React.FC<BmadAnalystAssistantProps> = ({ onClose, archonService }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to the BMAD Analyst Assistant. I can help you with market research, brainstorming, competitive analysis, and creating project briefs. I have access to the Archon knowledge base with content tagged "resbyte". How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedSource, setSelectedSource] = useState<{id: string, name: string, content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
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

    // Add thinking message
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: '',
      isThinking: true
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      let assistantMessage: Message;
      
      if (archonService && useRag) {
        // Use RAG with Archon
        const searchResults = await archonService.searchKnowledge(input, ['resbyte']);
        
        if (searchResults && searchResults.length > 0) {
          // Generate response using the search results
          const response = await generateResponseWithRAG(input, searchResults);
          
          assistantMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.content,
            sources: response.sources
          };
        } else {
          // No search results found
          assistantMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: "I couldn't find any relevant information in the knowledge base. Let me provide a general response based on my training.\n\n" + 
                    generateAnalystResponse(input)
          };
        }
      } else {
        // Generate response without RAG
        assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: generateAnalystResponse(input)
        };
      }

      // Remove thinking message and add assistant message
      setMessages(prev => 
        prev.filter(msg => !msg.isThinking).concat(assistantMessage)
      );
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Remove thinking message and add error message
      setMessages(prev => 
        prev.filter(msg => !msg.isThinking).concat({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error while generating a response. Please try again.'
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const generateResponseWithRAG = async (query: string, searchResults: any[]) => {
    try {
      // If we have real Archon service, use it to generate a response
      if (archonService) {
        const emailContent = {
          subject: 'BMAD Analyst Query',
          body: query,
          from: 'user'
        };
        
        const responseDraft = await archonService.generateResponseDraft(emailContent, { useTag: 'resbyte' });
        
        if (responseDraft) {
          return {
            content: responseDraft.body,
            sources: responseDraft.references.map((ref, index) => ({
              id: `source-${index}`,
              name: ref.title,
              type: 'document' as 'url' | 'document' | 'database',
              content: ref.content
            }))
          };
        }
      }
      
      // Fallback if Archon response generation fails or is unavailable
      // Format search results into sources
      const sources = searchResults.map((result, index) => ({
        id: `source-${index}`,
        name: result.metadata.title || `Document ${index + 1}`,
        type: determineSourceType(result.metadata),
        content: result.content
      }));
      
      return {
        content: `Based on the information in our knowledge base, here's what I found about "${query}":\n\n` +
                 generateAnalystResponse(query),
        sources
      };
    } catch (error) {
      console.error('Error in RAG response generation:', error);
      return {
        content: `I found some information in our knowledge base, but had trouble processing it. Here's a general response:\n\n` +
                 generateAnalystResponse(query),
        sources: []
      };
    }
  };

  const determineSourceType = (metadata: any): 'url' | 'document' | 'database' => {
    if (metadata.url && metadata.url.startsWith('http')) {
      return 'url';
    } else if (metadata.filename || metadata.source) {
      return 'document';
    } else {
      return 'database';
    }
  };

  const generateAnalystResponse = (query: string): string => {
    // This is a simple response generator that mimics BMAD Analyst behavior
    // In a real implementation, this would be more sophisticated
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('market research') || lowerQuery.includes('research')) {
      return "To conduct effective market research, I recommend following these steps:\n\n" +
             "1. Define your research objectives clearly\n" +
             "2. Identify your target market and audience segments\n" +
             "3. Select appropriate research methodologies (surveys, interviews, focus groups)\n" +
             "4. Gather both quantitative and qualitative data\n" +
             "5. Analyze findings to identify patterns and insights\n" +
             "6. Create actionable recommendations based on research\n\n" +
             "Would you like me to help you create a structured research plan for your specific needs?";
    } else if (lowerQuery.includes('brainstorm') || lowerQuery.includes('ideas')) {
      return "Let's approach this brainstorming session systematically:\n\n" +
             "1. First, let's clearly define the problem or opportunity\n" +
             "2. We'll use divergent thinking to generate as many ideas as possible\n" +
             "3. Then we'll use convergent thinking to evaluate and refine ideas\n\n" +
             "Some effective brainstorming techniques we could use:\n" +
             "- Mind mapping\n" +
             "- SCAMPER method (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse)\n" +
             "- Six Thinking Hats\n" +
             "- Random word association\n\n" +
             "Which approach would you prefer to start with?";
    } else if (lowerQuery.includes('competitor') || lowerQuery.includes('competition')) {
      return "For a comprehensive competitor analysis, we should examine:\n\n" +
             "1. Direct competitors (same product/service, same market)\n" +
             "2. Indirect competitors (different solution to same problem)\n" +
             "3. Potential future competitors\n\n" +
             "For each competitor, we'll analyze:\n" +
             "- Market position and share\n" +
             "- Product/service offerings and pricing\n" +
             "- Strengths and weaknesses\n" +
             "- Marketing strategies and messaging\n" +
             "- Customer perceptions and loyalty\n\n" +
             "I can help you create a structured competitor analysis document. Would you like to focus on a specific aspect first?";
    } else if (lowerQuery.includes('project brief') || lowerQuery.includes('brief')) {
      return "A comprehensive project brief should include:\n\n" +
             "1. Project overview and objectives\n" +
             "2. Scope and deliverables\n" +
             "3. Target audience and user personas\n" +
             "4. Market context and competitive landscape\n" +
             "5. Success metrics and KPIs\n" +
             "6. Timeline and milestones\n" +
             "7. Budget constraints\n" +
             "8. Team roles and responsibilities\n" +
             "9. Risks and mitigation strategies\n\n" +
             "I can help you develop each section of your project brief. Which area would you like to start with?";
    } else {
      return "As a BMAD Analyst, I can help you with:\n\n" +
             "- Market research and analysis\n" +
             "- Competitive intelligence\n" +
             "- Brainstorming and ideation\n" +
             "- Project brief development\n" +
             "- Strategic planning\n" +
             "- User research and personas\n\n" +
             "Please let me know which of these areas you'd like to explore, or share more details about your specific needs.";
    }
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

  const handleSourceClick = (source: {id: string, name: string, content: string}) => {
    setSelectedSource(source);
    setActiveTab('source');
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
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
              <CardTitle>BMAD Analyst Assistant</CardTitle>
              <CardDescription>
                Powered by Archon Knowledge Base
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="rag-mode" className="text-xs">RAG Search</Label>
            <Switch
              id="rag-mode"
              checked={useRag}
              onCheckedChange={setUseRag}
              disabled={!archonService}
            />
            <Badge variant={archonService ? "default" : "destructive"} className="ml-2">
              <Tag className="h-3 w-3 mr-1" />
              resbyte
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
            <TabsTrigger value="source" className="flex-1" disabled={!selectedSource}>Source View</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
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
                                <Button 
                                  key={source.id}
                                  variant="outline" 
                                  size="sm"
                                  className="h-6 text-xs flex items-center"
                                  onClick={() => source.content && handleSourceClick({
                                    id: source.id,
                                    name: source.name,
                                    content: source.content
                                  })}
                                >
                                  {renderSourceIcon(source.type)}
                                  <span className="ml-1 truncate max-w-[150px]">{source.name}</span>
                                </Button>
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
                placeholder="Ask the BMAD Analyst..."
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
        </TabsContent>
        
        <TabsContent value="source" className="flex-1 flex flex-col">
          {selectedSource && (
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{selectedSource.name}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('chat')}
                  className="mt-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to chat
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                {selectedSource.content}
              </div>
            </CardContent>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default BmadAnalystAssistant;
