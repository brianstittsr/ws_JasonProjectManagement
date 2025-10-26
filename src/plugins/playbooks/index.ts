import PlaybooksPage from './PlaybooksPage';

export const playbooksPlugin = {
  id: 'playbooks',
  name: 'Playbooks',
  component: PlaybooksPage,
  route: '/admin/playbooks',
  navItem: {
    label: 'Playbooks',
    path: '/admin/playbooks',
  },
};
