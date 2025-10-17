import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Brain, MessageSquare, Settings } from 'lucide-react';
import BmadAnalystAssistant from '../components/bmad/BmadAnalystAssistant';
import { createArchonService, ArchonService } from '../services/archon';
import AdminLayout from '../layouts/AdminLayout';

const BmadAnalystPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('assistant');
  const [showAssistant, setShowAssistant] = useState(false);
  const [archonService, setArchonService] = useState<ArchonService | null>(null);
  const [archonStatus, setArchonStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [archonConfig, setArchonConfig] = useState({
    apiUrl: process.env.REACT_APP_ARCHON_API_URL || '',
    apiKey: process.env.REACT_APP_ARCHON_API_KEY || '',
    vectorDb: process.env.REACT_APP_ARCHON_VECTOR_DB || 'pinecone',
    embeddingModel: process.env.REACT_APP_ARCHON_EMBEDDING_MODEL || 'text-embedding-ada-002',
    completionModel: process.env.REACT_APP_ARCHON_COMPLETION_MODEL || 'gpt-4-turbo'
  });

  useEffect(() => {
    const initializeArchon = async () => {
      try {
        const service = await createArchonService();
        if (service) {
          setArchonService(service);
          setArchonStatus('connected');
        } else {
          setArchonStatus('error');
        }
      } catch (error) {
        console.error('Failed to initialize Archon service:', error);
        setArchonStatus('error');
      }
    };

    initializeArchon();
  }, []);

  const handleOpenAssistant = () => {
    setShowAssistant(true);
  };

  const handleCloseAssistant = () => {
    setShowAssistant(false);
  };

  const handleSaveConfig = async () => {
    // In a real app, this would update environment variables or localStorage
    // For now, we'll just try to create a new service with the updated config
    try {
      const service = new ArchonService(archonConfig);
      const isConnected = await service.testConnection();
      
      if (isConnected) {
        setArchonService(service);
        setArchonStatus('connected');
        alert('Archon configuration saved and connection successful!');
      } else {
        setArchonStatus('error');
        alert('Failed to connect to Archon with the provided configuration.');
      }
    } catch (error) {
      console.error('Error saving Archon config:', error);
      setArchonStatus('error');
      alert('Error saving configuration. Please check console for details.');
    }
  };

  const content = (
    <>
      {showAssistant ? (
        <BmadAnalystAssistant onClose={handleCloseAssistant} archonService={archonService} />
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>BMAD Analyst Assistant</CardTitle>
                <CardDescription>
                  Powered by Archon Knowledge Base with RAG search for content tagged with "resbyte"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain size={64} className="mb-4 text-primary" />
                  <h3 className="text-2xl font-semibold mb-2">AI-Powered Business Analysis</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Get market research, competitive analysis, and strategic insights using the BMAD Analyst methodology combined with your organization's knowledge.
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-6">
                    <div className={`h-3 w-3 rounded-full ${
                      archonStatus === 'connected' ? 'bg-green-500' : 
                      archonStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">
                      {archonStatus === 'connected' ? 'Connected to Archon' : 
                       archonStatus === 'connecting' ? 'Connecting to Archon...' : 'Archon connection error'}
                    </span>
                  </div>
                  
                  <Button 
                    size="lg" 
                    onClick={handleOpenAssistant}
                    disabled={archonStatus !== 'connected'}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Open Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="configuration" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Archon Configuration</CardTitle>
                <CardDescription>
                  Configure connection to the Archon knowledge base for RAG search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="apiUrl" className="text-sm font-medium">API URL</label>
                    <input
                      id="apiUrl"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={archonConfig.apiUrl}
                      onChange={(e) => setArchonConfig({...archonConfig, apiUrl: e.target.value})}
                      placeholder="https://your-archon-instance.com/api"
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="apiKey" className="text-sm font-medium">API Key</label>
                    <input
                      id="apiKey"
                      type="password"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={archonConfig.apiKey}
                      onChange={(e) => setArchonConfig({...archonConfig, apiKey: e.target.value})}
                      placeholder="Your Archon API key"
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="vectorDb" className="text-sm font-medium">Vector Database</label>
                    <select
                      id="vectorDb"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={archonConfig.vectorDb}
                      onChange={(e) => setArchonConfig({...archonConfig, vectorDb: e.target.value})}
                    >
                      <option value="pinecone">Pinecone</option>
                      <option value="qdrant">Qdrant</option>
                      <option value="chroma">Chroma</option>
                      <option value="weaviate">Weaviate</option>
                    </select>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="embeddingModel" className="text-sm font-medium">Embedding Model</label>
                    <input
                      id="embeddingModel"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={archonConfig.embeddingModel}
                      onChange={(e) => setArchonConfig({...archonConfig, embeddingModel: e.target.value})}
                      placeholder="text-embedding-ada-002"
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="completionModel" className="text-sm font-medium">Completion Model</label>
                    <input
                      id="completionModel"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={archonConfig.completionModel}
                      onChange={(e) => setArchonConfig({...archonConfig, completionModel: e.target.value})}
                      placeholder="gpt-4-turbo"
                    />
                  </div>
                  
                  <Button onClick={handleSaveConfig} className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </>
  );

  return <AdminLayout>{content}</AdminLayout>;
};

export default BmadAnalystPage;
