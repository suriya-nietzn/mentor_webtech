import { body } from 'express-validator';

// Removes HTML tags and control characters from free text. React escapes output anyway,
// so we strip rather than HTML-escape (escaping would show "&amp;" in the UI).
export function cleanText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

// Accepts an array of strings or a comma-separated string; returns a clean, de-duplicated array.
export function toList(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const out = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;
    const clean = cleanText(item);
    if (clean && !out.some((x) => x.toLowerCase() === clean.toLowerCase())) out.push(clean);
  }
  return out;
}

export const textField = (field, label, { min = 0, max = 200, required = false } = {}) => {
  let chain = body(field);
  chain = required ? chain.exists({ values: 'falsy' }).withMessage(`${label} is required`).bail() : chain.optional();
  return chain
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .customSanitizer(cleanText)
    .isLength({ min: required ? Math.max(min, 1) : min, max })
    .withMessage(
      min > 0 ? `${label} must be between ${min} and ${max} characters` : `${label} must be at most ${max} characters`
    );
};

/*
 * Rejects keyboard-mash entries such as "jcbsdjb.svjsdjvb" while allowing real skill
 * names like "C++", "C#", "Node.js", "UI/UX", "AWS" or "Public Speaking".
 * Returns an error message, or '' if the skill looks fine. Keep in sync with
 * skillProblem() in client/src/utils/validators.js.
 */
const SKILL_CHARS = /^[A-Za-z0-9+#./&()' -]+$/;
const KEYBOARD_MASH = /asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|zxcv|xcvb|cvbn/i;
export function skillProblem(skill) {
  const bad = `"${skill}" does not look like a real skill. Please change it (e.g. Python, React, Public Speaking).`;
  if (!SKILL_CHARS.test(skill) || !/[A-Za-z]/.test(skill)) return bad;
  if (/(.)\1{3,}/.test(skill) || KEYBOARD_MASH.test(skill)) return bad;
  for (const word of skill.split(/[^A-Za-z]+/).filter(Boolean)) {
    if (word.length <= 6 && word === word.toUpperCase()) continue; // acronyms: SQL, HTML, MATLAB
    if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(word)) return bad; // five consonants in a row
    if (word.length > 4 && !/[aeiouy]/i.test(word)) return bad; // long word with no vowel
  }
  return '';
}

export const listField = (field, label, { maxItems = 20, maxLength = 40, required = false, itemCheck } = {}) => {
  let chain = body(field);
  if (!required) chain = chain.optional();
  return chain
    .customSanitizer(toList)
    .custom((list) => {
      if (required && list.length === 0) throw new Error(`Add at least one ${label.toLowerCase()} item`);
      if (list.length > maxItems) throw new Error(`${label}: at most ${maxItems} items`);
      if (list.some((s) => s.length > maxLength)) throw new Error(`${label}: each item must be at most ${maxLength} characters`);
      const problem = itemCheck && list.map(itemCheck).find(Boolean);
      if (problem) throw new Error(problem);
      return true;
    });
};

export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number';

export const strongPassword = (field) =>
  body(field)
    .isString()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 }) // bcrypt only uses the first 72 bytes
    .withMessage(PASSWORD_RULE_MESSAGE)
    .bail()
    .matches(/[a-z]/)
    .withMessage(PASSWORD_RULE_MESSAGE)
    .matches(/[A-Z]/)
    .withMessage(PASSWORD_RULE_MESSAGE)
    .matches(/\d/)
    .withMessage(PASSWORD_RULE_MESSAGE);
