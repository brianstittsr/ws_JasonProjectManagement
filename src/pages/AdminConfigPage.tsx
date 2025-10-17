import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import ApiConfigCard from '../components/admin/ApiConfigCard';
import DatabaseConfigCard from '../components/admin/DatabaseConfigCard';
import FirebaseConfigForm from '../components/admin/FirebaseConfigForm';
import PostgresConfigForm from '../components/admin/PostgresConfigForm';
import AdminLayout from '../layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { FirebaseConfig } from '../components/admin/FirebaseConfigForm';
import { PostgresConfig } from '../services/postgres';
import AiWorkflowGenerator from '../components/admin/AiWorkflowGenerator';

// Mock API configuration data
const apiConfigs = [
  {
    id: 'zoom',
    title: 'Zoom',
    description: 'Video conferencing and virtual meeting platform',
    isConnected: false,
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'text' },
      { name: 'apiSecret', label: 'API Secret', type: 'password' },
      { name: 'accountEmail', label: 'Account Email', type: 'email' },
    ],
  },
  {
    id: 'fireflies',
    title: 'FireFlies.AI',
    description: 'AI meeting assistant for transcription and notes',
    isConnected: false,
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'text' },
      { name: 'workspaceId', label: 'Workspace ID', type: 'text' },
    ],
  },
  {
    id: 'snowflake',
    title: 'SnowFlake',
    description: 'Cloud data platform for data warehousing',
    isConnected: false,
    fields: [
      { name: 'accountName', label: 'Account Name', type: 'text' },
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'warehouse', label: 'Warehouse', type: 'text' },
      { name: 'database', label: 'Database', type: 'text' },
    ],
  },
  {
    id: 'google-workspace',
    title: 'Google WorkSpace',
    description: 'Productivity and collaboration tools',
    isConnected: false,
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password' },
      { name: 'redirectUri', label: 'Redirect URI', type: 'text' },
    ],
  },
  {
    id: 'gmail',
    title: 'Gmail',
    description: 'Email service by Google',
    isConnected: false,
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password' },
      { name: 'refreshToken', label: 'Refresh Token', type: 'text' },
    ],
  },
  {
    id: 'sms',
    title: 'SMS Texting',
    description: 'Text messaging service',
    isConnected: false,
    fields: [
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'apiKey', label: 'API Key', type: 'text' },
      { name: 'fromNumber', label: 'From Number', type: 'text' },
    ],
  },
  {
    id: 'dbeaver',
    title: 'DBeaver',
    description: 'Universal database tool',
    isConnected: false,
    fields: [
      { name: 'host', label: 'Host', type: 'text' },
      { name: 'port', label: 'Port', type: 'text' },
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'database', label: 'Database', type: 'text' },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Business',
    description: 'Business messaging platform',
    isConnected: false,
    fields: [
      { name: 'phoneNumberId', label: 'Phone Number ID', type: 'text' },
      { name: 'accessToken', label: 'Access Token', type: 'text' },
      { name: 'businessAccountId', label: 'Business Account ID', type: 'text' },
    ],
  },
  {
    id: 'jira',
    title: 'Jira',
    description: 'Issue tracking and project management',
    isConnected: false,
    fields: [
      { name: 'domain', label: 'Domain', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'apiToken', label: 'API Token', type: 'password' },
      { name: 'projectKey', label: 'Default Project Key', type: 'text' },
    ],
  },
  {
    id: 'n8n',
    title: 'n8n',
    description: 'Workflow automation platform',
    isConnected: false,
    fields: [
      { name: 'apiUrl', label: 'API URL', type: 'text' },
      { name: 'apiKey', label: 'API Key', type: 'password' },
    ],
  },
];

// Database configurations
const dbConfigs = [
  {
    id: 'firebase',
    title: 'Firebase',
    description: 'NoSQL cloud database by Google',
    isConnected: false,
    type: 'firebase' as const,
  },
  {
    id: 'postgres',
    title: 'PostgreSQL with Apache AGE',
    description: 'SQL database with graph extension',
    isConnected: false,
    type: 'postgres' as const,
  },
];

const AdminConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [postgresConfig, setPostgresConfig] = useState<PostgresConfig | null>(null);

  const handleApiCardClick = (apiId: string) => {
    setSelectedApi(apiId);
    // Initialize form data with empty values
    const initialData: Record<string, string> = {};
    const api = apiConfigs.find(api => api.id === apiId);
    if (api) {
      api.fields.forEach(field => {
        initialData[field.name] = '';
      });
    }
    setFormData(initialData);
  };

  const handleDbCardClick = (dbId: string) => {
    setSelectedDb(dbId);
  };

  const handleBackClick = () => {
    setSelectedApi(null);
    setSelectedDb(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    
    if (selectedApi) {
      // Save configuration to localStorage
      localStorage.setItem(`${selectedApi}-config`, JSON.stringify(formData));
      
      // Update connection status in apiConfigs
      const updatedApiConfigs = apiConfigs.map(api => {
        if (api.id === selectedApi) {
          return { ...api, isConnected: true };
        }
        return api;
      });
      
      // In a real app, you would update state or redux store here
      console.log('Updated API configs:', updatedApiConfigs);
    }
    
    alert('Configuration saved successfully!');
    setSelectedApi(null);
  };

  const handleFirebaseConfigSave = (config: FirebaseConfig) => {
    console.log('Firebase config saved:', config);
    setFirebaseConfig(config);
    // Here you would typically send the data to your backend
    alert('Firebase configuration saved successfully!');
    setSelectedDb(null);
  };

  const handlePostgresConfigSave = (config: PostgresConfig) => {
    console.log('PostgreSQL config saved:', config);
    setPostgresConfig(config);
    // Here you would typically send the data to your backend
    alert('PostgreSQL configuration saved successfully!');
    setSelectedDb(null);
  };

  // Filter APIs based on active tab
  const filteredApis = apiConfigs.filter(api => api.id !== 'n8n');

  const selectedApiConfig = apiConfigs.find(api => api.id === selectedApi);
  const selectedDbConfig = dbConfigs.find(db => db.id === selectedDb);

  return (
    <AdminLayout>
      <div className="mb-6">
        <Tabs defaultValue="api" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="api">API Configurations</TabsTrigger>
            <TabsTrigger value="database">Database Configurations</TabsTrigger>
            <TabsTrigger value="workflow">AI Workflow Generator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="mt-6">
            {selectedApi ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleBackClick} className="h-8 w-8 p-0">
                    <span className="sr-only">Back</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <h2 className="text-2xl font-bold">{selectedApiConfig?.title} Configuration</h2>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedApiConfig?.title}</CardTitle>
                    <CardDescription>{selectedApiConfig?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {selectedApiConfig?.fields.map(field => (
                        <div key={field.name} className="grid gap-2">
                          <Label htmlFor={field.name}>{field.label}</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleBackClick}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          Save Configuration
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApis.map((api) => (
                  <ApiConfigCard
                    key={api.id}
                    title={api.title}
                    description={api.description}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                      </svg>
                    }
                    isConnected={api.isConnected}
                    onClick={() => handleApiCardClick(api.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="database" className="mt-6">
            {selectedDb ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleBackClick} className="h-8 w-8 p-0">
                    <span className="sr-only">Back</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <h2 className="text-2xl font-bold">{selectedDbConfig?.title} Configuration</h2>
                </div>
                
                {selectedDb === 'firebase' && (
                  <FirebaseConfigForm 
                    onSave={handleFirebaseConfigSave}
                    onCancel={handleBackClick}
                    initialConfig={firebaseConfig || undefined}
                  />
                )}
                
                {selectedDb === 'postgres' && (
                  <PostgresConfigForm 
                    onSave={handlePostgresConfigSave}
                    onCancel={handleBackClick}
                    initialConfig={postgresConfig || undefined}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbConfigs.map((db) => (
                  <DatabaseConfigCard
                    key={db.id}
                    title={db.title}
                    description={db.description}
                    type={db.type}
                    icon={
                      db.id === 'firebase' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <ellipse cx="12" cy="5" rx="9" ry="3" />
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                      )
                    }
                    isConnected={db.isConnected}
                    onClick={() => handleDbCardClick(db.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="workflow" className="mt-6">
            <AiWorkflowGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminConfigPage;
