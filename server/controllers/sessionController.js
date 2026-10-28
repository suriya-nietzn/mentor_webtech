import { body } from 'express-validator';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Session from '../models/Session.js';
import AppError from '../utils/AppError.js';
import { ok, created, asyncHandler } from '../utils/respond.js';
import { textField, cleanText } from '../validators/common.js';

/*
 * Design choice: only the mentor of an ACCEPTED mentorship can schedule a session.
 * Either participant can reschedule or cancel it. Only the mentor can mark it completed, and only
 * after its start time. Cancelled or completed sessions are locked (409 on edit).
 */

const futureDate = (field, required) => {
  let chain = body(field);
  chain = required ? chain.exists({ values: 'falsy' }).withMessage('Date and time are required').bail() : chain.optional();
  return chain
    .isISO8601()
    .withMessage('Enter a valid date and time')
    .bail()
    .custom((v) => new Date(v).getTime() > Date.now())
    .withMessage('Session time must be in the future')
    .toDate();
};

const meetingUrlRule = body('meetingUrl')
  .optional()
  .isString()
  .customSanitizer(cleanText)
  .custom((v) => v === '' || /^https?:\/\/\S+$/i.test(v))
  .withMessage('Meeting link must start with http:// or https://')
  .isLength({ max: 500 });

export const createSessionRules = [
  body('requestId').isMongoId().withMessage('Choose a mentorship'),
  textField('title', 'Title', { min: 3, max: 120, required: true }),
  textField('description', 'Description', { max: 1000 }),
  futureDate('scheduledAt', true),
  body('durationMinutes').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be 15-240 minutes').toInt(),
  meetingUrlRule,
];

export const updateSessionRules = [
  textField('title', 'Title', { min: 3, max: 120 }),
  textField('description', 'Description', { max: 1000 }),
  futureDate('scheduledAt', false),
  body('durationMinutes').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be 15-240 minutes').toInt(),
  meetingUrlRule,
  body('status').optional().equals('completed').withMessage('Status can only be changed to completed here'),
];

const PEOPLE = 'name avatarUrl department mentorProfile.title';

// Only the two participants can see a session. Everyone else gets 404, so ids cannot be probed.
async function findOwnSession(req) {
  const session = await Session.findOne({
    _id: req.params.id,
    $or: [{ student: req.user._id }, { mentor: req.user._id }],
  });
  if (!session) throw new AppError(404, 'Session not found');
  return session;
}

const isUpcoming = (s) => s.status === 'scheduled' && new Date(s.scheduledAt).getTime() > Date.now();

// POST /api/sessions
export const createSession = asyncHandler(async (req, res) => {
  const { requestId, title, description, scheduledAt, durationMinutes, meetingUrl } = req.body;
  // The route only lets mentors in; this also makes sure it is one of *their* mentorships.
  const request = await MentorshipRequest.findOne({ _id: requestId, mentor: req.user._id });
  if (!request) throw new AppError(404, 'Mentorship not found');
  if (request.status !== 'accepted') {
    throw new AppError(409, 'Sessions can only be scheduled for an accepted mentorship');
  }

  const session = await Session.create({
    request: request._id,
    student: request.student,
    mentor: request.mentor,
    title,
    description,
    scheduledAt,
    durationMinutes,
    meetingUrl,
    createdBy: req.user._id,
  });
  await session.populate([{ path: 'student', select: PEOPLE }, { path: 'mentor', select: PEOPLE }]);
  created(res, { session }, 'Session scheduled');
});

// GET /api/sessions/my - split into upcoming and past on the server.
export const mySessions = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'student' ? { student: req.user._id } : { mentor: req.user._id };
  const sessions = await Session.find(filter)
    .populate('student', PEOPLE)
    .populate('mentor', PEOPLE)
    .sort({ scheduledAt: 1 })
    .lean();

  const upcoming = sessions.filter(isUpcoming);
  const past = sessions.filter((s) => !isUpcoming(s)).reverse(); // most recent first
  ok(res, { upcoming, past });
});

// GET /api/sessions/:id
export const getSession = asyncHandler(async (req, res) => {
  const session = await findOwnSession(req);
  await session.populate([
    { path: 'student', select: PEOPLE },
    { path: 'mentor', select: PEOPLE },
    { path: 'request', select: 'category goals status' },
    { path: 'cancelledBy', select: 'name' },
  ]);
  ok(res, { session, isUpcoming: isUpcoming(session) });
});

// PUT /api/sessions/:id - edit / reschedule / mark completed
export const updateSession = asyncHandler(async (req, res) => {
  const session = await findOwnSession(req);
  if (session.status !== 'scheduled') {
    throw new AppError(409, `A ${session.status} session can no longer be changed`);
  }

  const { title, description, scheduledAt, durationMinutes, meetingUrl, status } = req.body;

  if (status === 'completed') {
    if (!session.mentor.equals(req.user._id)) throw new AppError(403, 'Only the mentor can mark a session as completed');
    if (session.scheduledAt.getTime() > Date.now()) {
      throw new AppError(409, 'A session can only be marked completed after its start time');
    }
    session.status = 'completed';
  } else {
    // Rescheduling is only allowed while the mentorship is still active.
    const request = await MentorshipRequest.findById(session.request).select('status');
    if (request?.status !== 'accepted') throw new AppError(409, 'This mentorship is no longer active');

    if (title !== undefined) session.title = title;
    if (description !== undefined) session.description = description;
    if (durationMinutes !== undefined) session.durationMinutes = durationMinutes;
    if (meetingUrl !== undefined) session.meetingUrl = meetingUrl;
    if (scheduledAt !== undefined && scheduledAt.getTime() !== session.scheduledAt.getTime()) {
      session.scheduledAt = scheduledAt;
      session.rescheduledCount += 1;
    }
  }

  await session.save();
  await session.populate([{ path: 'student', select: PEOPLE }, { path: 'mentor', select: PEOPLE }]);
  ok(res, { session }, status === 'completed' ? 'Session marked as completed' : 'Session updated');
});

// DELETE /api/sessions/:id - cancels (keeps the record so both sides can see what happened).
export const cancelSession = asyncHandler(async (req, res) => {
  const session = await findOwnSession(req);
  if (session.status !== 'scheduled') {
    throw new AppError(409, `A ${session.status} session cannot be cancelled`);
  }
  session.status = 'cancelled';
  session.cancelledBy = req.user._id;
  await session.save();
  ok(res, { session }, 'Session cancelled');
});
