import TranscriptProcessingPage from './TranscriptProcessingPage';

export const transcriptProcessingPlugin = {
  id: 'transcript-processing',
  name: 'Transcript Processing',
  component: TranscriptProcessingPage,
  route: '/admin/transcripts',
  navItem: {
    label: 'Transcript Processing',
    path: '/admin/transcripts',
  },
};
