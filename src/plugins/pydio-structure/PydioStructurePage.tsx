import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import PydioFolderDeployer from '../components/admin/PydioFolderDeployer';

const PydioStructurePage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pydio Folder Structure</h1>
          <p className="mt-1 text-sm text-gray-500">
            Deploy and manage the Resbyte.ai folder structure in your Pydio instance
          </p>
        </div>

        <div className="grid gap-6">
          <PydioFolderDeployer />
        </div>
      </div>
    </AdminLayout>
  );
};

export default PydioStructurePage;
