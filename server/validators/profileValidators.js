import { body } from 'express-validator';
import { CATEGORIES, WEEK_DAYS } from '../utils/constants.js';
import { textField, listField, cleanText, skillProblem } from './common.js';

const avatarRule = body('avatarUrl')
  .optional()
  .isString()
  .customSanitizer(cleanText)
  .custom((v) => v === '' || /^https?:\/\/\S+$/i.test(v))
  .withMessage('Avatar must be an http(s) image URL or left empty')
  .isLength({ max: 500 });

// Fields both roles can edit. Role, email and passwordHash are deliberately absent:
// only fields listed here ever reach the database (see matchedData in the controllers).
const commonRules = [
  textField('name', 'Full name', { min: 2, max: 80 }),
  textField('college', 'College name', { max: 160 }),
  textField('department', 'Department', { max: 120 }),
  avatarRule,
];

export const studentProfileRules = [
  ...commonRules,
  body('yearOfStudy').optional().isInt({ min: 1, max: 6 }).withMessage('Year of study must be between 1 and 6').toInt(),
  listField('skills', 'Skills', { itemCheck: skillProblem }),
  listField('careerInterests', 'Career interests'),
  textField('learningGoals', 'Learning goals', { max: 1000 }),
];

export const mentorProfileRules = [
  ...commonRules,
  textField('title', 'Professional title', { max: 120 }),
  textField('bio', 'Bio', { max: 2000 }),
  listField('skills', 'Skills', { itemCheck: skillProblem }),
  listField('expertise', 'Expertise'),
  body('yearsOfExperience').optional().isInt({ min: 0, max: 60 }).withMessage('Experience must be 0-60 years').toInt(),
  body('education').optional().isArray({ max: 10 }).withMessage('Education: at most 10 entries'),
  textField('education.*.degree', 'Degree', { min: 2, max: 120, required: true }),
  textField('education.*.institution', 'Institution', { min: 2, max: 160, required: true }),
  textField('education.*.year', 'Year', { max: 20 }),
  body('workExperience').optional().isArray({ max: 10 }).withMessage('Experience: at most 10 entries'),
  textField('workExperience.*.role', 'Role', { min: 2, max: 120, required: true }),
  textField('workExperience.*.organization', 'Organization', { min: 2, max: 160, required: true }),
  textField('workExperience.*.period', 'Period', { max: 60 }),
  textField('workExperience.*.description', 'Description', { max: 500 }),
  body('availability').optional().isObject().withMessage('Availability is invalid'),
  body('availability.days').optional().isArray().withMessage('Days must be a list'),
  body('availability.days.*').isIn(WEEK_DAYS).withMessage('Invalid day'),
  textField('availability.timeNotes', 'Time notes', { max: 200 }),
  body('availability.isAcceptingStudents').optional().isBoolean().withMessage('Accepting students must be true/false').toBoolean(),
  body('categories').optional().isArray({ max: CATEGORIES.length }).withMessage('Categories must be a list'),
  body('categories.*').isIn(CATEGORIES).withMessage('Invalid category'),
  textField('mentoringApproach', 'Mentoring approach', { max: 1000 }),
];
