import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface DiagramComponent {
  id: string;
  type: string;
  name: string;
  description?: string;
  properties?: Record<string, any>;
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
}

export interface DiagramConnection {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  properties?: Record<string, any>;
}

export interface ArchitectureDiagram {
  id: string;
  name: string;
  description?: string;
  components: DiagramComponent[];
  connections: DiagramConnection[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    source?: string;
    sourceType?: string;
    awsRegion?: string;
    validationStatus?: 'pending' | 'valid' | 'invalid' | 'partially_valid';
    validationErrors?: Array<{
      componentId: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
  };
}

export interface DiagramValidationResult {
  isValid: boolean;
  errors: Array<{
    componentId: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  awsResources?: Record<string, any>;
}

export class DiagramProcessingService {
  private diagrams: ArchitectureDiagram[] = [];
  private fileStorage: Record<string, { data: ArrayBuffer; type: string; name: string }> = {};

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Load diagrams from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const diagramsJson = localStorage.getItem('architecture-diagrams');
      if (diagramsJson) {
        this.diagrams = JSON.parse(diagramsJson);
      }
      // We can't store binary data in localStorage, so file storage is session-only
    } catch (error) {
      console.error('Error loading diagrams from localStorage:', error);
    }
  }

  /**
   * Save diagrams to localStorage
   */
  private saveDiagramsToLocalStorage(): void {
    try {
      localStorage.setItem('architecture-diagrams', JSON.stringify(this.diagrams));
    } catch (error) {
      console.error('Error saving diagrams to localStorage:', error);
    }
  }

  /**
   * Get all diagrams
   */
  getDiagrams(): ArchitectureDiagram[] {
    return [...this.diagrams];
  }

  /**
   * Get a specific diagram by ID
   */
  getDiagramById(id: string): ArchitectureDiagram | undefined {
    return this.diagrams.find(diagram => diagram.id === id);
  }

