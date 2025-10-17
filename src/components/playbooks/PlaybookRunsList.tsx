import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PlaybookRun } from '../../services/playbookAutomation';
import { Clock, ArrowRight, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PlaybookRunsListProps {
  runs: PlaybookRun[];
  onSelect: (runId: string) => void;
}

const PlaybookRunsList: React.FC<PlaybookRunsListProps> = ({ runs, onSelect }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressInfo = (run: PlaybookRun) => {
    const totalSteps = run.steps.length;
    const completedSteps = run.steps.filter(step => 
      step.status === 'completed' || step.status === 'skipped'
    ).length;
    
    const percentage = totalSteps > 0 
      ? Math.round((completedSteps / totalSteps) * 100) 
      : 0;
    
    return {
      completedSteps,
      totalSteps,
      percentage
    };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <div className="space-y-4">
      {runs.map(run => {
        const progress = getProgressInfo(run);
        
        return (
          <Card key={run.id} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{run.name}</CardTitle>
                  <CardDescription>{run.description}</CardDescription>
                </div>
                {getStatusBadge(run.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Started {formatDate(run.startedAt)} ({formatTimeAgo(run.startedAt)})</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.completedSteps} of {progress.totalSteps} steps ({progress.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
                
                {run.updates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Latest Update</h4>
                    <div className="text-sm border-l-2 border-muted pl-3 py-1">
                      {run.updates[run.updates.length - 1].content.substring(0, 100)}
                      {run.updates[run.updates.length - 1].content.length > 100 ? '...' : ''}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => onSelect(run.id)}
              >
                View Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
      
      {runs.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No playbook runs</h3>
          <p className="text-muted-foreground">
            There are no playbook runs in this category.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaybookRunsList;
