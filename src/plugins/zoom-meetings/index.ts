import ZoomMeetingsPage from './ZoomMeetingsPage';

export const zoomMeetingsPlugin = {
  id: 'zoom-meetings',
  name: 'Zoom Meetings',
  component: ZoomMeetingsPage,
  route: '/admin/zoom',
  navItem: {
    label: 'Zoom Meetings',
    path: '/admin/zoom',
  },
};
