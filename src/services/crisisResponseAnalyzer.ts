import axios from 'axios';
import { WhatsAppMessage } from './whatsappIntegration';

export interface TaskEstimate {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  hourlyRate: number;
  totalCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  skills: string[];
  originalMessage: WhatsAppMessage;
}

export class CrisisResponseAnalyzer {
  private openaiApiKey: string;
  private defaultHourlyRate: number;

  constructor(openaiApiKey: string, defaultHourlyRate: number = 150) {
    this.openaiApiKey = openaiApiKey;
    this.defaultHourlyRate = defaultHourlyRate;
  }

  /**
   * Analyze a WhatsApp message to extract tasks and estimates
   */
  async analyzeMessage(message: WhatsAppMessage): Promise<TaskEstimate> {
    try {
      // In a production environment, this would call the OpenAI API
      // For this example, we'll use a simulated response based on the message content
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Extract keywords to determine task type and priority
      const text = message.text.body.toLowerCase();
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let estimatedHours = 4; // Default
      let hourlyRate = this.defaultHourlyRate;
      let skills: string[] = [];
      
      // Determine priority based on keywords
      if (text.includes('emergency') || text.includes('urgent') || text.includes('immediate') || 
          text.includes('critical') || text.includes('outage') || text.includes('down')) {
        priority = 'critical';
        estimatedHours = 6;
        hourlyRate = 200; // Higher rate for critical issues
      } else if (text.includes('important') || text.includes('security') || 
                text.includes('breach') || text.includes('performance')) {
        priority = 'high';
        estimatedHours = 5;
        hourlyRate = 175;
      } else if (text.includes('soon') || text.includes('needed')) {
        priority = 'medium';
      } else {
        priority = 'low';
        estimatedHours = 3;
      }
      
      // Determine skills needed based on keywords
      if (text.includes('server') || text.includes('infrastructure') || text.includes('network')) {
        skills.push('DevOps');
        skills.push('System Administration');
      }
      
      if (text.includes('security') || text.includes('breach') || text.includes('hack')) {
        skills.push('Security');
        skills.push('Penetration Testing');
        hourlyRate = 225; // Security specialists often charge more
      }
      
      if (text.includes('database') || text.includes('sql') || text.includes('queries')) {
        skills.push('Database Administration');
        skills.push('SQL Optimization');
      }
      
      if (text.includes('application') || text.includes('code') || text.includes('bug')) {
        skills.push('Software Development');
        skills.push('Debugging');
      }
      
      // If no specific skills were identified, add general IT skills
      if (skills.length === 0) {
        skills.push('IT Support');
        skills.push('Troubleshooting');
      }
      
      // Generate a title based on the message content
      let title = '';
      if (text.includes('server') && text.includes('outage')) {
        title = 'Server Outage Resolution';
      } else if (text.includes('security') && text.includes('breach')) {
        title = 'Security Breach Investigation';
      } else if (text.includes('database') && text.includes('performance')) {
        title = 'Database Performance Optimization';
      } else {
        // Extract first sentence or up to 50 characters for the title
        title = message.text.body.split('.')[0];
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
      }
      
      // Calculate total cost
      const totalCost = estimatedHours * hourlyRate;
      
      return {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title,
        description: message.text.body,
        estimatedHours,
        hourlyRate,
        totalCost,
        priority,
        skills,
        originalMessage: message
      };
    } catch (error) {
      console.error('Failed to analyze message:', error);
      
      // Return a default task estimate if analysis fails
      return {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: 'Crisis Response Task',
        description: message.text.body,
        estimatedHours: 4,
        hourlyRate: this.defaultHourlyRate,
        totalCost: 4 * this.defaultHourlyRate,
        priority: 'medium',
        skills: ['IT Support', 'Troubleshooting'],
        originalMessage: message
      };
    }
  }

  /**
   * Use OpenAI API to analyze a message (production implementation)
   */
  async analyzeMessageWithOpenAI(message: WhatsAppMessage): Promise<TaskEstimate> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a crisis response task analyzer. Extract the following information from the message:
              1. Task title (short and descriptive)
              2. Task description (detailed)
              3. Estimated hours to complete (a number)
              4. Required skills (comma-separated list)
              5. Priority level (low, medium, high, or critical)
              
              Format your response as JSON:
              {
                "title": "Task title",
                "description": "Task description",
                "estimatedHours": 4,
                "skills": ["Skill 1", "Skill 2"],
                "priority": "medium"
              }`
            },
            {
              role: 'user',
              content: message.text.body
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Define the expected response structure
      interface OpenAIResponse {
        choices: Array<{
          message: {
            content: string;
          };
        }>;
      }
      
      const data = response.data as OpenAIResponse;
      const content = data.choices[0].message.content;
      const parsedResponse = JSON.parse(content);
      
      // Determine hourly rate based on skills and priority
      let hourlyRate = this.defaultHourlyRate;
      
      if (parsedResponse.priority === 'critical') {
        hourlyRate = 200;
      } else if (parsedResponse.priority === 'high') {
        hourlyRate = 175;
      }
      
      // Adjust rate for specialized skills
      if (parsedResponse.skills.some((skill: string) => 
        skill.toLowerCase().includes('security') || 
        skill.toLowerCase().includes('penetration'))) {
        hourlyRate += 25;
      }
      
      // Calculate total cost
      const totalCost = parsedResponse.estimatedHours * hourlyRate;
      
      return {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: parsedResponse.title,
        description: parsedResponse.description,
        estimatedHours: parsedResponse.estimatedHours,
        hourlyRate,
        totalCost,
        priority: parsedResponse.priority,
        skills: parsedResponse.skills,
        originalMessage: message
      };
    } catch (error) {
      console.error('Failed to analyze message with OpenAI:', error);
      // Fall back to the simpler analysis method
      return this.analyzeMessage(message);
    }
  }
}

// Helper function to create a CrisisResponseAnalyzer
export const createCrisisResponseAnalyzer = (): CrisisResponseAnalyzer | null => {
  try {
    const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    const defaultHourlyRate = Number(process.env.REACT_APP_DEFAULT_HOURLY_RATE || '150');
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured, using simplified analysis');
    }
    
    return new CrisisResponseAnalyzer(openaiApiKey, defaultHourlyRate);
  } catch (error) {
    console.error('Failed to create crisis response analyzer:', error);
    return null;
  }
};
