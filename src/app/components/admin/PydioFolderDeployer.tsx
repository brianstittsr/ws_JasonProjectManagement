import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { createPydioService } from '../../services/pydio';
import { PydioFolderStructureService, FolderStructure } from '../../services/pydioFolderStructure';
import { CheckCircle, AlertCircle, Loader2, FolderPlus } from 'lucide-react';

// Default folder structure JSON
import defaultStructureJson from '../../assets/pydio-folder-structure.json';

interface PydioFolderDeployerProps {
  onComplete?: (result: { success: boolean; created: number; failed: number }) => void;
}

const PydioFolderDeployer: React.FC<PydioFolderDeployerProps> = ({ onComplete }) => {
  const [activeTab, setActiveTab] = useState('default');
  const [folderStructureJson, setFolderStructureJson] = useState<string>(
    JSON.stringify(defaultStructureJson, null, 2)
  );
  const [customStructureJson, setCustomStructureJson] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean;
    created: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load default structure on mount
  useEffect(() => {
    try {
      setFolderStructureJson(JSON.stringify(defaultStructureJson, null, 2));
    } catch (err) {
      console.error('Error loading default structure:', err);
      setError('Failed to load default folder structure');
    }
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update the active structure based on tab
    if (value === 'default') {
      setFolderStructureJson(JSON.stringify(defaultStructureJson, null, 2));
    } else if (value === 'custom') {
      setFolderStructureJson(customStructureJson || '{\n  "folders": []\n}');
    }
  };

  // Handle custom structure change
  const handleCustomStructureChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomStructureJson(e.target.value);
    if (activeTab === 'custom') {
      setFolderStructureJson(e.target.value);
    }
  };

  // Deploy folder structure
  const deployFolderStructure = async () => {
    setError(null);
    setIsDeploying(true);
    setDeploymentProgress(0);
    setDeploymentResult(null);
    
    try {
      // Parse the JSON structure
      let structure: FolderStructure;
      try {
        structure = JSON.parse(folderStructureJson) as FolderStructure;
      } catch (err) {
        throw new Error(`Invalid JSON structure: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      // Create Pydio service
      const pydioService = await createPydioService();
      if (!pydioService) {
        throw new Error('Failed to create Pydio service. Please check your configuration.');
      }
      
      // Create folder structure service
      const folderStructureService = new PydioFolderStructureService(pydioService);
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setDeploymentProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 500);
      
      // Deploy the structure
      const result = await folderStructureService.createFolderStructure(structure);
      
      // Clear progress interval and set to 100%
      clearInterval(progressInterval);
      setDeploymentProgress(100);
      
      // Set result
      setDeploymentResult(result);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete({
          success: result.success,
          created: result.created,
          failed: result.failed
        });
      }
    } catch (err) {
      setError(`Deployment failed: ${err instanceof Error ? err.message : String(err)}`);
      setDeploymentResult({
        success: false,
        created: 0,
        failed: 1,
        errors: [err instanceof Error ? err.message : String(err)]
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pydio Folder Structure Deployment</CardTitle>
        <CardDescription>
          Deploy the Resbyte.ai folder structure to your Pydio instance
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {deploymentResult && (
          <Alert 
            variant={deploymentResult.success ? "default" : "destructive"} 
            className={`mb-4 ${deploymentResult.success ? 'bg-green-50 border-green-200' : ''}`}
          >
            {deploymentResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {deploymentResult.success ? 'Deployment Successful' : 'Deployment Completed with Errors'}
            </AlertTitle>
            <AlertDescription>
              <p>
                Created {deploymentResult.created} folders. 
                {deploymentResult.failed > 0 && ` Failed to create ${deploymentResult.failed} folders.`}
              </p>
              
              {deploymentResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {deploymentResult.errors.slice(0, 5).map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                    {deploymentResult.errors.length > 5 && (
                      <li>...and {deploymentResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {isDeploying && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Deploying folder structure...</span>
            </div>
            <Progress value={deploymentProgress} className="h-2" />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="default">Default Structure</TabsTrigger>
            <TabsTrigger value="custom">Custom Structure</TabsTrigger>
          </TabsList>
          
          <TabsContent value="default">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                This is the default Resbyte.ai folder structure. Click "Deploy Structure" to create these folders in your Pydio instance.
              </p>
              <div className="bg-muted rounded-md p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs">{folderStructureJson}</pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Customize the folder structure by editing the JSON below.
              </p>
              <Textarea
                value={customStructureJson}
                onChange={handleCustomStructureChange}
                className="font-mono text-xs h-96"
                placeholder='{"folders": [{"path": "/Example", "children": [{"path": "/Example/Subfolder"}]}]}'
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={deployFolderStructure} 
          disabled={isDeploying}
          className="w-full"
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <FolderPlus className="mr-2 h-4 w-4" />
              Deploy Structure
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PydioFolderDeployer;
