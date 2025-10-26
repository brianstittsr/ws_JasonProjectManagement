import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ReportScheduleConfig } from '../../services/reportScheduler';

interface ReportScheduleFormProps {
  scheduleConfig: ReportScheduleConfig;
  onScheduleChange: (config: ReportScheduleConfig) => void;
}

const ReportScheduleForm: React.FC<ReportScheduleFormProps> = ({ 
  scheduleConfig, 
  onScheduleChange 
}) => {
  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'monthly') => {
    let days: string[] = [];
    
    switch (frequency) {
      case 'daily':
        days = ['1', '2', '3', '4', '5']; // Monday to Friday
        break;
      case 'weekly':
        days = ['1']; // Monday
        break;
      case 'monthly':
        days = ['1']; // 1st of month
        break;
    }
    
    onScheduleChange({
      ...scheduleConfig,
      frequency,
      days
    });
  };

  const handleDayToggle = (day: string) => {
    const currentDays = [...scheduleConfig.days];
    
    if (currentDays.includes(day)) {
      onScheduleChange({
        ...scheduleConfig,
        days: currentDays.filter(d => d !== day)
      });
    } else {
      onScheduleChange({
        ...scheduleConfig,
        days: [...currentDays, day].sort()
      });
    }
  };

  const renderDaySelectors = () => {
    switch (scheduleConfig.frequency) {
      case 'weekly':
        return (
          <div className="grid grid-cols-7 gap-2">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <Checkbox 
                  id={`day-${index}`}
                  checked={scheduleConfig.days.includes(index.toString())}
                  onCheckedChange={() => handleDayToggle(index.toString())}
                />
                <Label htmlFor={`day-${index}`} className="text-xs mt-1">
                  {day.substring(0, 3)}
                </Label>
              </div>
            ))}
          </div>
        );
      
      case 'monthly':
        return (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <div key={day} className="flex flex-col items-center">
                <Checkbox 
                  id={`day-${day}`}
                  checked={scheduleConfig.days.includes(day.toString())}
                  onCheckedChange={() => handleDayToggle(day.toString())}
                />
                <Label htmlFor={`day-${day}`} className="text-xs mt-1">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency">Frequency</Label>
          <Select 
            value={scheduleConfig.frequency}
            onValueChange={(value) => handleFrequencyChange(value as 'daily' | 'weekly' | 'monthly')}
          >
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="time">Time (24h)</Label>
          <Input 
            id="time"
            type="time"
            value={scheduleConfig.time}
            onChange={(e) => onScheduleChange({
              ...scheduleConfig,
              time: e.target.value
            })}
          />
        </div>
      </div>
      
      {scheduleConfig.frequency === 'daily' && (
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="grid grid-cols-7 gap-2">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <Checkbox 
                  id={`day-${index}`}
                  checked={scheduleConfig.days.includes(index.toString())}
                  onCheckedChange={() => handleDayToggle(index.toString())}
                />
                <Label htmlFor={`day-${index}`} className="text-xs mt-1">
                  {day.substring(0, 3)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scheduleConfig.frequency !== 'daily' && renderDaySelectors()}
    </div>
  );
};

export default ReportScheduleForm;
