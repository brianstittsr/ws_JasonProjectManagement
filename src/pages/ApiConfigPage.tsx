import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import ApiConfigCard from '../components/admin/ApiConfigCard';
import AdminLayout from '../layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

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
];

const ApiConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

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

  const handleBackClick = () => {
    setSelectedApi(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here you would typically send the data to your backend
    alert('Configuration saved successfully!');
    setSelectedApi(null);
  };

  // Filter APIs based on active tab
  const filteredApis = activeTab === 'all' 
    ? apiConfigs 
    : activeTab === 'connected' 
      ? apiConfigs.filter(api => api.isConnected) 
      : apiConfigs.filter(api => !api.isConnected);

  const selectedApiConfig = apiConfigs.find(api => api.id === selectedApi);

  return (
    <AdminLayout>
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
        <>
          <div className="mb-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="connected">Connected</TabsTrigger>
                <TabsTrigger value="not-connected">Not Connected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

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
        </>
      )}
    </AdminLayout>
  );
};

export default ApiConfigPage;
