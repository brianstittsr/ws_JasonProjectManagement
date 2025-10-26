// Test script for Email to Archon automation
import { createEmailArchonAutomationService } from '../services/emailArchonAutomation';

// Sample Gmail configuration
const gmailConfig = {
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  refreshToken: 'your_refresh_token'
};

// Sample automation configuration
const automationConfig = {
  checkInterval: 60, // hourly
  maxEmailsToProcess: 5,
  labelProcessedEmails: true,
  processedLabel: 'Archon-Processed-Test',
  searchQuery: 'is:unread label:inbox',
  enabled: true,
  includeAttachments: true,
  archonTags: ['email', 'resbyte', 'test']
};

async function testEmailArchonAutomation() {
  console.log('Starting Email to Archon automation test...');
  
  try {
    // Create the automation service
    const service = await createEmailArchonAutomationService(gmailConfig, automationConfig);
    
    if (!service) {
      console.error('Failed to create Email to Archon automation service');
      return;
    }
    
    console.log('Service created successfully');
    console.log('Running automation...');
    
    // Run the automation once
    const result = await service.runAutomation();
    
    console.log('Automation run completed');
    console.log('Status:', result.status);
    console.log('Emails processed:', result.emailsProcessed);
    console.log('Errors:', result.errors);
    
    // Print details of processed emails
    console.log('\nProcessed emails:');
    result.details.processedEmails.forEach(email => {
      console.log(`- ${email.subject} (${email.from})`);
      if (email.archonId) {
        console.log(`  Stored in Archon with ID: ${email.archonId}`);
      }
      if (email.error) {
        console.log(`  Error: ${email.error}`);
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testEmailArchonAutomation().catch(console.error);
