import React from 'react';
import PerformanceChart from './PerformanceChart';
import { ContractorMetrics } from '../../services/contractorMetrics';

interface ContractorPerformanceChartsProps {
  metrics: ContractorMetrics;
}

const ContractorPerformanceCharts: React.FC<ContractorPerformanceChartsProps> = ({ metrics }) => {
  // Prepare data for task breakdown chart
  const taskBreakdownData = [
    { name: 'By Status', ...metrics.taskBreakdown.byStatus },
    { name: 'By Priority', ...metrics.taskBreakdown.byPriority },
    { name: 'By Type', ...metrics.taskBreakdown.byType },
  ];

  // Prepare data for time tracking chart
  const timeTrackingData = Object.entries(metrics.timeTracking.timeSpentByProject).map(([project, time]) => ({
    name: project,
    value: time / 3600, // Convert seconds to hours
  }));

  // Prepare data for velocity trend chart
  const velocityTrendData = metrics.summary.velocityTrend.map((value, index) => ({
    name: `Week ${index + 1}`,
    tasks: value,
  }));

  // Prepare data for quality metrics chart
  const qualityData = [
    {
      name: 'Quality Metrics',
      'Bugs Fixed': metrics.quality.bugsFixed,
      'Bugs Introduced': metrics.quality.bugsIntroduced,
      'Reopened Tasks': metrics.quality.reopenedTasks,
    },
  ];

  // Prepare data for radar chart
  const radarData = [
    {
      metric: 'Productivity',
      value: metrics.summary.productivityScore,
      fullMark: 100,
    },
    {
      metric: 'Quality',
      value: metrics.summary.qualityScore,
      fullMark: 100,
    },
    {
      metric: 'On-Time',
      value: metrics.summary.onTimeDelivery,
      fullMark: 100,
    },
    {
      metric: 'Estimate Accuracy',
      value: metrics.timeTracking.estimateAccuracy,
      fullMark: 100,
    },
    {
      metric: 'Completion Rate',
      value: (metrics.summary.completedTasks / Math.max(1, metrics.summary.totalTasks)) * 100,
      fullMark: 100,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <PerformanceChart
            type="radar"
            title="Performance Overview"
            data={radarData}
            dataKeys={['value']}
            xAxisKey="metric"
            height={300}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <PerformanceChart
            type="line"
            title="Velocity Trend"
            data={velocityTrendData}
            dataKeys={['tasks']}
            xAxisKey="name"
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <PerformanceChart
            type="pie"
            title="Time Allocation by Project"
            data={timeTrackingData}
            dataKeys={['value']}
            xAxisKey="name"
            height={300}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <PerformanceChart
            type="bar"
            title="Task Breakdown"
            data={taskBreakdownData}
            dataKeys={Object.keys(metrics.taskBreakdown.byStatus)}
            xAxisKey="name"
            height={300}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <PerformanceChart
          type="bar"
          title="Quality Metrics"
          data={qualityData}
          dataKeys={['Bugs Fixed', 'Bugs Introduced', 'Reopened Tasks']}
          xAxisKey="name"
          height={300}
        />
      </div>
    </div>
  );
};

export default ContractorPerformanceCharts;
