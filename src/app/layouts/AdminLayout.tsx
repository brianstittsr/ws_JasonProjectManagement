import React from 'react';
import { plugins } from '@/plugins';
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
            {plugins.map(plugin => (
              plugin.navItem && (
                <li key={plugin.id}>
                  <Link
                    to={plugin.navItem.path}
                    className={`flex items-center px-4 py-2 text-sm rounded-md ${currentPath === plugin.navItem.path ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                  >
                    {plugin.navItem.label}
                  </Link>
                </li>
              )
            ))}

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
            {currentPath === '/admin/email-archon' && 'Email to Archon'}
            {currentPath === '/admin/pydio' && 'Pydio Files'}
            {currentPath === '/admin/pydio-structure' && 'Pydio Structure'}
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