  /**
   * Create a new diagram
   */
  createDiagram(diagram: Omit<ArchitectureDiagram, 'id' | 'metadata'>): ArchitectureDiagram {
    const newDiagram: ArchitectureDiagram = {
      ...diagram,
      id: `diagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        validationStatus: 'pending',
      },
    };

    this.diagrams.push(newDiagram);
    this.saveDiagramsToLocalStorage();
    return newDiagram;
  }

  /**
   * Update an existing diagram
   */
  updateDiagram(id: string, updates: Partial<ArchitectureDiagram>): ArchitectureDiagram | null {
    const index = this.diagrams.findIndex(diagram => diagram.id === id);
    if (index === -1) return null;

    const updatedDiagram = {
      ...this.diagrams[index],
      ...updates,
      metadata: {
        ...this.diagrams[index].metadata,
        ...(updates.metadata || {}),
        updatedAt: new Date().toISOString(),
      },
    };

    this.diagrams[index] = updatedDiagram;
    this.saveDiagramsToLocalStorage();
    return updatedDiagram;
  }

  /**
   * Delete a diagram
   */
  deleteDiagram(id: string): boolean {
    const initialLength = this.diagrams.length;
    this.diagrams = this.diagrams.filter(diagram => diagram.id !== id);
    
    if (this.diagrams.length !== initialLength) {
      this.saveDiagramsToLocalStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Upload a diagram file
   */
  async uploadDiagramFile(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      this.fileStorage[fileId] = {
        data: buffer,
        type: file.type,
        name: file.name,
      };
      
      return fileId;
    } catch (error) {
      console.error('Error uploading diagram file:', error);
      throw new Error('Failed to upload diagram file');
    }
  }

  /**
   * Get a diagram file
   */
  getDiagramFile(fileId: string): { data: ArrayBuffer; type: string; name: string } | null {
    return this.fileStorage[fileId] || null;
  }

  /**
   * Process a PDF diagram and convert it to a JSON architecture diagram
   */
  async processDiagramPdf(fileId: string, name: string, description?: string): Promise<ArchitectureDiagram> {
    const file = this.getDiagramFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    try {
      // In a real implementation, this would use a PDF processing library and AI vision model
      // For now, we'll simulate the extraction with a delay and mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock architecture diagram based on common AWS components
      const mockDiagram: Omit<ArchitectureDiagram, 'id' | 'metadata'> = {
        name,
        description,
        components: [
          {
            id: 'vpc-1',
            type: 'aws:vpc',
            name: 'Main VPC',
            description: 'Main Virtual Private Cloud',
            properties: {
              cidrBlock: '10.0.0.0/16',
              region: 'us-east-1',
            },
            position: { x: 100, y: 100 },
            size: { width: 400, height: 300 },
          },
          {
            id: 'subnet-public-1',
            type: 'aws:subnet',
            name: 'Public Subnet 1',
            properties: {
              cidrBlock: '10.0.1.0/24',
              availabilityZone: 'us-east-1a',
              isPublic: true,
            },
            position: { x: 150, y: 150 },
            size: { width: 150, height: 100 },
          },
          {
            id: 'subnet-private-1',
            type: 'aws:subnet',
            name: 'Private Subnet 1',
            properties: {
              cidrBlock: '10.0.2.0/24',
              availabilityZone: 'us-east-1a',
              isPublic: false,
            },
            position: { x: 320, y: 150 },
            size: { width: 150, height: 100 },
          },
          {
            id: 'ec2-web',
            type: 'aws:ec2',
            name: 'Web Server',
            properties: {
              instanceType: 't3.medium',
              ami: 'ami-12345678',
            },
            position: { x: 170, y: 180 },
            size: { width: 80, height: 40 },
          },
          {
            id: 'rds-db',
            type: 'aws:rds',
            name: 'Database',
            properties: {
              engine: 'postgres',
              instanceType: 'db.t3.medium',
            },
            position: { x: 350, y: 180 },
            size: { width: 80, height: 40 },
          },
          {
            id: 'elb-1',
            type: 'aws:elb',
            name: 'Load Balancer',
            properties: {
              type: 'application',
              isPublic: true,
            },
            position: { x: 170, y: 120 },
            size: { width: 80, height: 30 },
          },
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'elb-1',
            target: 'ec2-web',
            type: 'network',
            label: 'HTTP/HTTPS',
          },
          {
            id: 'conn-2',
            source: 'ec2-web',
            target: 'rds-db',
            type: 'network',
            label: 'PostgreSQL',
          },
        ],
      };
      
      // Create the diagram
      return this.createDiagram(mockDiagram);
    } catch (error) {
      console.error('Error processing diagram PDF:', error);
      throw new Error('Failed to process diagram PDF');
    }
  }

  /**
   * Validate a diagram against AWS architecture
   */
  async validateWithAws(diagramId: string, region: string): Promise<DiagramValidationResult> {
    const diagram = this.getDiagramById(diagramId);
    if (!diagram) {
      throw new Error('Diagram not found');
    }

    try {
      // In a real implementation, this would use the AWS CLI or SDK
      // For now, we'll simulate the validation with a delay and mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AWS CLI command execution
      // In a real implementation, you would use AWS SDK or execute AWS CLI commands
      const mockAwsResources = {
        vpcs: [
          {
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.0.0/16',
            State: 'available',
          }
        ],
        subnets: [
          {
            SubnetId: 'subnet-12345678',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
          {
            SubnetId: 'subnet-87654321',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24', // Different from diagram
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          }
        ],
        instances: [
          {
            InstanceId: 'i-12345678',
            InstanceType: 't3.large', // Different from diagram
            State: { Name: 'running' },
            SubnetId: 'subnet-12345678',
          }
        ],
        dbInstances: [
          {
            DBInstanceIdentifier: 'database-1',
            Engine: 'mysql', // Different from diagram
            DBInstanceClass: 'db.t3.medium',
            DBSubnetGroup: { Subnets: [{ SubnetIdentifier: 'subnet-87654321' }] },
          }
        ],
        loadBalancers: [
          {
            LoadBalancerName: 'my-load-balancer',
            Type: 'application',
            Scheme: 'internet-facing',
          }
        ]
      };
      
      // Simulate validation errors
      const errors = [
        {
          componentId: 'subnet-private-1',
          message: 'CIDR block mismatch: Expected 10.0.2.0/24, found 10.0.3.0/24',
          severity: 'warning' as const,
        },
        {
          componentId: 'ec2-web',
          message: 'Instance type mismatch: Expected t3.medium, found t3.large',
          severity: 'info' as const,
        },
        {
          componentId: 'rds-db',
          message: 'Database engine mismatch: Expected postgres, found mysql',
          severity: 'error' as const,
        },
      ];
      
      // Update the diagram with validation results
      const diagram = this.getDiagramById(diagramId);
      if (diagram) {
        this.updateDiagram(diagramId, {
          metadata: {
            ...diagram.metadata,
            awsRegion: region,
            validationStatus: errors.some(e => e.severity === 'error') ? 'invalid' : 'partially_valid',
            validationErrors: errors,
            updatedAt: new Date().toISOString()
          }
        });
      }
      
      return {
        isValid: !errors.some(e => e.severity === 'error'),
        errors,
        awsResources: mockAwsResources,
      };
    } catch (error) {
      console.error('Error validating diagram with AWS:', error);
      
      // Update the diagram with validation failure
      const diagram = this.getDiagramById(diagramId);
      if (diagram) {
        this.updateDiagram(diagramId, {
          metadata: {
            ...diagram.metadata,
            awsRegion: region,
            validationStatus: 'invalid',
            validationErrors: [
              {
                componentId: 'diagram',
                message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
                severity: 'error',
              }
            ],
            updatedAt: new Date().toISOString()
          }
        });
      }
      
      throw new Error('Failed to validate diagram with AWS');
    }
  }

  /**
   * Enrich diagram with AWS CLI data
   */
  async enrichWithAwsCli(diagramId: string, region: string): Promise<ArchitectureDiagram> {
    const diagram = this.getDiagramById(diagramId);
    if (!diagram) {
      throw new Error('Diagram not found');
    }

    try {
      // In a real implementation, this would execute AWS CLI commands
      // For now, we'll simulate the enrichment with a delay and mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AWS CLI command execution
      // const { stdout } = await execPromise('aws ec2 describe-vpcs --region us-east-1');
      // const vpcs = JSON.parse(stdout).Vpcs;
      
      // Enrich components with additional AWS data
      const enrichedComponents = diagram.components.map(component => {
        if (component.type === 'aws:vpc') {
          return {
            ...component,
            properties: {
              ...component.properties,
              tags: [
                { Key: 'Name', Value: 'MainVPC' },
                { Key: 'Environment', Value: 'Production' },
              ],
              dhcpOptionsId: 'dopt-12345678',
              instanceTenancy: 'default',
              isDefault: false,
            }
          };
        } else if (component.type === 'aws:ec2') {
          return {
            ...component,
            properties: {
              ...component.properties,
              securityGroups: [
                { GroupId: 'sg-12345678', GroupName: 'web-server-sg' }
              ],
              keyName: 'production-key',
              launchTime: '2023-05-15T10:30:00Z',
              state: 'running',
              publicIp: '54.123.45.67',
              privateIp: '10.0.1.10',
            }
          };
        } else if (component.type === 'aws:rds') {
          return {
            ...component,
            properties: {
              ...component.properties,
              allocatedStorage: 20,
              storageType: 'gp2',
              multiAZ: true,
              publiclyAccessible: false,
              dbName: 'production',
              port: 5432,
              status: 'available',
            }
          };
        }
        return component;
      });
      
      // Update the diagram with enriched data
      const currentDiagram = this.getDiagramById(diagramId);
      if (!currentDiagram) {
        throw new Error('Diagram not found');
      }
      
      const enrichedDiagram = this.updateDiagram(diagramId, {
        components: enrichedComponents,
        metadata: {
          ...currentDiagram.metadata,
          awsRegion: region,
          updatedAt: new Date().toISOString()
        }
      });
      
      return enrichedDiagram!;
    } catch (error) {
      console.error('Error enriching diagram with AWS CLI:', error);
      throw new Error('Failed to enrich diagram with AWS CLI');
    }
  }
}

// Helper function to create a DiagramProcessingService
export const createDiagramProcessingService = (): DiagramProcessingService => {
  return new DiagramProcessingService();
};
