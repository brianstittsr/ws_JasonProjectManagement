import AdminConfigPage from './AdminConfigPage';

export const adminConfigPlugin = {
  id: 'admin-config',
  name: 'API Configurations',
  component: AdminConfigPage,
  route: '/admin/config',
  navItem: {
    label: 'API Configurations',
    path: '/admin/config',
  },
};
