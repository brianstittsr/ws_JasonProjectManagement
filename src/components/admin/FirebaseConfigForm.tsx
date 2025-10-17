import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface FirebaseConfigFormProps {
  onSave: (config: FirebaseConfig) => void;
  onCancel: () => void;
  initialConfig?: FirebaseConfig;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FirebaseConfigForm: React.FC<FirebaseConfigFormProps> = ({
  onSave,
  onCancel,
  initialConfig,
}) => {
  const [config, setConfig] = useState<FirebaseConfig>(
    initialConfig || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firebase Configuration</CardTitle>
        <CardDescription>
          Enter your Firebase project credentials to connect to your database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              value={config.apiKey}
              onChange={handleChange}
              placeholder="Enter your Firebase API Key"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="authDomain">Auth Domain</Label>
            <Input
              id="authDomain"
              name="authDomain"
              value={config.authDomain}
              onChange={handleChange}
              placeholder="your-project-id.firebaseapp.com"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              name="projectId"
              value={config.projectId}
              onChange={handleChange}
              placeholder="your-project-id"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="storageBucket">Storage Bucket</Label>
            <Input
              id="storageBucket"
              name="storageBucket"
              value={config.storageBucket}
              onChange={handleChange}
              placeholder="your-project-id.appspot.com"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
            <Input
              id="messagingSenderId"
              name="messagingSenderId"
              value={config.messagingSenderId}
              onChange={handleChange}
              placeholder="123456789012"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              name="appId"
              value={config.appId}
              onChange={handleChange}
              placeholder="1:123456789012:web:abc123def456"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FirebaseConfigForm;
