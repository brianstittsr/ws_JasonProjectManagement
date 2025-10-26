import React from 'react';
import { Bell, Settings, User, MessageSquare, CheckSquare, FileText } from 'lucide-react';

interface HomeLayoutProps {
  children: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-xl font-semibold">Project Orchestrator</h1>
        </div>
        <nav className="px-4 py-2">
          <ul className="space-y-2">
            <li>
              <a 
                href="/" 
                className="flex items-center px-4 py-2 text-sm rounded-md bg-accent text-accent-foreground"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Communication Hub
              </a>
            </li>
            <li>
              <a 
                href="/tasks" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Tasks
              </a>
            </li>
            <li>
              <a 
                href="/sow" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="mr-2 h-4 w-4" />
                Statement of Work
              </a>
            </li>
            <li>
              <a 
                href="/admin" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </a>
            </li>
          </ul>
        </nav>
        
        <div className="px-4 py-6">
          <h3 className="text-sm font-medium mb-2">Team Members</h3>
          <ul className="space-y-2">
            <li>
              <a 
                href="#" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">PT</div>
                Puneet Talwar
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mr-2">JM</div>
                Jason Mosby
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs mr-2">DS</div>
                Data Science Team
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs mr-2">BS</div>
                Brian Stitt
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h2 className="text-lg font-medium">Communication Orchestrator</h2>
          <div className="flex items-center space-x-4">
            <button className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default HomeLayout;
