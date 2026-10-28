import { useId, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Plus } from 'lucide-react';
import { DEPARTMENTS } from '../../utils/constants.js';
import { textToList } from '../../utils/formatters.js';
import { ALL_SKILLS, skillSuggestions } from '../../utils/skillSuggestions.js';

/*
 * Field wraps any input with a label, hint and inline error, and wires up the
 * aria attributes so screen readers announce the error with the input.
 * Usage: <Field label="Email" error={errors.email}>{(props) => <input {...props} />}</Field>
 */
export function Field({ label, hint, error, required, children, id: givenId }) {
  const autoId = useId();
  const id = givenId || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required" aria-hidden="true">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy, required })}
      {hint && !error && <span id={hintId} className="hint">{hint}</span>}
      {error && (
        <span id={errorId} className="field-error">
          <AlertCircle size={14} aria-hidden="true" /> {error}
        </span>
      )}
    </div>
  );
}

export function Input({ label, hint, error, required, id, className = '', ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a11y) => <input className={`input ${className}`} {...a11y} {...rest} />}
    </Field>
  );
}

// Text input with a suggestion list: pick a common department or type any other.
export function DepartmentInput({ label = 'Department', ...rest }) {
  const listId = `${useId()}-departments`;
  return (
    <>
      <Input label={label} list={listId} autoComplete="off" placeholder="Choose or type" {...rest} />
      <datalist id={listId}>
        {DEPARTMENTS.map((d) => <option key={d} value={d} />)}
      </datalist>
    </>
  );
}

/*
 * Comma-separated skills with help:
 * - chips suggest skills for the chosen department; clicking one adds it
 * - while typing, the rest of a matching skill shows in grey and Tab accepts it
 *   (Tab moves to the next field as usual when there is nothing to complete)
 * onChange receives an event-like { target: { name, value } } so forms can reuse their change handler.
 */
export function SkillsInput({ label, name = 'skills', value = '', onChange, department, hint, error, required }) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const { title, skills: suggested } = skillSuggestions(department);

  const added = new Set(textToList(value).map((s) => s.toLowerCase()));
  const lastComma = value.lastIndexOf(',');
  const token = value.slice(lastComma + 1).trimStart();
  const completion = token
    ? [...suggested, ...ALL_SKILLS].find(
        (s) => s.length > token.length && s.toLowerCase().startsWith(token.toLowerCase()) && !added.has(s.toLowerCase())
      )
    : '';
  const chips = suggested.filter((s) => !added.has(s.toLowerCase()));

  const emit = (next) => onChange({ target: { name, value: next, type: 'text' } });

  function acceptCompletion() {
    emit(`${value.slice(0, lastComma + 1)}${lastComma >= 0 ? ' ' : ''}${completion}, `);
  }

  function addSkill(skill) {
    const base = value.trim().replace(/,$/, '');
    emit(base ? `${base}, ${skill}, ` : `${skill}, `);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    const caretAtEnd = e.target.selectionStart === value.length;
    if (e.key === 'Tab' && !e.shiftKey && completion && caretAtEnd) {
      e.preventDefault();
      acceptCompletion();
    }
  }

  const showGhost = focused && completion;
  return (
    <Field label={label} hint={showGhost ? `Press Tab to add "${completion}"` : hint} error={error} required={required}>
      {(a11y) => (
        <>
          <div className="skills-input">
            <input
              ref={inputRef}
              className="input"
              name={name}
              value={value}
              autoComplete="off"
              onChange={(e) => emit(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              {...a11y}
            />
            {showGhost && (
              <div className="skills-ghost" aria-hidden="true">
                <span className="skills-ghost-typed">{value}</span>
                {completion.slice(token.length)}
              </div>
            )}
          </div>
          {chips.length > 0 && (
            <div className="skill-suggest">
              <span className="skill-suggest-title">{title}:</span>
              {chips.map((s) => (
                <button key={s} type="button" className="skill-chip" onClick={() => addSkill(s)} aria-label={`Add skill ${s}`}>
                  <Plus aria-hidden="true" /> {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Field>
  );
}

export function Textarea({ label, hint, error, required, id, maxLength, value, showCount, ...rest }) {
  const length = String(value || '').length;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a11y) => (
        <>
          <textarea className="textarea" maxLength={maxLength} value={value} {...a11y} {...rest} />
          {showCount && maxLength && (
            <span className={`char-count ${length > maxLength ? 'over' : ''}`} aria-live="polite">
              {length} / {maxLength}
            </span>
          )}
        </>
      )}
    </Field>
  );
}

export function Select({ label, hint, error, required, id, children, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a11y) => (
        <select className="select" {...a11y} {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function PasswordInput({ label = 'Password', hint, error, required, id, ...rest }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a11y) => (
        <div className="input-group">
          <input className="input" type={visible ? 'text' : 'password'} {...a11y} {...rest} />
          <button
            type="button"
            className="input-addon"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>
      )}
    </Field>
  );
}

export function FormAlert({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
