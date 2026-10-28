import { query } from 'express-validator';
import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Session from '../models/Session.js';
import { ok, asyncHandler } from '../utils/respond.js';
import { escapeRegex, pageParams } from '../utils/query.js';

// Admin-only views. Admins can read every student and mentor, including emails,
// but these endpoints never return password hashes.

export const listUsersRules = [
  query('role').isIn(['student', 'mentor']).withMessage('Role must be student or mentor'),
  query('search').optional().isString().trim().isLength({ max: 80 }),
];

const USER_FIELDS =
  'name email role college department createdAt isSample studentProfile.yearOfStudy studentProfile.careerInterests mentorProfile.title mentorProfile.categories mentorProfile.yearsOfExperience mentorProfile.availability.isAcceptingStudents';

// GET /api/admin/users?role=student|mentor&search=&page=&limit=
export const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const { page, limit, skip } = pageParams(req.query, { defaultLimit: 20 });

  const filter = { role };
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { department: rx }, { college: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select(USER_FIELDS).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Request counts per user in one query, so the table shows activity without N+1 lookups.
  const key = role === 'mentor' ? '$mentor' : '$student';
  const counts = await MentorshipRequest.aggregate([
    { $match: { [role]: { $in: users.map((u) => u._id) } } },
    { $group: { _id: { user: key, status: '$status' }, n: { $sum: 1 } } },
  ]);
  const byUser = {};
  counts.forEach(({ _id, n }) => {
    const id = String(_id.user);
    byUser[id] = byUser[id] || { pending: 0, accepted: 0, rejected: 0, completed: 0 };
    byUser[id][_id.status] = n;
  });

  ok(res, {
    users: users.map((u) => ({ ...u, requests: byUser[String(u._id)] || { pending: 0, accepted: 0, rejected: 0, completed: 0 } })),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /api/admin/overview - totals for the admin dashboard.
export const overview = asyncHandler(async (req, res) => {
  const [students, mentors, requestCounts, sessions] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'mentor' }),
    MentorshipRequest.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Session.countDocuments(),
  ]);
  const requests = { pending: 0, accepted: 0, rejected: 0, completed: 0 };
  requestCounts.forEach(({ _id, n }) => (requests[_id] = n));
  ok(res, { students, mentors, requests, sessions });
});
