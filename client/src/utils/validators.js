// Client-side checks give instant feedback. The server validates everything again.

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || '').trim());

export const PASSWORD_HINT = 'At least 8 characters with an uppercase letter, a lowercase letter and a number.';

export const isStrongPassword = (v) => typeof v === 'string' && v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);

/*
 * Rejects keyboard-mash entries such as "jcbsdjb.svjsdjvb" while allowing real skill
 * names like "C++", "C#", "Node.js", "UI/UX", "AWS" or "Public Speaking".
 * Keep in sync with skillProblem() in server/validators/common.js.
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

// First problem in a list of skills, or '' if they all look fine.
export const skillsError = (list) => list.map(skillProblem).find(Boolean) || '';

export const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(String(v || '').trim());

export function required(value, label) {
  if (Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim()) return `${label} is required`;
  return '';
}

export function lengthBetween(value, label, min, max) {
  const len = String(value || '').trim().length;
  if (len < min) return `${label} must be at least ${min} characters`;
  if (len > max) return `${label} must be at most ${max} characters`;
  return '';
}

// Only allow internal paths for "return to" redirects (blocks //evil.com and backslash tricks).
export function safeRedirectPath(path) {
  if (typeof path !== 'string') return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  return path;
}

// Removes empty-string keys so the error object can be checked with Object.keys().length
export const compactErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v)));
