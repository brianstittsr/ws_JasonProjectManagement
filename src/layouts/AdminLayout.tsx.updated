import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
        <nav className="px-4 py-2">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/admin/dashboard" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/dashboard' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/config" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/config' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                API Configurations
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/transcripts" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/transcripts' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Transcript Processing
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/zoom" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/zoom' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Zoom Meetings
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/playbooks" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/playbooks' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Playbooks
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/invoices" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/invoices' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Invoices
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/crisis-response" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/crisis-response' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Crisis Response
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/bmad-analyst" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/bmad-analyst' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                BMAD Analyst
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/settings" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === '/admin/settings' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border flex items-center px-6">
          <h2 className="text-lg font-medium">
            {currentPath === '/admin/config' && 'API Configurations'}
            {currentPath === '/admin/transcripts' && 'Transcript Processing'}
            {currentPath === '/admin/zoom' && 'Zoom Meetings'}
            {currentPath === '/admin/playbooks' && 'Playbooks'}
            {currentPath === '/admin/invoices' && 'Invoices'}
            {currentPath === '/admin/crisis-response' && 'Crisis Response'}
            {currentPath === '/admin/bmad-analyst' && 'BMAD Analyst'}
            {currentPath === '/admin/dashboard' && 'Dashboard'}
            {currentPath === '/admin/settings' && 'Settings'}
          </h2>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
