import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BarChart2, 
  TrendingUp, 
  Award, 
  Calendar,
  Activity
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  trendLabel,
  color = 'default',
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getTrendClasses = () => {
    if (!trend) return '';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingUp className="h-4 w-4 transform rotate-180" />
    );
  };

  return (
    <Card className={`border ${getColorClasses()}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {description && <p className="text-xs mt-1 opacity-70">{description}</p>}
          </div>
          {icon && <div className="text-lg">{icon}</div>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center mt-4 text-xs font-medium ${getTrendClasses()}`}>
            {getTrendIcon()}
            <span className="ml-1">{trend > 0 ? '+' : ''}{trend}%</span>
            {trendLabel && <span className="ml-1 opacity-70">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PerformanceMetricCardsProps {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    totalTimeSpent: number; // in seconds
    totalTimeEstimated: number; // in seconds
    onTimeDelivery: number; // percentage
    qualityScore: number; // percentage
    productivityScore: number; // calculated score
  };
  previousPeriodMetrics?: {
    totalTasks: number;
    completedTasks: number;
    onTimeDelivery: number;
    qualityScore: number;
    productivityScore: number;
  };
}

const PerformanceMetricCards: React.FC<PerformanceMetricCardsProps> = ({
  metrics,
  previousPeriodMetrics,
}) => {
  // Helper function to calculate trend percentage
  const calculateTrend = (current: number, previous?: number): number | undefined => {
    if (previous === undefined || previous === 0) return undefined;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Helper function to format time in seconds to human-readable format
  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0h';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Productivity Score"
        value={`${Math.round(metrics.productivityScore)}/100`}
        icon={<Award className="h-5 w-5" />}
        color="info"
        trend={calculateTrend(metrics.productivityScore, previousPeriodMetrics?.productivityScore)}
        trendLabel="vs last period"
      />
      
      <MetricCard
        title="Quality Score"
        value={`${Math.round(metrics.qualityScore)}%`}
        icon={<CheckCircle className="h-5 w-5" />}
        color={metrics.qualityScore >= 90 ? 'success' : metrics.qualityScore >= 70 ? 'warning' : 'danger'}
        trend={calculateTrend(metrics.qualityScore, previousPeriodMetrics?.qualityScore)}
        trendLabel="vs last period"
      />
      
      <MetricCard
        title="On-Time Delivery"
        value={`${Math.round(metrics.onTimeDelivery)}%`}
        icon={<Calendar className="h-5 w-5" />}
        color={metrics.onTimeDelivery >= 90 ? 'success' : metrics.onTimeDelivery >= 70 ? 'warning' : 'danger'}
        trend={calculateTrend(metrics.onTimeDelivery, previousPeriodMetrics?.onTimeDelivery)}
        trendLabel="vs last period"
      />
      
      <MetricCard
        title="Time Tracked"
        value={formatTime(metrics.totalTimeSpent)}
        icon={<Clock className="h-5 w-5" />}
        description={`${Math.round((metrics.totalTimeSpent / metrics.totalTimeEstimated) * 100)}% of estimate`}
        color="default"
      />
      
      <MetricCard
        title="Total Tasks"
        value={metrics.totalTasks}
        icon={<BarChart2 className="h-5 w-5" />}
        trend={calculateTrend(metrics.totalTasks, previousPeriodMetrics?.totalTasks)}
        trendLabel="vs last period"
        color="default"
      />
      
      <MetricCard
        title="Completed Tasks"
        value={metrics.completedTasks}
        icon={<CheckCircle className="h-5 w-5" />}
        description={`${Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}% completion rate`}
        trend={calculateTrend(metrics.completedTasks, previousPeriodMetrics?.completedTasks)}
        trendLabel="vs last period"
        color="success"
      />
      
      <MetricCard
        title="In Progress"
        value={metrics.inProgressTasks}
        icon={<Activity className="h-5 w-5" />}
        description={`${Math.round((metrics.inProgressTasks / metrics.totalTasks) * 100)}% of total tasks`}
        color="info"
      />
      
      <MetricCard
        title="Blocked Tasks"
        value={metrics.blockedTasks}
        icon={<AlertCircle className="h-5 w-5" />}
        description={`${Math.round((metrics.blockedTasks / metrics.totalTasks) * 100)}% of total tasks`}
        color={metrics.blockedTasks > 0 ? 'danger' : 'success'}
      />
    </div>
  );
};

export { MetricCard, PerformanceMetricCards };
