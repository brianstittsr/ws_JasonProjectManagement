import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath.includes(path);
  };

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
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  isActive('/admin/dashboard') 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/config" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  isActive('/admin/config') 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                API Configurations
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/database" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  isActive('/admin/database') 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Database Settings
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/workflow" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  isActive('/admin/workflow') 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                AI Workflow Generator
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/settings" 
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  isActive('/admin/settings') 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
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
            {currentPath.includes('/admin/config') && 'API Configurations'}
            {currentPath.includes('/admin/database') && 'Database Settings'}
            {currentPath.includes('/admin/workflow') && 'AI Workflow Generator'}
            {currentPath.includes('/admin/settings') && 'Settings'}
            {currentPath.includes('/admin/dashboard') && 'Dashboard'}
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
