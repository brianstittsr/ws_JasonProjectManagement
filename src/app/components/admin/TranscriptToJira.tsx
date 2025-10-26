import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { JiraService, JiraConfig } from '../../services/jira';

interface TranscriptToJiraProps {
  jiraConfig: JiraConfig | null;
}

const TranscriptToJira: React.FC<TranscriptToJiraProps> = ({ jiraConfig }) => {
  const [transcript, setTranscript] = useState('');
  const [issueType, setIssueType] = useState('10001'); // Default to Task
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    issues?: string[];
  } | null>(null);
  const [jiraService, setJiraService] = useState<JiraService | null>(null);
  const [transcriptSource, setTranscriptSource] = useState<'manual' | 'file'>('manual');
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  useEffect(() => {
    const initJiraService = async () => {
      if (jiraConfig) {
        try {
          const service = new JiraService(jiraConfig);
          const connected = await service.testConnection();
          
          if (connected) {
            setJiraService(service);
            // Load issue types
            const types = await service.getIssueTypes();
            setIssueTypes(types);
          } else {
            setResult({
              success: false,
              message: 'Failed to connect to Jira. Please check your configuration.',
            });
          }
        } catch (error) {
          console.error('Error initializing Jira service:', error);
          setResult({
            success: false,
            message: 'Error initializing Jira service. Please check your configuration.',
          });
        }
      }
    };

    initJiraService();
  }, [jiraConfig]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTranscriptFile(e.target.files[0]);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  };

  const handleConvert = async () => {
    if (!jiraService) {
      setResult({
        success: false,
        message: 'Jira service is not initialized. Please check your configuration.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      let transcriptContent = transcript;
      
      // If using file upload, read the file content
      if (transcriptSource === 'file' && transcriptFile) {
        transcriptContent = await readFileContent(transcriptFile);
      }

      if (!transcriptContent.trim()) {
        setResult({
          success: false,
          message: 'Transcript content is empty. Please provide a transcript.',
        });
        setIsLoading(false);
        return;
      }

      const createdIssues = await jiraService.convertTranscriptToIssues(transcriptContent, issueType);
      
      if (createdIssues.length > 0) {
        setResult({
          success: true,
          message: `Successfully created ${createdIssues.length} Jira ${createdIssues.length === 1 ? 'issue' : 'issues'}.`,
          issues: createdIssues,
        });
      } else {
        setResult({
          success: false,
          message: 'No action items or tasks found in the transcript.',
        });
      }
    } catch (error) {
      console.error('Error converting transcript to Jira issues:', error);
      setResult({
        success: false,
        message: 'Error converting transcript to Jira issues. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!jiraConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript to Jira</CardTitle>
          <CardDescription>Convert meeting transcripts to Jira tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Please configure Jira integration in the API Configurations tab before using this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transcript to Jira</CardTitle>
        <CardDescription>Convert meeting transcripts to Jira tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Transcript Source</Label>
          <div className="flex space-x-4">
            <Button 
              variant={transcriptSource === 'manual' ? 'default' : 'outline'} 
              onClick={() => setTranscriptSource('manual')}
            >
              Manual Entry
            </Button>
            <Button 
              variant={transcriptSource === 'file' ? 'default' : 'outline'} 
              onClick={() => setTranscriptSource('file')}
            >
              Upload File
            </Button>
          </div>
        </div>

        {transcriptSource === 'manual' ? (
          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript Content</Label>
            <Textarea
              id="transcript"
              placeholder="Paste your meeting transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="transcriptFile">Upload Transcript File</Label>
            <Input
              id="transcriptFile"
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileChange}
            />
            {transcriptFile && (
              <p className="text-sm text-gray-500">
                Selected file: {transcriptFile.name}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="issueType">Issue Type</Label>
          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger>
              <SelectValue placeholder="Select Issue Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10001">Task</SelectItem>
              <SelectItem value="10002">Story</SelectItem>
              <SelectItem value="10004">Bug</SelectItem>
              {/* Additional issue types can be dynamically loaded from Jira */}
            </SelectContent>
          </Select>
        </div>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.issues && result.issues.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Created Issues:</p>
                  <ul className="list-disc pl-5">
                    {result.issues.map((issue, index) => (
                      <li key={index}>
                        <a 
                          href={`${jiraConfig.domain}/browse/${issue}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {issue}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleConvert} 
          disabled={isLoading || (!transcript && transcriptSource === 'manual') || (!transcriptFile && transcriptSource === 'file')}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            'Convert to Jira Tasks'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranscriptToJira;
