import PydioStructurePage from './PydioStructurePage';

export const pydioStructurePlugin = {
  id: 'pydio-structure',
  name: 'Pydio Structure',
  component: PydioStructurePage,
  route: '/admin/pydio-structure',
  navItem: {
    label: 'Pydio Structure',
    path: '/admin/pydio-structure',
  },
};
