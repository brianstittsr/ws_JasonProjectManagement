import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar, 
  Clock, 
  Tag, 
  User 
} from 'lucide-react';

interface Task {
  taskId: string;
  taskKey: string;
  summary: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  resolved?: string;
  dueDate?: string;
  timeTracking?: {
    originalEstimate: number;
    remainingEstimate: number;
    timeSpent: number;
  };
  assignee?: string;
  tags?: string[];
}

interface ContractorTaskListProps {
  tasks: Task[];
}

const ContractorTaskList: React.FC<ContractorTaskListProps> = ({ tasks }) => {
  const [sortField, setSortField] = useState<keyof Task>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Handle sorting
  const handleSort = (field: keyof Task) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      // Apply search filter
      if (searchTerm && !task.summary.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !task.taskKey.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply status filter
      if (filterStatus && task.status !== filterStatus) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Handle sorting
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  
  // Get unique statuses for filter
  const statuses = Array.from(new Set(tasks.map(task => task.status)));
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format time (seconds to hours and minutes)
  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'todo':
      case 'to do':
      case 'backlog':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'highest':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
      case 'lowest':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setFilterStatus(null)}
            className={!filterStatus ? 'bg-primary text-primary-foreground' : ''}
          >
            All
          </Button>
          {statuses.map(status => (
            <Button
              key={status}
              variant="outline"
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? 'bg-primary text-primary-foreground' : ''}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('taskKey')}
              >
                Key
                {sortField === 'taskKey' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('summary')}
              >
                Summary
                {sortField === 'summary' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('priority')}
              >
                Priority
                {sortField === 'priority' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('created')}
              >
                Created
                {sortField === 'created' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('dueDate')}
              >
                Due Date
                {sortField === 'dueDate' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.length > 0 ? (
              filteredAndSortedTasks.map((task) => (
                <TableRow key={task.taskId}>
                  <TableCell className="font-medium">{task.taskKey}</TableCell>
                  <TableCell>{task.summary}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(task.created)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {task.dueDate && (
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.timeTracking && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatTime(task.timeTracking.timeSpent)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No tasks found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContractorTaskList;
