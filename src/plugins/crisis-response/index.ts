import CrisisResponsePage from './CrisisResponsePage';

export const crisisResponsePlugin = {
  id: 'crisis-response',
  name: 'Crisis Response',
  component: CrisisResponsePage,
  route: '/admin/crisis-response',
  navItem: {
    label: 'Crisis Response',
    path: '/admin/crisis-response',
  },
};
