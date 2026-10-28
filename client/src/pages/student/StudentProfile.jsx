import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import useFetch from '../../hooks/useFetch.js';
import { studentService } from '../../services/resources.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { Input, DepartmentInput, Select, SkillsInput, Textarea, FormAlert } from '../../components/ui/FormField.jsx';
import { PageHeader, ProgressBar } from '../../components/ui/Misc.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { CATEGORIES } from '../../utils/constants.js';
import { listToText, textToList } from '../../utils/formatters.js';
import { isHttpUrl, compactErrors, skillsError } from '../../utils/validators.js';
import '../../components/dashboard/Dashboard.css';

function toForm(user) {
  const sp = user.studentProfile || {};
  return {
    name: user.name || '',
    college: user.college || '',
    department: user.department || '',
    avatarUrl: user.avatarUrl || '',
    yearOfStudy: sp.yearOfStudy ? String(sp.yearOfStudy) : '',
    skills: listToText(sp.skills),
    careerInterests: sp.careerInterests || [],
    learningGoals: sp.learningGoals || '',
  };
}

export default function StudentProfile() {
  useDocumentTitle('My profile');
  const { applyAuth } = useAuth();
  const { data, loading, error, reload } = useFetch(() => studentService.getProfile(), []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(toForm(data.user));
  }, [data]);

  if (loading || (!form && !error)) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };
  const toggleInterest = (cat) =>
    setForm((f) => ({
      ...f,
      careerInterests: f.careerInterests.includes(cat) ? f.careerInterests.filter((c) => c !== cat) : [...f.careerInterests, cat],
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const found = compactErrors({
      name: form.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
      avatarUrl: form.avatarUrl.trim() && !isHttpUrl(form.avatarUrl) ? 'Use an image URL starting with http:// or https://' : '',
      skills: skillsError(textToList(form.skills)),
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const result = await studentService.updateProfile({
        name: form.name.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        avatarUrl: form.avatarUrl.trim(),
        ...(form.yearOfStudy ? { yearOfStudy: Number(form.yearOfStudy) } : {}),
        skills: textToList(form.skills),
        careerInterests: form.careerInterests,
        learningGoals: form.learningGoals.trim(),
      });
      applyAuth(result); // keeps the name/avatar in the top bar in sync
      reload({ silent: true });
      toast.success('Profile saved');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not save your profile.'));
      toast.error('Profile not saved');
    } finally {
      setSaving(false);
    }
  }

  const completion = data.profileCompletion;

  return (
    <>
      <PageHeader title="My profile" subtitle="Mentors see this when you send them a request." />
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <FormAlert message={formError} />

        <section className="card profile-form-section">
          <div className="row" style={{ gap: 16 }}>
            <Avatar name={form.name || 'Student'} src={form.avatarUrl} size={72} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="row-between small"><span>Profile completion</span><strong>{completion.percent}%</strong></div>
              <ProgressBar value={completion.percent} label="Profile completion" />
            </div>
          </div>
          <div className="form-row">
            <Input label="Full name" name="name" value={form.name} onChange={change} error={errors.name} required />
            <Input label="Email" value={data.user.email} disabled hint="Email cannot be changed." />
          </div>
          <div className="form-row">
            <Input label="College" name="college" value={form.college} onChange={change} error={errors.college} />
            <DepartmentInput name="department" value={form.department} onChange={change} error={errors.department} />
          </div>
          <div className="form-row">
            <Select label="Year of study" name="yearOfStudy" value={form.yearOfStudy} onChange={change} error={errors.yearOfStudy}>
              <option value="">Select year</option>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
            <Input
              label="Profile photo URL"
              name="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={change}
              error={errors.avatarUrl}
              hint="Optional. A link to an image; your initials are shown otherwise."
              placeholder="https://"
            />
          </div>
        </section>

        <section className="card profile-form-section">
          <h2>Skills & goals</h2>
          <SkillsInput label="Skills" value={form.skills} onChange={change} department={form.department} error={errors.skills} hint="Separate with commas, or pick from the suggestions." />
          <fieldset className="fieldset">
            <legend className="legend">Career interests</legend>
            <div className="chip-select">
              {CATEGORIES.map((c) => (
                <label key={c}>
                  <input type="checkbox" checked={form.careerInterests.includes(c)} onChange={() => toggleInterest(c)} />
                  {c}
                </label>
              ))}
            </div>
            <p className="hint small muted" style={{ margin: '6px 0 0' }}>Used to recommend mentors on your dashboard.</p>
          </fieldset>
          <Textarea label="Learning goals" name="learningGoals" value={form.learningGoals} onChange={change} error={errors.learningGoals} rows={4} maxLength={1000} showCount />
        </section>

        <div className="form-actions sticky-actions">
          <Button variant="ghost" onClick={() => setForm(toForm(data.user))} disabled={saving}>Reset</Button>
          <Button type="submit" variant="primary" loading={saving}>Save profile</Button>
        </div>
      </form>
    </>
  );
}
