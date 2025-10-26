/**
 * Service Configuration
 * 
 * This file provides configuration and error handling for external services.
 * It helps ensure the application remains functional even when services are unavailable.
 */

import axios from 'axios';

// Service status tracking
interface ServiceStatus {
  available: boolean;
  lastChecked: Date | null;
  error: string | null;
}

// Service configuration
export interface ServiceConfig {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

// Default configurations
const defaultConfigs: Record<string, ServiceConfig> = {
  archon: {
    enabled: true,
    baseUrl: 'http://localhost:8000',
  },
  whatsapp: {
    enabled: true,
    apiKey: '',
  },
  openai: {
    enabled: true,
    apiKey: '',
  },
  zoom: {
    enabled: true,
    apiKey: '',
    apiSecret: '',
  },
  jira: {
    enabled: true,
    baseUrl: '',
    username: '',
    apiToken: '',
  },
  fireflies: {
    enabled: true,
    apiKey: '',
  },
  readai: {
    enabled: true,
    apiKey: '',
    orgId: '',
  },
  pydio: {
    enabled: true,
    baseUrl: '',
    username: '',
    password: '',
    workspace: 'default',
  },
};

// Service status tracking
const serviceStatus: Record<string, ServiceStatus> = {};

/**
 * Initialize service status tracking
 */
Object.keys(defaultConfigs).forEach((service) => {
  serviceStatus[service] = {
    available: false,
    lastChecked: null,
    error: null,
  };
});

/**
 * Get configuration for a service
 * @param serviceName Service name
 * @returns Service configuration
 */
export function getServiceConfig(serviceName: string): ServiceConfig {
  // Try to get from localStorage
  try {
    const storedConfig = localStorage.getItem(`service_${serviceName}`);
    if (storedConfig) {
      return { ...defaultConfigs[serviceName], ...JSON.parse(storedConfig) };
    }
  } catch (error) {
    console.error(`Error retrieving ${serviceName} config from localStorage:`, error);
  }

  // Return default config
  return { ...defaultConfigs[serviceName] };
}

/**
 * Save configuration for a service
 * @param serviceName Service name
 * @param config Service configuration
 */
export function saveServiceConfig(serviceName: string, config: ServiceConfig): void {
  try {
    localStorage.setItem(`service_${serviceName}`, JSON.stringify(config));
  } catch (error) {
    console.error(`Error saving ${serviceName} config to localStorage:`, error);
  }
}

/**
 * Check if a service is configured properly
 * @param serviceName Service name
 * @returns Boolean indicating if service is configured
 */
export function isServiceConfigured(serviceName: string): boolean {
  const config = getServiceConfig(serviceName);
  
  if (!config.enabled) {
    return false;
  }
  
  switch (serviceName) {
    case 'archon':
      return !!config.baseUrl;
    case 'whatsapp':
      return !!config.apiKey;
    case 'openai':
      return !!config.apiKey;
    case 'zoom':
      return !!config.apiKey && !!config.apiSecret;
    case 'jira':
      return !!config.baseUrl && !!config.username && !!config.apiToken;
    case 'fireflies':
      return !!config.apiKey;
    case 'readai':
      return !!config.apiKey && !!config.orgId;
    case 'pydio':
      return !!config.baseUrl && !!config.username && !!config.password;
    default:
      return false;
  }
}

/**
 * Check if a service is available (configured and responding)
 * @param serviceName Service name
 * @returns Promise resolving to boolean indicating if service is available
 */
export async function checkServiceAvailability(serviceName: string): Promise<boolean> {
  // If not configured, service is not available
  if (!isServiceConfigured(serviceName)) {
    serviceStatus[serviceName] = {
      available: false,
      lastChecked: new Date(),
      error: 'Service not configured',
    };
    return false;
  }
  
  try {
    const config = getServiceConfig(serviceName);
    
    switch (serviceName) {
      case 'archon':
        try {
          await axios.get(`${config.baseUrl}/api/health`);
          serviceStatus[serviceName] = {
            available: true,
            lastChecked: new Date(),
            error: null,
          };
          return true;
        } catch (error) {
          serviceStatus[serviceName] = {
            available: false,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          console.warn(`Failed to connect to Archon: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return false;
        }
      
      // For other services, we'll assume they're available if configured
      // In a real app, you would add actual health checks for each service
      default:
        serviceStatus[serviceName] = {
          available: true,
          lastChecked: new Date(),
          error: null,
        };
        return true;
    }
  } catch (error) {
    serviceStatus[serviceName] = {
      available: false,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return false;
  }
}

/**
 * Get current status of a service
 * @param serviceName Service name
 * @returns Service status
 */
export function getServiceStatus(serviceName: string): ServiceStatus {
  return serviceStatus[serviceName] || {
    available: false,
    lastChecked: null,
    error: 'Unknown service',
  };
}

/**
 * Handle service errors gracefully
 * @param serviceName Service name
 * @param error Error object
 * @param fallbackData Optional fallback data
 * @returns Fallback data or null
 */
export function handleServiceError<T>(serviceName: string, error: unknown, fallbackData: T): T {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  // Update service status
  serviceStatus[serviceName] = {
    available: false,
    lastChecked: new Date(),
    error: errorMessage,
  };
  
  // Log error (but not in production)
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`${serviceName} service error:`, error);
  }
  
  // Return fallback data
  return fallbackData;
}

/**
 * Get mock data for development when services are unavailable
 * @param serviceName Service name
 * @param dataType Type of data to mock
 * @returns Mock data
 */
export function getMockData(serviceName: string, dataType: string): any {
  // Simple mock data for development
  const mockData: Record<string, Record<string, any>> = {
    archon: {
      knowledgeBase: {
        sources: [
          { id: 'mock-1', name: 'Mock Source 1', documentCount: 5 },
          { id: 'mock-2', name: 'Mock Source 2', documentCount: 3 },
        ],
        searchResults: [
          { id: 'result-1', title: 'Mock Result 1', content: 'This is mock content for development.' },
          { id: 'result-2', title: 'Mock Result 2', content: 'Another mock result for testing.' },
        ],
      },
    },
    whatsapp: {
      messages: [
        { id: 'msg-1', from: '1234567890', text: { body: 'Mock WhatsApp message' }, timestamp: new Date().toISOString() },
      ],
    },
    jira: {
      issues: [
        { id: 'MOCK-1', key: 'MOCK-1', summary: 'Mock Jira issue', status: { name: 'To Do' } },
        { id: 'MOCK-2', key: 'MOCK-2', summary: 'Another mock issue', status: { name: 'In Progress' } },
      ],
    },
  };
  
  return mockData[serviceName]?.[dataType] || null;
}

/**
 * Create an API client with error handling
 * @param serviceName Service name
 * @param baseURL Base URL for the API
 * @returns Axios instance with error handling
 */
export function createApiClient(serviceName: string, baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 10000,
  });
  
  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      handleServiceError(serviceName, error, null);
      return Promise.reject(error);
    }
  );
  
  return client;
}
