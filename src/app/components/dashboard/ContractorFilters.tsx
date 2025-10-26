import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from 'lucide-react';
import { MetricsFilter } from '../../services/contractorMetrics';

interface ContractorFiltersProps {
  filter: MetricsFilter;
  onFilterChange: (filter: Partial<MetricsFilter>) => void;
}

const ContractorFilters: React.FC<ContractorFiltersProps> = ({
  filter,
  onFilterChange,
}) => {
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFilterChange({ [field]: value });
  };

  const handleProjectChange = (value: string) => {
    onFilterChange({ projects: value === 'all' ? undefined : [value] });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ statuses: value === 'all' ? undefined : [value] });
  };

  const handleReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    onFilterChange({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      projects: undefined,
      statuses: undefined,
      issueTypes: undefined,
      priorities: undefined,
      labels: undefined
    });
  };

  const handleApply = () => {
    // This is just a placeholder - the filter is applied immediately on change
    // But we could add validation or other logic here
  };

  // Predefined date ranges
  const dateRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last quarter', value: 'quarter' },
    { label: 'Year to date', value: 'ytd' },
  ];

  const handleDateRangeSelect = (range: string) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'quarter':
        startDate.setMonth(Math.floor(today.getMonth() / 3) * 3);
        startDate.setDate(1);
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    
    onFilterChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="startDate"
                type="date"
                className="pl-8"
                value={filter.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="endDate"
                type="date"
                className="pl-8"
                value={filter.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={filter.projects && filter.projects.length > 0 ? filter.projects[0] : 'all'}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="PROJ">Project One</SelectItem>
                <SelectItem value="PROJ2">Project Two</SelectItem>
                <SelectItem value="PROJ3">Project Three</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status Category</Label>
            <Select
              value={filter.statuses && filter.statuses.length > 0 ? filter.statuses[0] : 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {dateRanges.map((range) => (
            <Button
              key={range.value}
              variant="outline"
              size="sm"
              onClick={() => handleDateRangeSelect(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorFilters;
