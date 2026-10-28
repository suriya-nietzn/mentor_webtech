// Keep in sync with server/utils/constants.js
export const CATEGORIES = [
  'Programming',
  'Web Development',
  'Data Science',
  'AI/ML',
  'Communication Skills',
  'Cloud & DevOps',
  'Cybersecurity',
  'Mathematics',
];

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const REQUEST_STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
  rejected: { label: 'Declined', tone: 'danger' },
  completed: { label: 'Completed', tone: 'info' },
};

export const SESSION_STATUS = {
  scheduled: { label: 'Scheduled', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const dashboardPath = (role) => (role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
