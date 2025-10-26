/**
 * Pydio Folder Structure Creation Script
 * 
 * This script creates the folder structure defined in pydio-folder-structure.json
 * using the Pydio API.
 * 
 * Usage:
 * 1. Configure the Pydio connection settings below
 * 2. Run the script with Node.js: node create-pydio-folders.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration - Update these values with your Pydio server details
const config = {
  baseUrl: 'https://your-pydio-server.com', // Replace with your Pydio server URL
  username: 'admin',                        // Replace with your Pydio username
  password: 'password',                     // Replace with your Pydio password
  workspace: 'default',                     // Replace with your target workspace
  structureFile: path.join(__dirname, 'pydio-folder-structure.json')
};

// Read the folder structure from JSON file
const readFolderStructure = () => {
  try {
    const data = fs.readFileSync(config.structureFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading folder structure file:', error);
    process.exit(1);
  }
};

// Get authentication token
const getAuthToken = async () => {
  try {
    const response = await axios.post(`${config.baseUrl}/api/auth/login`, {
      login: config.username,
      password: config.password
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

// Create a single folder
const createFolder = async (token, folderPath) => {
  try {
    console.log(`Creating folder: ${folderPath}`);
    
    const response = await axios.put(
      `${config.baseUrl}/api/workspace/${config.workspace}/mkdir`, 
      { path: folderPath },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    return response.data;
  } catch (error) {
    // If folder already exists, just log and continue
    if (error.response?.status === 409) {
      console.log(`Folder already exists: ${folderPath}`);
      return { success: true, exists: true };
    }
    
    console.error(`Error creating folder ${folderPath}:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Process folder structure recursively
const processFolderStructure = async (token, folders) => {
  for (const folder of folders) {
    // Create the current folder
    await createFolder(token, folder.path);
    
    // Process children if they exist
    if (folder.children && folder.children.length > 0) {
      await processFolderStructure(token, folder.children);
    }
  }
};

// Main function
const main = async () => {
  try {
    console.log('Starting Pydio folder structure creation...');
    
    // Read folder structure
    const structure = readFolderStructure();
    
    // Get authentication token
    const token = await getAuthToken();
    
    // Process folder structure
    await processFolderStructure(token, structure.folders);
    
    console.log('Folder structure creation completed successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Run the script
main();
