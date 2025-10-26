import { PydioService } from './pydio';

/**
 * Interface for folder structure
 */
export interface FolderStructure {
  folders: FolderNode[];
}

/**
 * Interface for a folder node in the structure
 */
export interface FolderNode {
  path: string;
  children?: FolderNode[];
}

/**
 * Service for creating and managing folder structures in Pydio
 */
export class PydioFolderStructureService {
  private pydioService: PydioService;
  
  constructor(pydioService: PydioService) {
    this.pydioService = pydioService;
  }
  
  /**
   * Create a folder structure in Pydio
   * @param structure The folder structure to create
   * @returns Promise resolving to success status
   */
  async createFolderStructure(structure: FolderStructure): Promise<{ 
    success: boolean; 
    created: number; 
    failed: number; 
    errors: string[] 
  }> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];
    
    try {
      // Process each folder in the structure
      for (const folder of structure.folders) {
        const result = await this.processFolderNode(folder);
        created += result.created;
        failed += result.failed;
        errors.push(...result.errors);
      }
      
      return {
        success: failed === 0,
        created,
        failed,
        errors
      };
    } catch (error) {
      return {
        success: false,
        created,
        failed: failed + 1,
        errors: [...errors, `General error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  
  /**
   * Process a folder node and its children recursively
   * @param node The folder node to process
   * @returns Promise resolving to creation statistics
   */
  private async processFolderNode(node: FolderNode): Promise<{ 
    created: number; 
    failed: number; 
    errors: string[] 
  }> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];
    
    try {
      // Create the current folder
      const folderCreated = await this.createFolder(node.path);
      
      if (folderCreated) {
        created++;
      } else {
        failed++;
        errors.push(`Failed to create folder: ${node.path}`);
      }
      
      // Process children if they exist
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const result = await this.processFolderNode(child);
          created += result.created;
          failed += result.failed;
          errors.push(...result.errors);
        }
      }
    } catch (error) {
      failed++;
      errors.push(`Error processing ${node.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return { created, failed, errors };
  }
  
  /**
   * Create a single folder in Pydio
   * @param path The folder path to create
   * @returns Promise resolving to boolean indicating success
   */
  private async createFolder(path: string): Promise<boolean> {
    try {
      // Check if folder already exists
      const exists = await this.folderExists(path);
      
      if (exists) {
        console.log(`Folder already exists: ${path}`);
        return true;
      }
      
      // Create the folder
      const result = await this.pydioService.createDirectory(
        this.getParentPath(path),
        this.getFolderName(path)
      );
      
      return result;
    } catch (error) {
      console.error(`Error creating folder ${path}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a folder exists in Pydio
   * @param path The folder path to check
   * @returns Promise resolving to boolean indicating if folder exists
   */
  private async folderExists(path: string): Promise<boolean> {
    try {
      const fileInfo = await this.pydioService.getFileInfo(path);
      return fileInfo !== null && fileInfo.isFolder;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get the parent path of a folder
   * @param path The folder path
   * @returns The parent path
   */
  private getParentPath(path: string): string {
    const parts = path.split('/').filter(p => p);
    
    if (parts.length <= 1) {
      return '/';
    }
    
    parts.pop();
    return '/' + parts.join('/');
  }
  
  /**
   * Get the folder name from a path
   * @param path The folder path
   * @returns The folder name
   */
  private getFolderName(path: string): string {
    const parts = path.split('/').filter(p => p);
    
    if (parts.length === 0) {
      return '';
    }
    
    return parts[parts.length - 1];
  }
  
  /**
   * Load a folder structure from a JSON file
   * @param jsonStructure The JSON structure as a string
   * @returns The parsed folder structure
   */
  static parseFolderStructure(jsonStructure: string): FolderStructure {
    try {
      return JSON.parse(jsonStructure) as FolderStructure;
    } catch (error) {
      throw new Error(`Invalid folder structure JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Create a PydioFolderStructureService instance
 * @param pydioService The Pydio service instance
 * @returns A new PydioFolderStructureService instance
 */
export const createPydioFolderStructureService = (
  pydioService: PydioService
): PydioFolderStructureService => {
  return new PydioFolderStructureService(pydioService);
};
