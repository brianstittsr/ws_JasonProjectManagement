import React, { useState, useEffect } from 'react';
import { 
  EmailArchonAutomationService, 
  EmailArchonAutomationConfig,
  EmailAutomationRun
} from '../../services/emailArchonAutomation';
import { GmailConfig } from '../../services/gmail';

interface EmailArchonAutomationProps {
  gmailConfig: GmailConfig;
  initialConfig?: Partial<EmailArchonAutomationConfig>;
}

const EmailArchonAutomation: React.FC<EmailArchonAutomationProps> = ({ 
  gmailConfig,
  initialConfig = {}
}) => {
  const [service, setService] = useState<EmailArchonAutomationService | null>(null);
  const [config, setConfig] = useState<EmailArchonAutomationConfig>({
    checkInterval: 60, // hourly
    maxEmailsToProcess: 20,
    labelProcessedEmails: true,
    processedLabel: 'Archon-Processed',
    searchQuery: 'is:unread',
    enabled: false,
    includeAttachments: true,
    archonTags: ['email', 'resbyte'],
    ...initialConfig
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<EmailAutomationRun | null>(null);
  const [runHistory, setRunHistory] = useState<EmailAutomationRun[]>([]);
  const [activeTab, setActiveTab] = useState('config');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        const { createEmailArchonAutomationService } = await import('../../services/emailArchonAutomation');
        const newService = await createEmailArchonAutomationService(gmailConfig, config);
        
        if (newService) {
          setService(newService);
          setIsRunning(newService.isRunning());
          setCurrentRun(newService.getCurrentRun());
          setRunHistory(newService.getRunHistory());
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Failed to initialize Email to Archon automation service'
          });
        }
      } catch (error) {
        console.error('Error initializing service:', error);
        setStatusMessage({
          type: 'error',
          text: `Error initializing service: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    };
    
    initService();
  }, [gmailConfig]);

  // Update status periodically
  useEffect(() => {
    if (!service) return;
    
    const interval = setInterval(() => {
      setIsRunning(service.isRunning());
      setCurrentRun(service.getCurrentRun());
      setRunHistory(service.getRunHistory());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [service]);

  const handleConfigChange = (field: keyof EmailArchonAutomationConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    if (service) {
      service.updateConfig({ [field]: value });
    }
  };

  const handleStartStop = async () => {
    if (!service) return;
    
    if (isRunning) {
      const stopped = service.stop();
      if (stopped) {
        setIsRunning(false);
        setStatusMessage({
          type: 'info',
          text: 'Email to Archon automation stopped'
        });
      }
    } else {
      const result = await service.start();
      if (result.success) {
        setIsRunning(true);
        setStatusMessage({
          type: 'success',
          text: result.message || 'Email to Archon automation started'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Failed to start Email to Archon automation'
        });
      }
    }
  };

  const handleManualRun = async () => {
    if (!service) return;
    
    try {
      setStatusMessage({
        type: 'info',
        text: 'Running Email to Archon automation...'
      });
      
      const run = await service.runAutomation();
      
      setCurrentRun(run);
      setRunHistory(service.getRunHistory());
      
      setStatusMessage({
        type: 'success',
        text: `Automation completed: ${run.emailsProcessed} emails processed`
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: `Error running automation: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  const renderConfigTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Enable Automation</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                  config.enabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              ></label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check Interval (minutes)</label>
            <input
              type="number"
              value={config.checkInterval}
              onChange={(e) => handleConfigChange('checkInterval', parseInt(e.target.value) || 60)}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              How often to check for new emails (in minutes). Set to 60 for hourly checks.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Emails to Process</label>
            <input
              type="number"
              value={config.maxEmailsToProcess}
              onChange={(e) => handleConfigChange('maxEmailsToProcess', parseInt(e.target.value) || 10)}
              min="1"
              max="100"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Search Query</label>
            <input
              type="text"
              value={config.searchQuery}
              onChange={(e) => handleConfigChange('searchQuery', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="is:unread"
            />
            <p className="mt-1 text-sm text-gray-500">
              Gmail search query to find emails to process. Use Gmail search operators.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Label Processed Emails</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                checked={config.labelProcessedEmails}
                onChange={(e) => handleConfigChange('labelProcessedEmails', e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                  config.labelProcessedEmails ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              ></label>
            </div>
          </div>

          {config.labelProcessedEmails && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processed Label</label>
              <input
                type="text"
                value={config.processedLabel}
                onChange={(e) => handleConfigChange('processedLabel', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Include Attachments</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                checked={config.includeAttachments}
                onChange={(e) => handleConfigChange('includeAttachments', e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                  config.includeAttachments ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              ></label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archon Tags</label>
            <input
              type="text"
              value={config.archonTags.join(', ')}
              onChange={(e) => handleConfigChange('archonTags', e.target.value.split(',').map(tag => tag.trim()))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Tags to add to emails stored in Archon (comma separated). Make sure to include "resbyte" tag.
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleStartStop}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRunning ? 'Stop Automation' : 'Start Automation'}
        </button>
        <button
          onClick={handleManualRun}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-md text-white font-medium"
        >
          Run Now
        </button>
      </div>
    </div>
  );

  const renderStatusTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Status</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-32">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-32">Check Interval:</span>
            <span>{config.checkInterval} minutes</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-32">Search Query:</span>
            <span>{config.searchQuery}</span>
          </div>
        </div>
      </div>

      {currentRun && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Run</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-32">Start Time:</span>
              <span>{new Date(currentRun.startTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-32">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentRun.status === 'running' ? 'bg-blue-100 text-blue-800' :
                currentRun.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentRun.status.charAt(0).toUpperCase() + currentRun.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-32">Emails Processed:</span>
              <span>{currentRun.emailsProcessed}</span>
            </div>
            {currentRun.endTime && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 w-32">End Time:</span>
                <span>{new Date(currentRun.endTime).toLocaleString()}</span>
              </div>
            )}
            {currentRun.errors.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Errors:</span>
                <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                  {currentRun.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={handleStartStop}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRunning ? 'Stop Automation' : 'Start Automation'}
        </button>
        <button
          onClick={handleManualRun}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-md text-white font-medium"
        >
          Run Now
        </button>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Run History</h3>
        {runHistory.length === 0 ? (
          <p className="text-gray-500">No runs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emails Processed
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runHistory.map((run) => {
                  const startTime = new Date(run.startTime);
                  const endTime = run.endTime ? new Date(run.endTime) : new Date();
                  const durationMs = endTime.getTime() - startTime.getTime();
                  const durationSec = Math.floor(durationMs / 1000);
                  const minutes = Math.floor(durationSec / 60);
                  const seconds = durationSec % 60;
                  
                  return (
                    <tr key={run.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startTime.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          run.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.emailsProcessed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {minutes}m {seconds}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-md ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-800' :
          statusMessage.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {statusMessage.type === 'success' && (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {statusMessage.type === 'error' && (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {statusMessage.type === 'info' && (
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{statusMessage.text}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setStatusMessage(null)}
                  className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && renderConfigTab()}
      {activeTab === 'status' && renderStatusTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </div>
  );
};

export default EmailArchonAutomation;
