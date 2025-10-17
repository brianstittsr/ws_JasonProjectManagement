import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ContractorMetrics } from '../../services/contractorMetrics';
import PerformanceChart from '../charts/PerformanceChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

interface ContractorComparisonProps {
  currentContractor: ContractorMetrics;
  previousPeriodMetrics: ContractorMetrics | null;
  allContractors: ContractorMetrics[];
  onLoadAllContractors: () => void;
}

const ContractorComparison: React.FC<ContractorComparisonProps> = ({
  currentContractor,
  previousPeriodMetrics,
  allContractors,
  onLoadAllContractors
}) => {
  const [comparisonType, setComparisonType] = useState<'time' | 'team'>('time');
  const [selectedMetric, setSelectedMetric] = useState<string>('productivity');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Metrics options
  const metricOptions = [
    { value: 'productivity', label: 'Productivity Score' },
    { value: 'quality', label: 'Quality Score' },
    { value: 'onTime', label: 'On-Time Delivery' },
    { value: 'velocity', label: 'Velocity' },
    { value: 'timeAccuracy', label: 'Time Estimate Accuracy' },
  ];

  // Generate comparison data based on type and selected metric
  useEffect(() => {
    if (comparisonType === 'time') {
      // Time-based comparison (current vs previous period)
      generateTimePeriodComparison();
    } else {
      // Team-based comparison (against other contractors)
      generateTeamComparison();
    }
  }, [comparisonType, selectedMetric, currentContractor, previousPeriodMetrics, allContractors]);

  const generateTimePeriodComparison = () => {
    if (!previousPeriodMetrics) {
      setComparisonData([
        {
          name: 'Current Period',
          value: getMetricValue(currentContractor, selectedMetric),
        }
      ]);
      return;
    }

    setComparisonData([
      {
        name: 'Current Period',
        value: getMetricValue(currentContractor, selectedMetric),
      },
      {
        name: 'Previous Period',
        value: getMetricValue(previousPeriodMetrics, selectedMetric),
      }
    ]);
  };

  const generateTeamComparison = () => {
    if (allContractors.length === 0) {
      setComparisonData([
        {
          name: currentContractor.contractor.name,
          value: getMetricValue(currentContractor, selectedMetric),
        }
      ]);
      return;
    }

    // Create comparison data with current contractor and team average
    const teamData = allContractors.map(contractor => ({
      name: contractor.contractor.name,
      value: getMetricValue(contractor, selectedMetric),
    }));

    // Add team average
    const teamAverage = allContractors.reduce((sum, contractor) => 
      sum + getMetricValue(contractor, selectedMetric), 0) / allContractors.length;

    teamData.push({
      name: 'Team Average',
      value: teamAverage,
    });

    setComparisonData(teamData);
  };

  const getMetricValue = (metrics: ContractorMetrics, metricName: string): number => {
    switch (metricName) {
      case 'productivity':
        return metrics.summary.productivityScore;
      case 'quality':
        return metrics.summary.qualityScore;
      case 'onTime':
        return metrics.summary.onTimeDelivery;
      case 'velocity':
        return metrics.summary.completedTasks / 
          ((new Date(metrics.period.endDate).getTime() - new Date(metrics.period.startDate).getTime()) / 
          (1000 * 60 * 60 * 24 * 7)); // Tasks per week
      case 'timeAccuracy':
        return metrics.timeTracking.estimateAccuracy;
      default:
        return 0;
    }
  };

  const handleLoadAllContractors = () => {
    setIsLoading(true);
    onLoadAllContractors();
    // The parent component will update the allContractors prop
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Generate radar chart data for overall comparison
  const generateRadarData = () => {
    if (!previousPeriodMetrics) return [];

    return [
      {
        metric: 'Productivity',
        current: currentContractor.summary.productivityScore,
        previous: previousPeriodMetrics.summary.productivityScore,
      },
      {
        metric: 'Quality',
        current: currentContractor.summary.qualityScore,
        previous: previousPeriodMetrics.summary.qualityScore,
      },
      {
        metric: 'On-Time',
        current: currentContractor.summary.onTimeDelivery,
        previous: previousPeriodMetrics.summary.onTimeDelivery,
      },
      {
        metric: 'Tasks Completed',
        current: currentContractor.summary.completedTasks,
        previous: previousPeriodMetrics.summary.completedTasks,
      },
      {
        metric: 'Time Accuracy',
        current: currentContractor.timeTracking.estimateAccuracy,
        previous: previousPeriodMetrics.timeTracking.estimateAccuracy,
      },
    ];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">Metrics Comparison</TabsTrigger>
          <TabsTrigger value="overall">Overall Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Comparison Type</label>
                  <Select 
                    value={comparisonType} 
                    onValueChange={(value: 'time' | 'team') => setComparisonType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select comparison type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time Comparison (Current vs Previous)</SelectItem>
                      <SelectItem value="team">Team Comparison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Metric</label>
                  <Select 
                    value={selectedMetric} 
                    onValueChange={setSelectedMetric}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {metricOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {comparisonType === 'team' && allContractors.length === 0 && (
                  <div className="flex items-end">
                    <Button 
                      onClick={handleLoadAllContractors}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Load Team Data'}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="h-80">
                <PerformanceChart
                  type="bar"
                  data={comparisonData}
                  dataKeys={['value']}
                  xAxisKey="name"
                  title={metricOptions.find(m => m.value === selectedMetric)?.label || ''}
                  height={300}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Overall Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {previousPeriodMetrics ? (
                <div className="h-80">
                  <PerformanceChart
                    type="radar"
                    data={generateRadarData()}
                    dataKeys={['current', 'previous']}
                    xAxisKey="metric"
                    title="Current vs Previous Period"
                    height={300}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No previous period data available for comparison
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractorComparison;
