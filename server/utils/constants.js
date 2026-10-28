// Shared lists used by models, validators and the seed script.
// The client keeps a copy in client/src/utils/constants.js.
// Roles people can choose when they register.
export const ROLES = ['student', 'mentor'];
// Every role a user can have. Admins are only created by the seed script, never by sign-up.
export const ALL_ROLES = [...ROLES, 'admin'];

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

export const REQUEST_STATUS = ['pending', 'accepted', 'rejected', 'completed'];
export const SESSION_STATUS = ['scheduled', 'completed', 'cancelled'];
