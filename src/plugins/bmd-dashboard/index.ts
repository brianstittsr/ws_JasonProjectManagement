import BmdDashboard from './BmdDashboard';

export const bmdDashboardPlugin = {
  id: 'bmd-dashboard',
  name: 'BMD Dashboard',
  component: BmdDashboard,
  route: '/admin/bmd-dashboard',
  navItem: {
    label: 'BMD Dashboard',
    path: '/admin/bmd-dashboard',
  },
};
