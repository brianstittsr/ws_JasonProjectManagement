import PydioPage from './PydioPage';

export const pydioFilesPlugin = {
  id: 'pydio-files',
  name: 'Pydio Files',
  component: PydioPage,
  route: '/admin/pydio',
  navItem: {
    label: 'Pydio Files',
    path: '/admin/pydio',
  },
};
