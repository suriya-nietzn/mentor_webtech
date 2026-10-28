import { useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { DEPARTMENTS } from '../../utils/constants.js';

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
