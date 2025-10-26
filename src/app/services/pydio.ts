import axios from 'axios';
import { getServiceConfig, saveServiceConfig } from './serviceConfig';

export interface PydioConfig {
  baseUrl: string;
  username: string;
  password: string;
  workspace?: string;
}

export interface PydioFile {
  filename: string;
  filepath: string;
  size: number;
  mimeType: string;
  modificationDate: string;
  isFolder: boolean;
  hash?: string;
}

export class PydioService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private workspace: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PydioConfig) {
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
    this.username = config.username;
    this.password = config.password;
    this.workspace = config.workspace || 'default';
  }

  /**
   * Get authentication token for Pydio API
   */
  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    
    // If token is still valid, return it
    if (this.token && this.tokenExpiry > now) {
      return this.token;
    }
    
    // Otherwise, get a new token
    try {
      const response = await axios.post(
        `${this.baseUrl}api/auth/login`,
        {
          login: this.username,
          password: this.password,
        }
      );
      
      const data = response.data as { token: string; expires_in: number };
      this.token = data.token;
      this.tokenExpiry = now + (data.expires_in * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Failed to authenticate with Pydio:', error);
      throw new Error('Failed to authenticate with Pydio');
    }
  }

  /**
   * Get headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Test the Pydio connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}api/status`,
        { headers }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Pydio:', error);
      return false;
    }
  }

  /**
   * List files in a directory
   * @param path Directory path
   */
  async listFiles(path: string = '/'): Promise<PydioFile[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}api/workspace/${this.workspace}/ls`,
        {
          headers,
          params: { path }
        }
      );
      
      const data = response.data as { files: any[] };
      return data.files.map(file => ({
        filename: file.basename,
        filepath: file.path,
        size: file.size || 0,
        mimeType: file.mime || '',
        modificationDate: file.mtime || '',
        isFolder: file.is_folder || false,
        hash: file.hash,
      }));
    } catch (error) {
      console.error(`Failed to list files at ${path}:`, error);
      return [];
    }
  }

  /**
   * Upload a file
   * @param path Target directory path
   * @param file File to upload
   */
  async uploadFile(path: string, file: File): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.post(
        `${this.baseUrl}api/workspace/${this.workspace}/upload`,
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
          params: { path }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to upload file to ${path}:`, error);
      return false;
    }
  }

  /**
   * Download a file
   * @param path File path
   */
  async downloadFile(path: string): Promise<Blob | null> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}api/workspace/${this.workspace}/download`,
        {
          headers,
          params: { path },
          responseType: 'blob',
        }
      );
      
      return response.data as Blob;
    } catch (error) {
      console.error(`Failed to download file ${path}:`, error);
      return null;
    }
  }

  /**
   * Create a directory
   * @param path Parent directory path
   * @param name New directory name
   */
  async createDirectory(path: string, name: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.post(
        `${this.baseUrl}api/workspace/${this.workspace}/mkdir`,
        { name },
        {
          headers,
          params: { path }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to create directory ${name} at ${path}:`, error);
      return false;
    }
  }

  /**
   * Delete a file or directory
   * @param path Path to delete
   */
  async delete(path: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.delete(
        `${this.baseUrl}api/workspace/${this.workspace}/delete`,
        {
          headers,
          params: { path }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to delete ${path}:`, error);
      return false;
    }
  }

  /**
   * Rename a file or directory
   * @param path Current path
   * @param newName New name
   */
  async rename(path: string, newName: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.post(
        `${this.baseUrl}api/workspace/${this.workspace}/rename`,
        { name: newName },
        {
          headers,
          params: { path }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to rename ${path} to ${newName}:`, error);
      return false;
    }
  }

  /**
   * Move a file or directory
   * @param source Source path
   * @param target Target path
   */
  async move(source: string, target: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.post(
        `${this.baseUrl}api/workspace/${this.workspace}/move`,
        { target },
        {
          headers,
          params: { path: source }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to move ${source} to ${target}:`, error);
      return false;
    }
  }

  /**
   * Copy a file or directory
   * @param source Source path
   * @param target Target path
   */
  async copy(source: string, target: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.post(
        `${this.baseUrl}api/workspace/${this.workspace}/copy`,
        { target },
        {
          headers,
          params: { path: source }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to copy ${source} to ${target}:`, error);
      return false;
    }
  }

  /**
   * Search for files
   * @param query Search query
   */
  async search(query: string): Promise<PydioFile[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}api/workspace/${this.workspace}/search`,
        {
          headers,
          params: { query }
        }
      );
      
      const data = response.data as { results: any[] };
      return data.results.map(file => ({
        filename: file.basename,
        filepath: file.path,
        size: file.size || 0,
        mimeType: file.mime || '',
        modificationDate: file.mtime || '',
        isFolder: file.is_folder || false,
        hash: file.hash,
      }));
    } catch (error) {
      console.error(`Failed to search for ${query}:`, error);
      return [];
    }
  }

  /**
   * Get file metadata
   * @param path File path
   */
  async getFileInfo(path: string): Promise<PydioFile | null> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}api/workspace/${this.workspace}/stat`,
        {
          headers,
          params: { path }
        }
      );
      
      const file = response.data as any;
      return {
        filename: file.basename,
        filepath: file.path,
        size: file.size || 0,
        mimeType: file.mime || '',
        modificationDate: file.mtime || '',
        isFolder: file.is_folder || false,
        hash: file.hash,
      };
    } catch (error) {
      console.error(`Failed to get info for ${path}:`, error);
      return null;
    }
  }
}

// Helper function to create a Pydio service from stored config
export const createPydioService = async (): Promise<PydioService | null> => {
  try {
    // Get configuration from service config
    const serviceConfig = getServiceConfig('pydio');
    
    // Check if service is configured
    if (!serviceConfig.enabled || !serviceConfig.baseUrl || !serviceConfig.username || !serviceConfig.password) {
      console.warn('Pydio service is not configured');
      return null;
    }
    
    // Create config for Pydio service
    const config: PydioConfig = {
      baseUrl: serviceConfig.baseUrl,
      username: serviceConfig.username,
      password: serviceConfig.password,
      workspace: serviceConfig.workspace,
    };
    
    // Create service instance
    const pydioService = new PydioService(config);
    
    // Test connection
    const isConnected = await pydioService.testConnection();
    if (!isConnected) {
      console.warn('Failed to connect to Pydio');
      return null;
    }
    
    return pydioService;
  } catch (error) {
    console.error('Failed to create Pydio service:', error);
    return null;
  }
};
