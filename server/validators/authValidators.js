import { body } from 'express-validator';
import { ROLES } from '../utils/constants.js';
import { textField, listField, strongPassword, toList, skillProblem } from './common.js';

export const registerRules = [
  textField('name', 'Full name', { min: 2, max: 80, required: true }),
  body('email').isString().bail().trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  strongPassword('password'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  // Only student or mentor can be chosen; anything else (e.g. "admin") is rejected.
  body('role').isIn(ROLES).withMessage('Role must be either student or mentor'),
  textField('college', 'College name', { min: 2, max: 160, required: true }),
  textField('department', 'Department', { min: 2, max: 120, required: true }),
  body('yearOfStudy')
    .if(body('role').equals('student'))
    .exists({ values: 'falsy' })
    .withMessage('Year of study is required')
    .bail()
    .isInt({ min: 1, max: 6 })
    .withMessage('Year of study must be between 1 and 6')
    .toInt(),
  listField('skills', 'Skills', { itemCheck: skillProblem }),
  listField('expertise', 'Expertise'),
  body('skills')
    .if(body('role').equals('mentor'))
    .custom((value) => toList(value).length > 0)
    .withMessage('Mentors must list at least one skill'),
  body('acceptTerms').custom((v) => v === true || v === 'true').withMessage('You must accept the terms to register'),
];

export const loginRules = [
  body('email').isString().withMessage('Email is required').bail().trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  strongPassword('newPassword'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];
