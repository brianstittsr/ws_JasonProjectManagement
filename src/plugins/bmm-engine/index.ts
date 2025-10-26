import BmmEngine from './BmmEngine';

export const bmmEnginePlugin = {
  id: 'bmm-engine',
  name: 'BMad Method Engine',
  component: BmmEngine,
  route: '/bmm',
  navItem: {
    label: 'BMM Engine',
    path: '/bmm',
  },
};
