import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Loader2, Plus, BookOpen, Clock, CheckCircle, Archive } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import PlaybookTemplatesList from '../components/playbooks/PlaybookTemplatesList';
import PlaybookRunsList from '../components/playbooks/PlaybookRunsList';
import PlaybookRunDetails from '../components/playbooks/PlaybookRunDetails';
import PlaybookTemplateDetails from '../components/playbooks/PlaybookTemplateDetails';
import { PlaybookAutomationService, PlaybookTemplate, PlaybookRun, createPlaybookAutomationService } from '../services/playbookAutomation';

const PlaybooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [playbookService, setPlaybookService] = useState<PlaybookAutomationService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PlaybookTemplate[]>([]);
  const [runs, setRuns] = useState<PlaybookRun[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isCreatingRun, setIsCreatingRun] = useState(false);

  useEffect(() => {
    const initPlaybookService = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create playbook service
        const service = await createPlaybookAutomationService();
        setPlaybookService(service);
        
        if (service) {
          // Load templates and runs
          const templatesList = service.getTemplates();
          const runsList = service.getRuns();
          
          setTemplates(templatesList);
          setRuns(runsList);
        } else {
          setError('Failed to initialize playbook automation service.');
        }
      } catch (err) {
        console.error('Error initializing playbook service:', err);
        setError('An error occurred while initializing the playbook service.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initPlaybookService();
    
    // Set up interval to refresh runs (for updates)
    const intervalId = setInterval(() => {
      if (playbookService) {
        setRuns(playbookService.getRuns());
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedRunId(null);
    setActiveTab('template-details');
  };

  const handleRunSelect = (runId: string) => {
    setSelectedRunId(runId);
    setSelectedTemplateId(null);
    setActiveTab('run-details');
  };

  const handleCreateRun = async (templateId: string, name: string, description: string) => {
    if (!playbookService) return;
    
    setIsCreatingRun(true);
    
    try {
      const newRun = playbookService.startRun(
        templateId,
        name,
        description,
        'current-user', // In a real app, get the current user
        [] // In a real app, you might add participants here
      );
      
      if (newRun) {
        setRuns(playbookService.getRuns());
        setSelectedRunId(newRun.id);
        setActiveTab('run-details');
      }
    } catch (err) {
      console.error('Error creating run:', err);
      setError('Failed to create playbook run.');
    } finally {
      setIsCreatingRun(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTemplateId(null);
    setSelectedRunId(null);
    setActiveTab(activeTab === 'template-details' ? 'templates' : 'runs');
  };

  const handleAddUpdate = (runId: string, stepId: string, content: string) => {
    if (!playbookService) return;
    
    playbookService.addUpdate(runId, stepId, content, 'current-user');
    setRuns(playbookService.getRuns());
  };

  const handleCompleteStep = (runId: string, stepId: string) => {
    if (!playbookService) return;
    
    playbookService.completeStep(runId, stepId);
    setRuns(playbookService.getRuns());
  };

  const handleSkipStep = (runId: string, stepId: string) => {
    if (!playbookService) return;
    
    playbookService.skipStep(runId, stepId);
    setRuns(playbookService.getRuns());
  };

  const handleAddSchedule = (
    runId: string, 
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom',
    days: number[] | undefined,
    time: string,
    timezone: string,
    updatePrompt: string,
    notifyParticipants: boolean
  ) => {
    if (!playbookService) return;
    
    playbookService.addScheduledUpdate(runId, {
      frequency,
      days,
      time,
      timezone,
      updatePrompt,
      notifyParticipants
    });
    
    setRuns(playbookService.getRuns());
  };

  const handleArchiveRun = (runId: string) => {
    if (!playbookService) return;
    
    playbookService.archiveRun(runId);
    setRuns(playbookService.getRuns());
    
    if (selectedRunId === runId) {
      handleBackToList();
    }
  };

  const selectedTemplate = selectedTemplateId 
    ? templates.find(t => t.id === selectedTemplateId) 
    : null;
    
  const selectedRun = selectedRunId 
    ? runs.find(r => r.id === selectedRunId) 
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Playbooks</h1>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {selectedTemplateId && selectedTemplate ? (
              <PlaybookTemplateDetails 
                template={selectedTemplate}
                onBack={handleBackToList}
                onCreateRun={handleCreateRun}
                isCreatingRun={isCreatingRun}
              />
            ) : selectedRunId && selectedRun ? (
              <PlaybookRunDetails 
                run={selectedRun}
                onBack={handleBackToList}
                onAddUpdate={handleAddUpdate}
                onCompleteStep={handleCompleteStep}
                onSkipStep={handleSkipStep}
                onAddSchedule={handleAddSchedule}
                onArchive={handleArchiveRun}
              />
            ) : (
              <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="templates">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Templates
                  </TabsTrigger>
                  <TabsTrigger value="runs">
                    <Clock className="h-4 w-4 mr-2" />
                    Active Runs
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="h-4 w-4 mr-2" />
                    Archived
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="templates" className="space-y-4 mt-6">
                  <PlaybookTemplatesList 
                    templates={templates} 
                    onSelect={handleTemplateSelect} 
                  />
                </TabsContent>
                
                <TabsContent value="runs" className="space-y-4 mt-6">
                  <PlaybookRunsList 
                    runs={runs.filter(run => run.status === 'active')} 
                    onSelect={handleRunSelect} 
                  />
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-4 mt-6">
                  <PlaybookRunsList 
                    runs={runs.filter(run => run.status === 'completed')} 
                    onSelect={handleRunSelect} 
                  />
                </TabsContent>
                
                <TabsContent value="archived" className="space-y-4 mt-6">
                  <PlaybookRunsList 
                    runs={runs.filter(run => run.status === 'archived')} 
                    onSelect={handleRunSelect} 
                  />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default PlaybooksPage;
