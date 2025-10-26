import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const AiWorkflowGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Welcome to the AI Workflow Generator. I can help you create n8n workflows using natural language. Please describe what you want to automate, and I\'ll ask follow-up questions to gather all the necessary details.'
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowJson, setWorkflowJson] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    
    setIsGenerating(true);
    
    try {
      // Simulate AI response with follow-up questions
      // In a real implementation, this would call your AI service
      setTimeout(() => {
        let aiResponse: Message;
        
        // Check if this is the first user message
        const userMessageCount = messages.filter(m => m.role === 'user').length;
        
        if (userMessageCount === 0) {
          // First response - ask follow-up questions
          aiResponse = {
            role: 'assistant',
            content: `Thanks for providing that workflow description. To create the most effective n8n workflow, I need some additional details:

1. What systems or applications should this workflow connect to?
2. How frequently should this workflow run? (e.g., on a schedule, when triggered by an event)
3. Are there any specific data transformations needed?
4. What should happen when the workflow completes successfully?
5. How should errors be handled?`
          };
        } else if (userMessageCount === 1) {
          // Second response - ask for more specific details
          aiResponse = {
            role: 'assistant',
            content: `Thank you for those details. Let me ask a few more specific questions:

1. Do you need to filter the data at any point in the workflow?
2. Should notifications be sent when the workflow runs?
3. Are there any authentication requirements for the services you're connecting to?
4. Do you need to store any data from the workflow execution?`
          };
        } else {
          // Final response - confirm and generate
          aiResponse = {
            role: 'assistant',
            content: `Perfect! I have all the information I need to generate your n8n workflow. Based on your requirements, I've created a workflow that:

1. Connects to the specified systems
2. Runs according to your schedule/trigger
3. Performs the necessary data transformations
4. Handles success and error cases as specified

I'm generating the workflow now. You'll be able to import this directly into your n8n instance.`
          };
          
          // Simulate generating workflow JSON
          setTimeout(() => {
            setWorkflowJson(JSON.stringify({
              "name": "Generated Workflow",
              "nodes": [
                {
                  "parameters": {},
                  "name": "Start",
                  "type": "n8n-nodes-base.start",
                  "typeVersion": 1,
                  "position": [
                    250,
                    300
                  ]
                },
                {
                  "parameters": {
                    "functionCode": "// Your workflow logic will be generated here based on requirements"
                  },
                  "name": "Function",
                  "type": "n8n-nodes-base.function",
                  "typeVersion": 1,
                  "position": [
                    450,
                    300
                  ]
                }
              ],
              "connections": {
                "Start": {
                  "main": [
                    [
                      {
                        "node": "Function",
                        "type": "main",
                        "index": 0
                      }
                    ]
                  ]
                }
              }
            }, null, 2));
          }, 1500);
        }
        
        setMessages(prev => [...prev, aiResponse]);
        setIsGenerating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating workflow:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error generating the workflow. Please try again.' 
      }]);
      setIsGenerating(false);
    }
  };

  const handleCopyWorkflow = () => {
    if (workflowJson) {
      navigator.clipboard.writeText(workflowJson);
      alert('Workflow JSON copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Workflow Generator</CardTitle>
          <CardDescription>
            Describe your automation needs in plain language, and I'll help you create an n8n workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${
                    message.role === 'user' 
                      ? 'text-right' 
                      : message.role === 'system' 
                        ? 'text-center italic text-muted-foreground' 
                        : ''
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="inline-block bg-primary text-primary-foreground rounded-lg py-2 px-3 max-w-[80%]">
                      {message.content}
                    </div>
                  ) : message.role === 'system' ? (
                    <div className="text-sm py-2 px-3">
                      {message.content}
                    </div>
                  ) : (
                    <div className="inline-block bg-secondary text-secondary-foreground rounded-lg py-2 px-3 max-w-[80%]">
                      {message.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <textarea
                className="flex-1 min-h-[80px] p-2 border rounded-md resize-none"
                placeholder="Describe the workflow you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <Button type="submit" disabled={isGenerating || !prompt.trim()}>
                {isGenerating ? 'Generating...' : 'Send'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      
      {workflowJson && (
        <Card>
          <CardHeader>
            <CardTitle>Generated n8n Workflow</CardTitle>
            <CardDescription>
              You can copy this JSON and import it directly into your n8n instance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-sm">{workflowJson}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCopyWorkflow}>
              Copy Workflow JSON
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default AiWorkflowGenerator;
