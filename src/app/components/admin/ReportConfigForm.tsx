import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ReportConfig } from '../../services/reportGenerator';

interface ReportConfigFormProps {
  reportConfig: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
}

const ReportConfigForm: React.FC<ReportConfigFormProps> = ({ 
  reportConfig, 
  onConfigChange 
}) => {
  const [newQuery, setNewQuery] = useState({
    name: '',
    query: '',
    limit: 10
  });

  const handleAddQuery = () => {
    if (!newQuery.name || !newQuery.query) return;
    
    onConfigChange({
      ...reportConfig,
      jqlQueries: [
        ...reportConfig.jqlQueries,
        {
          name: newQuery.name,
          query: newQuery.query,
          limit: newQuery.limit
        }
      ]
    });
    
    setNewQuery({
      name: '',
      query: '',
      limit: 10
    });
  };

  const handleRemoveQuery = (index: number) => {
    const updatedQueries = [...reportConfig.jqlQueries];
    updatedQueries.splice(index, 1);
    
    onConfigChange({
      ...reportConfig,
      jqlQueries: updatedQueries
    });
  };

  const handleUpdateQuery = (index: number, field: string, value: string | number) => {
    const updatedQueries = [...reportConfig.jqlQueries];
    updatedQueries[index] = {
      ...updatedQueries[index],
      [field]: value
    };
    
    onConfigChange({
      ...reportConfig,
      jqlQueries: updatedQueries
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="reportTitle">Report Title</Label>
        <Input 
          id="reportTitle"
          value={reportConfig.title}
          onChange={(e) => onConfigChange({
            ...reportConfig,
            title: e.target.value
          })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reportDescription">Description</Label>
        <Textarea 
          id="reportDescription"
          value={reportConfig.description}
          onChange={(e) => onConfigChange({
            ...reportConfig,
            description: e.target.value
          })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="includeMetrics">Include Metrics</Label>
          <Switch 
            id="includeMetrics"
            checked={reportConfig.includeMetrics}
            onCheckedChange={(checked) => onConfigChange({
              ...reportConfig,
              includeMetrics: checked
            })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="includeCharts">Include Charts</Label>
          <Switch 
            id="includeCharts"
            checked={reportConfig.includeCharts}
            onCheckedChange={(checked) => onConfigChange({
              ...reportConfig,
              includeCharts: checked
            })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="includeSummary">Include Summary</Label>
          <Switch 
            id="includeSummary"
            checked={reportConfig.includeSummary}
            onCheckedChange={(checked) => onConfigChange({
              ...reportConfig,
              includeSummary: checked
            })}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <Label>JQL Queries</Label>
        
        {reportConfig.jqlQueries.map((query, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Input 
                  value={query.name}
                  onChange={(e) => handleUpdateQuery(index, 'name', e.target.value)}
                  placeholder="Section Name"
                  className="text-base font-medium"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label htmlFor={`query-${index}`}>JQL Query</Label>
                <Textarea 
                  id={`query-${index}`}
                  value={query.query}
                  onChange={(e) => handleUpdateQuery(index, 'query', e.target.value)}
                  placeholder="priority = Highest AND resolution = Unresolved"
                />
              </div>
              <div>
                <Label htmlFor={`limit-${index}`}>Result Limit</Label>
                <Input 
                  id={`limit-${index}`}
                  type="number"
                  min="1"
                  max="100"
                  value={query.limit}
                  onChange={(e) => handleUpdateQuery(index, 'limit', parseInt(e.target.value) || 10)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveQuery(index)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Add New Query</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="newQueryName">Section Name</Label>
              <Input 
                id="newQueryName"
                value={newQuery.name}
                onChange={(e) => setNewQuery(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Critical Issues"
              />
            </div>
            <div>
              <Label htmlFor="newQuery">JQL Query</Label>
              <Textarea 
                id="newQuery"
                value={newQuery.query}
                onChange={(e) => setNewQuery(prev => ({ ...prev, query: e.target.value }))}
                placeholder="priority = Highest AND resolution = Unresolved"
              />
            </div>
            <div>
              <Label htmlFor="newLimit">Result Limit</Label>
              <Input 
                id="newLimit"
                type="number"
                min="1"
                max="100"
                value={newQuery.limit}
                onChange={(e) => setNewQuery(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAddQuery}
              disabled={!newQuery.name || !newQuery.query}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Query
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ReportConfigForm;
