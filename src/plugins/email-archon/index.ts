import EmailArchonPage from './EmailArchonPage';

export const emailArchonPlugin = {
  id: 'email-archon',
  name: 'Email to Archon',
  component: EmailArchonPage,
  route: '/admin/email-archon',
  navItem: {
    label: 'Email to Archon',
    path: '/admin/email-archon',
  },
};
