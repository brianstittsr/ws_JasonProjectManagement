import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import TestComponent from '../components/admin/TestComponent';
import CrisisResponseAutomation from '../components/admin/CrisisResponseAutomation';

const CrisisResponsePage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Crisis Response</h1>
        </div>
        
        {/* Use both components to test */}
        <TestComponent />
        <CrisisResponseAutomation />
      </div>
    </AdminLayout>
  );
};

export default CrisisResponsePage;
