import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { PlaybookTemplate } from '../../services/playbookAutomation';
import { ArrowLeft, CheckCircle, ClipboardList, MessageSquare, Bell, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import PlaybookJiraExport from './PlaybookJiraExport';

interface PlaybookTemplateDetailsProps {
  template: PlaybookTemplate;
  onBack: () => void;
  onCreateRun: (templateId: string, name: string, description: string) => void;
  isCreatingRun: boolean;
}

const PlaybookTemplateDetails: React.FC<PlaybookTemplateDetailsProps> = ({ 
  template, 
  onBack,
  onCreateRun,
  isCreatingRun
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJiraExport, setShowJiraExport] = useState(false);
  const [runName, setRunName] = useState(template.name);
  const [runDescription, setRunDescription] = useState(template.description);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-5 w-5" />;
      case 'checklist':
        return <ClipboardList className="h-5 w-5" />;
      case 'update':
        return <MessageSquare className="h-5 w-5" />;
      case 'notification':
        return <Bell className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRun(template.id, runName, runDescription);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={onBack} className="h-8 w-8 p-0">
          <span className="sr-only">Back</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">{template.name}</h2>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {template.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Category:</span> {template.category.replace('_', ' ')}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Created:</span> {formatDate(template.createdAt)}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Last Updated:</span> {formatDate(template.updatedAt)}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Steps</h3>
            <div className="space-y-4">
              {template.steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3 p-3 rounded-md border">
                  <div className="flex-shrink-0 mt-1 text-primary">
                    {getStepIcon(step.type)}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{index + 1}. {step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    {step.type === 'checklist' && step.checklistItems && (
                      <div className="mt-2 space-y-1">
                        {step.checklistItems.map(item => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <div className="h-4 w-4 border rounded-sm" />
                            <span className="text-sm">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {step.updatePrompt && (
                      <div className="mt-2 text-sm italic text-muted-foreground">
                        Prompt: {step.updatePrompt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-4">
            {showCreateForm ? (
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="run-name">Run Name</Label>
                  <Input 
                    id="run-name"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    placeholder="Enter a name for this run"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="run-description">Description</Label>
                  <Textarea 
                    id="run-description"
                    value={runDescription}
                    onChange={(e) => setRunDescription(e.target.value)}
                    placeholder="Enter a description for this run"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreatingRun}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isCreatingRun || !runName.trim()}
                  >
                    {isCreatingRun ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Start Playbook Run'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => setShowCreateForm(true)}
                >
                  Start New Run
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowJiraExport(true)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Export to Jira
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Jira Export Dialog */}
      {showJiraExport && (
        <PlaybookJiraExport
          template={template}
          open={showJiraExport}
          onClose={() => setShowJiraExport(false)}
        />
      )}
    </div>
  );
};

export default PlaybookTemplateDetails;
