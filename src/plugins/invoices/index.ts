import InvoicesPage from './InvoicesPage';

export const invoicesPlugin = {
  id: 'invoices',
  name: 'Invoices',
  component: InvoicesPage,
  route: '/admin/invoices',
  navItem: {
    label: 'Invoices',
    path: '/admin/invoices',
  },
};
