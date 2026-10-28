import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Briefcase, CalendarCheck, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { Input, DepartmentInput, PasswordInput, Select, SkillsInput, FormAlert } from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';
import { isEmail, isStrongPassword, PASSWORD_HINT, compactErrors, safeRedirectPath, skillsError } from '../../utils/validators.js';
import { textToList } from '../../utils/formatters.js';
import { dashboardPath } from '../../utils/constants.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import './Auth.css';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  college: '',
  department: '',
  yearOfStudy: '',
  skills: '',
  expertise: '',
  acceptTerms: false,
};

export default function Register() {
  useDocumentTitle('Create account');
  const [params] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(params.get('role') === 'mentor' ? 'mentor' : 'student');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  function validate() {
    const f = form;
    return compactErrors({
      name: f.name.trim().length < 2 ? 'Enter your full name (at least 2 characters)' : '',
      email: !f.email.trim() ? 'Email is required' : !isEmail(f.email) ? 'Enter a valid email address' : '',
      password: !isStrongPassword(f.password) ? PASSWORD_HINT : '',
      confirmPassword: !f.confirmPassword ? 'Please confirm your password' : f.confirmPassword !== f.password ? 'Passwords do not match' : '',
      college: f.college.trim().length < 2 ? 'College name is required' : '',
      department: f.department.trim().length < 2 ? 'Department is required' : '',
      yearOfStudy: role === 'student' && !f.yearOfStudy ? 'Select your year of study' : '',
      skills:
        role === 'mentor' && textToList(f.skills).length === 0
          ? 'List at least one skill you can mentor in'
          : skillsError(textToList(f.skills)),
      acceptTerms: !f.acceptTerms ? 'You must accept the terms to continue' : '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      // Move focus to the first invalid field so keyboard users know where to look.
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role,
        college: form.college.trim(),
        department: form.department.trim(),
        skills: textToList(form.skills),
        acceptTerms: form.acceptTerms,
        ...(role === 'student' ? { yearOfStudy: Number(form.yearOfStudy) } : { expertise: textToList(form.expertise) }),
      };
      const user = await register(payload);
      toast.success('Account created. Welcome to MentorConnect!');
      const from = safeRedirectPath(location.state?.from);
      navigate(from || dashboardPath(user.role), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Registration failed. Please try again.'));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page container">
      <div className="auth-wrap">
        <aside className="auth-aside" aria-label="Why join">
          <h2>{role === 'mentor' ? 'Share what you know.' : 'Grow with guidance.'}</h2>
          <p>
            {role === 'mentor'
              ? 'Help students turn their questions into progress. You stay in control of who you mentor and when.'
              : 'Find a mentor who has walked the path you are on, and get help that is specific to your goals.'}
          </p>
          <ul>
            <li>
              <Users aria-hidden="true" />
              <span><strong>Real connections</strong>Every request is reviewed by the mentor personally.</span>
            </li>
            <li>
              <CalendarCheck aria-hidden="true" />
              <span><strong>Organised sessions</strong>Schedule, reschedule and track sessions in one place.</span>
            </li>
            <li>
              <BookOpen aria-hidden="true" />
              <span><strong>Focused learning</strong>Set clear goals and see your progress over time.</span>
            </li>
          </ul>
        </aside>

        <div className="card auth-card">
          <h1>Create your account</h1>
          <p>It takes about a minute. Fields marked * are required.</p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <FormAlert message={formError} />

            <fieldset className="fieldset">
              <legend className="legend">
                I am joining as a<span className="required" aria-hidden="true">*</span>
              </legend>
              <div className="segmented">
                <label>
                  <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
                  <GraduationCap size={18} aria-hidden="true" /> Student
                </label>
                <label>
                  <input type="radio" name="role" value="mentor" checked={role === 'mentor'} onChange={() => setRole('mentor')} />
                  <Briefcase size={18} aria-hidden="true" /> Mentor
                </label>
              </div>
            </fieldset>

            <Input label="Full name" name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} required />
            <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} required />
            <div className="form-row">
              <PasswordInput
                label="Password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={change}
                error={errors.password}
                hint={PASSWORD_HINT}
                required
              />
              <PasswordInput
                label="Confirm password"
                name="confirmPassword"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={change}
                error={errors.confirmPassword}
                required
              />
            </div>
            <div className="form-row">
              <Input label="College name" name="college" value={form.college} onChange={change} error={errors.college} required />
              <DepartmentInput name="department" value={form.department} onChange={change} error={errors.department} required />
            </div>

            {role === 'student' ? (
              <>
                <Select label="Year of study" name="yearOfStudy" value={form.yearOfStudy} onChange={change} error={errors.yearOfStudy} required>
                  <option value="">Select year</option>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </Select>
                <SkillsInput
                  label="Skills you have or are learning"
                  value={form.skills}
                  onChange={change}
                  department={form.department}
                  error={errors.skills}
                  hint="Separate with commas, or pick from the suggestions. Used to recommend mentors."
                />
              </>
            ) : (
              <>
                <SkillsInput
                  label="Skills you can mentor in"
                  value={form.skills}
                  onChange={change}
                  department={form.department}
                  error={errors.skills}
                  hint="Separate with commas, or pick from the suggestions."
                  required
                />
                <Input
                  label="Areas of expertise"
                  name="expertise"
                  value={form.expertise}
                  onChange={change}
                  error={errors.expertise}
                  hint="Optional. e.g. Interview preparation, Final-year projects"
                />
              </>
            )}

            <div className="field">
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={change}
                  aria-invalid={errors.acceptTerms ? 'true' : undefined}
                  aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
                />
                <span>
                  I agree to use MentorConnect respectfully and understand this is a college project demo.
                </span>
              </label>
              {errors.acceptTerms && (
                <span id="terms-error" className="field-error">{errors.acceptTerms}</span>
              )}
            </div>

            <Button type="submit" variant="cta" size="lg" block loading={submitting}>
              {submitting ? 'Creating account...' : `Create ${role} account`}
            </Button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login" state={location.state}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
