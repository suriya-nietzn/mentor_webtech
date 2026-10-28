import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../services/api.js';
import { Input, PasswordInput, FormAlert } from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';
import { isEmail, safeRedirectPath, compactErrors } from '../../utils/validators.js';
import { dashboardPath } from '../../utils/constants.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import './Auth.css';

export default function Login() {
  useDocumentTitle('Login');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  function validate() {
    return compactErrors({
      email: !form.email.trim() ? 'Email is required' : !isEmail(form.email) ? 'Enter a valid email address' : '',
      password: !form.password ? 'Password is required' : '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      // Go back to the page the user originally wanted, if it is a safe internal path.
      const from = safeRedirectPath(location.state?.from);
      navigate(from || dashboardPath(user.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Login failed. Please try again.'));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page container">
      <div className="auth-wrap narrow">
        <div className="card auth-card">
          <h1>Welcome back</h1>
          <p>Log in to continue your mentorship journey.</p>
          {location.state?.from && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <LogIn aria-hidden="true" />
              <span>Please log in to continue.</span>
            </div>
          )}
          <form className="form" onSubmit={handleSubmit} noValidate>
            <FormAlert message={formError} />
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={change}
              error={errors.email}
              required
            />
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={change}
              error={errors.password}
              required
            />
            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p className="auth-switch">
            New to MentorConnect? <Link to="/register" state={location.state}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
