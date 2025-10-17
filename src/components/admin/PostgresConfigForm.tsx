import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { PostgresConfig } from '../../services/postgres';

interface PostgresConfigFormProps {
  onSave: (config: PostgresConfig) => void;
  onCancel: () => void;
  initialConfig?: PostgresConfig;
}

const PostgresConfigForm: React.FC<PostgresConfigFormProps> = ({
  onSave,
  onCancel,
  initialConfig,
}) => {
  const [config, setConfig] = useState<PostgresConfig>(
    initialConfig || {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'project_management',
      ageEnabled: true,
      ageVersion: '1.0.0',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setConfig((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'port') {
      setConfig((prev) => ({ ...prev, [name]: parseInt(value, 10) || 5432 }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PostgreSQL with Apache AGE Configuration</CardTitle>
        <CardDescription>
          Enter your PostgreSQL database credentials and Apache AGE settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              name="host"
              value={config.host}
              onChange={handleChange}
              placeholder="localhost or IP address"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              name="port"
              type="number"
              value={config.port}
              onChange={handleChange}
              placeholder="5432"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="user">Username</Label>
            <Input
              id="user"
              name="user"
              value={config.user}
              onChange={handleChange}
              placeholder="postgres"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={config.password}
              onChange={handleChange}
              placeholder="Enter database password"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="database">Database Name</Label>
            <Input
              id="database"
              name="database"
              value={config.database}
              onChange={handleChange}
              placeholder="project_management"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Input
                id="ageEnabled"
                name="ageEnabled"
                type="checkbox"
                checked={config.ageEnabled}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <Label htmlFor="ageEnabled">Enable Apache AGE</Label>
            </div>
          </div>
          
          {config.ageEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="ageVersion">Apache AGE Version</Label>
              <Input
                id="ageVersion"
                name="ageVersion"
                value={config.ageVersion}
                onChange={handleChange}
                placeholder="1.0.0"
              />
            </div>
          )}
          
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

export default PostgresConfigForm;
