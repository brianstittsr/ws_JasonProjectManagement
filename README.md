# Project Management Application

A comprehensive project management application with Firebase integration, built with React, TypeScript, and Tailwind CSS.

## Features

- **User Management**: Authentication and user profiles
- **Project Management**: Create, track, and manage projects
- **Jira Integration**: Convert emails and transcripts to Jira tasks
- **Email Processing**: Gmail integration for email management
- **Playbooks**: Mattermost-style playbooks for project workflows
- **Crisis Response**: Task-oriented crisis management system
- **BMAD Analyst**: AI assistant with RAG search capabilities
- **WhatsApp Integration**: Crisis response automation via WhatsApp
- **Invoice Management**: Create, track, and manage invoices
- **CEO Reports**: Automated report generation for executives
- **Zoom Integration**: AI-powered meeting creation and management

## Firebase Schema

The application uses Firebase for data storage with the following collections:

- Users
- Projects
- Features
- Tasks
- Jira Integration
- Email Processing
- Playbooks
- Crisis Response
- WhatsApp Integration
- Archon Integration
- CEO Reports
- Transcript Processing
- BMAD Analyst

For detailed schema information, see [FIREBASE_SCHEMA.md](./FIREBASE_SCHEMA.md).

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Various API keys (see .env.example)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/brianstittsr/ws_JasonProjectManagement.git
   cd ws_JasonProjectManagement/project-management-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file based on `.env.example` and add your API keys.

4. Start the development server:
   ```
   npm start
   ```

### Firebase Deployment

1. Initialize Firebase:
   ```
   npm run firebase:init
   ```

2. Deploy the schema:
   ```
   npm run firebase:deploy-schema
   ```

3. Deploy security rules:
   ```
   npm run firebase:deploy-rules
   ```

4. Deploy Firebase functions:
   ```
   npm run firebase:deploy-functions
   ```

5. Deploy to Firebase hosting:
   ```
   npm run firebase:deploy-hosting
   ```

6. Deploy everything:
   ```
   npm run firebase:deploy-all
   ```

## Technology Stack

- React
- TypeScript
- Tailwind CSS
- Firebase (Firestore, Authentication, Storage, Functions)
- Shadcn UI Components
- React Router
- Archon RAG Integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
