/**
 * Firebase Initialization Script
 * 
 * This script helps set up the Firebase project configuration.
 * It prompts for the Firebase project ID and updates the .firebaserc file.
 */

const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Update .firebaserc with the provided project ID
 */
function updateFirebaserc(projectId) {
  const config = {
    projects: {
      default: projectId
    }
  };
  
  fs.writeFileSync('.firebaserc', JSON.stringify(config, null, 2));
  console.log(`Updated .firebaserc with project ID: ${projectId}`);
}

/**
 * Update .env with Firebase configuration
 */
function updateEnv(config) {
  let envContent = '';
  
  // Read existing .env if it exists
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }
  
  // Update Firebase config
  const firebaseConfigLines = [
    '# Firebase Configuration',
    `REACT_APP_FIREBASE_API_KEY=${config.apiKey}`,
    `REACT_APP_FIREBASE_AUTH_DOMAIN=${config.authDomain}`,
    `REACT_APP_FIREBASE_PROJECT_ID=${config.projectId}`,
    `REACT_APP_FIREBASE_STORAGE_BUCKET=${config.storageBucket}`,
    `REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}`,
    `REACT_APP_FIREBASE_APP_ID=${config.appId}`
  ];
  
  // Check if Firebase config already exists in .env
  if (envContent.includes('# Firebase Configuration')) {
    // Replace existing Firebase config
    const lines = envContent.split('\n');
    let inFirebaseConfig = false;
    let newEnvContent = '';
    
    for (const line of lines) {
      if (line.trim() === '# Firebase Configuration') {
        inFirebaseConfig = true;
        newEnvContent += firebaseConfigLines.join('\n') + '\n\n';
      } else if (inFirebaseConfig && line.trim() === '') {
        inFirebaseConfig = false;
      } else if (!inFirebaseConfig) {
        newEnvContent += line + '\n';
      }
    }
    
    fs.writeFileSync('.env', newEnvContent);
  } else {
    // Append Firebase config to .env
    envContent += '\n' + firebaseConfigLines.join('\n') + '\n';
    fs.writeFileSync('.env', envContent);
  }
  
  console.log('Updated .env with Firebase configuration');
}

/**
 * Main function
 */
function main() {
  console.log('Firebase Initialization Script');
  console.log('============================');
  
  rl.question('Enter your Firebase project ID: ', (projectId) => {
    updateFirebaserc(projectId);
    
    console.log('\nPlease enter your Firebase web app configuration:');
    
    rl.question('API Key: ', (apiKey) => {
      rl.question('Auth Domain: ', (authDomain) => {
        rl.question('Storage Bucket: ', (storageBucket) => {
          rl.question('Messaging Sender ID: ', (messagingSenderId) => {
            rl.question('App ID: ', (appId) => {
              const config = {
                apiKey,
                authDomain,
                projectId,
                storageBucket,
                messagingSenderId,
                appId
              };
              
              updateEnv(config);
              
              console.log('\nFirebase initialization complete!');
              console.log('\nNext steps:');
              console.log('1. Install Firebase CLI: npm install -g firebase-tools');
              console.log('2. Login to Firebase: firebase login');
              console.log('3. Download service account key and save as service-account.json');
              console.log('4. Deploy Firebase schema: node deploy-firebase.js');
              console.log('5. Deploy Firebase rules: firebase deploy --only firestore,storage');
              
              rl.close();
            });
          });
        });
      });
    });
  });
}

// Run main function
main();
