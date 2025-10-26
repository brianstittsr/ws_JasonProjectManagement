import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import EmailArchonAutomation from '../components/admin/EmailArchonAutomation';
import { GmailConfig } from '../services/gmail';

const EmailArchonPage: React.FC = () => {
  const [gmailConfig, setGmailConfig] = useState<GmailConfig>({ clientId: '', clientSecret: '', refreshToken: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Gmail configuration from localStorage
    const loadConfig = () => {
      try {
        const storedConfig = localStorage.getItem('gmailConfig');
        if (storedConfig) {
          setGmailConfig(JSON.parse(storedConfig));
        } else {
          setError('Gmail configuration not found. Please configure Gmail in the API settings.');
        }
      } catch (err) {
        console.error('Error loading Gmail configuration:', err);
        setError('Error loading Gmail configuration. Please check the console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSaveConfig = (config: GmailConfig) => {
    try {
      localStorage.setItem('gmailConfig', JSON.stringify(config));
      setGmailConfig(config);
      setError(null);
    } catch (err) {
      console.error('Error saving Gmail configuration:', err);
      setError('Error saving Gmail configuration. Please check the console for details.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.href = '/admin/api-config'}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Go to API Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!gmailConfig.clientId || !gmailConfig.clientSecret || !gmailConfig.refreshToken) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Gmail Configuration Required</h3>
              <p className="text-sm text-yellow-700 mt-2">
                Please configure your Gmail credentials to use the Email to Archon automation.
              </p>
              <div className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client ID</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Google OAuth Client ID"
                      value={gmailConfig.clientId}
                      onChange={(e) => setGmailConfig({
                        ...gmailConfig,
                        clientId: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                    <input
                      type="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Google OAuth Client Secret"
                      value={gmailConfig.clientSecret}
                      onChange={(e) => setGmailConfig({
                        ...gmailConfig,
                        clientSecret: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Refresh Token</label>
                    <input
                      type="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Google OAuth Refresh Token"
                      value={gmailConfig.refreshToken}
                      onChange={(e) => setGmailConfig({
                        ...gmailConfig,
                        refreshToken: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSaveConfig(gmailConfig)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <EmailArchonAutomation gmailConfig={gmailConfig} />;
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Email to Archon Automation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure and monitor automatic extraction of emails to Archon knowledge base with "resbyte" tag.
          </p>
        </div>

        {renderContent()}
      </div>
    </AdminLayout>
  );
};

export default EmailArchonPage;
