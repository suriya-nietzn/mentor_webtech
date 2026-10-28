import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { mentorService } from '../../services/resources.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { Input, DepartmentInput, Textarea, FormAlert } from '../../components/ui/FormField.jsx';
import { PageHeader, ProgressBar } from '../../components/ui/Misc.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { CATEGORIES } from '../../utils/constants.js';
import { listToText, textToList } from '../../utils/formatters.js';
import { isHttpUrl, compactErrors } from '../../utils/validators.js';
import '../../components/dashboard/Dashboard.css';

function toForm(user) {
  const p = user.mentorProfile || {};
  return {
    name: user.name || '',
    college: user.college || '',
    department: user.department || '',
    avatarUrl: user.avatarUrl || '',
    title: p.title || '',
    bio: p.bio || '',
    skills: listToText(p.skills),
    expertise: listToText(p.expertise),
    yearsOfExperience: String(p.yearsOfExperience ?? 0),
    education: (p.education || []).map((e) => ({ degree: e.degree || '', institution: e.institution || '', year: e.year || '' })),
    workExperience: (p.workExperience || []).map((w) => ({ role: w.role || '', organization: w.organization || '', period: w.period || '', description: w.description || '' })),
    categories: p.categories || [],
    mentoringApproach: p.mentoringApproach || '',
  };
}

// Repeating group of inputs (education / work experience) with add and remove buttons.
function RepeatList({ title, items, fields, onChange, onAdd, onRemove, errors, errorKey, max = 10 }) {
  return (
    <fieldset className="fieldset stack">
      <legend className="legend" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>{title}</legend>
      {items.length === 0 && <p className="muted small" style={{ margin: 0 }}>Nothing added yet.</p>}
      {items.map((item, i) => (
        <div key={i} className="repeat-item">
          <div className="row-between">
            <h3>{title} #{i + 1}</h3>
            <Button variant="ghost" size="sm" onClick={() => onRemove(i)} aria-label={`Remove ${title.toLowerCase()} ${i + 1}`}>
              <Trash2 aria-hidden="true" /> Remove
            </Button>
          </div>
          <div className="form-row">
            {fields.map(([key, label, required, Component = Input]) => (
              <Component
                key={key}
                label={label}
                value={item[key]}
                required={required}
                rows={Component === Textarea ? 2 : undefined}
                onChange={(e) => onChange(i, key, e.target.value)}
                error={errors[`${errorKey}[${i}].${key}`]}
              />
            ))}
          </div>
        </div>
      ))}
      {items.length < max && (
        <div>
          <Button variant="outline" size="sm" onClick={onAdd}><Plus aria-hidden="true" /> Add {title.toLowerCase()}</Button>
        </div>
      )}
      {errors[errorKey] && <span className="field-error">{errors[errorKey]}</span>}
    </fieldset>
  );
}

export default function MentorProfileEdit() {
  useDocumentTitle('Edit mentor profile');
  const { user, applyAuth, profileCompletion } = useAuth();
  const [form, setForm] = useState(() => toForm(user));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Refresh fields when the stored user changes (e.g. after saving).
  useEffect(() => {
    setForm(toForm(user));
  }, [user]);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };
  const setItem = (list) => (i, key, value) =>
    setForm((f) => ({ ...f, [list]: f[list].map((item, idx) => (idx === i ? { ...item, [key]: value } : item)) }));
  const addItem = (list, blank) => () => setForm((f) => ({ ...f, [list]: [...f[list], blank] }));
  const removeItem = (list) => (i) => setForm((f) => ({ ...f, [list]: f[list].filter((_, idx) => idx !== i) }));
  const toggleCategory = (c) =>
    setForm((f) => ({ ...f, categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c] }));

  function validate() {
    const found = {
      name: form.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
      avatarUrl: form.avatarUrl.trim() && !isHttpUrl(form.avatarUrl) ? 'Use an image URL starting with http:// or https://' : '',
      skills: textToList(form.skills).length === 0 ? 'List at least one skill' : '',
      yearsOfExperience: !/^\d+$/.test(form.yearsOfExperience) || Number(form.yearsOfExperience) > 60 ? 'Enter a whole number from 0 to 60' : '',
    };
    form.education.forEach((e, i) => {
      if (e.degree.trim().length < 2) found[`education[${i}].degree`] = 'Degree is required';
      if (e.institution.trim().length < 2) found[`education[${i}].institution`] = 'Institution is required';
    });
    form.workExperience.forEach((w, i) => {
      if (w.role.trim().length < 2) found[`workExperience[${i}].role`] = 'Role is required';
      if (w.organization.trim().length < 2) found[`workExperience[${i}].organization`] = 'Organization is required';
    });
    return compactErrors(found);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const trimAll = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.trim()]));
      const result = await mentorService.updateProfile({
        name: form.name.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        avatarUrl: form.avatarUrl.trim(),
        title: form.title.trim(),
        bio: form.bio.trim(),
        skills: textToList(form.skills),
        expertise: textToList(form.expertise),
        yearsOfExperience: Number(form.yearsOfExperience),
        education: form.education.map(trimAll),
        workExperience: form.workExperience.map(trimAll),
        categories: form.categories,
        mentoringApproach: form.mentoringApproach.trim(),
      });
      applyAuth(result);
      toast.success('Profile saved');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not save your profile.'));
      toast.error('Profile not saved');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="This is what students see on your public mentor page."
        actions={<Button to={`/mentors/${user._id}`} variant="outline" size="sm">View public profile</Button>}
      />
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <FormAlert message={formError} />

        <section className="card profile-form-section">
          <div className="row" style={{ gap: 16 }}>
            <Avatar name={form.name || 'Mentor'} src={form.avatarUrl} size={72} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="row-between small"><span>Profile completion</span><strong>{profileCompletion?.percent ?? 0}%</strong></div>
              <ProgressBar value={profileCompletion?.percent ?? 0} label="Profile completion" />
            </div>
          </div>
          <div className="form-row">
            <Input label="Full name" name="name" value={form.name} onChange={change} error={errors.name} required />
            <Input label="Professional title" name="title" value={form.title} onChange={change} error={errors.title} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="form-row">
            <Input label="College / organisation" name="college" value={form.college} onChange={change} error={errors.college} />
            <DepartmentInput name="department" value={form.department} onChange={change} error={errors.department} />
          </div>
          <div className="form-row">
            <Input label="Years of experience" name="yearsOfExperience" type="number" min="0" max="60" value={form.yearsOfExperience} onChange={change} error={errors.yearsOfExperience} required />
            <Input label="Profile photo URL" name="avatarUrl" type="url" value={form.avatarUrl} onChange={change} error={errors.avatarUrl} hint="Optional. Your initials are shown otherwise." placeholder="https://" />
          </div>
          <Textarea label="Bio / professional introduction" name="bio" value={form.bio} onChange={change} error={errors.bio} rows={5} maxLength={2000} showCount />
        </section>

        <section className="card profile-form-section">
          <h2>Skills & expertise</h2>
          <Input label="Skills" name="skills" value={form.skills} onChange={change} error={errors.skills} required hint="Separate with commas. Students can filter by these." />
          <Input label="Areas of expertise" name="expertise" value={form.expertise} onChange={change} error={errors.expertise} hint="Separate with commas, e.g. Mock interviews, Project reviews" />
          <fieldset className="fieldset">
            <legend className="legend">Mentoring categories</legend>
            <div className="chip-select">
              {CATEGORIES.map((c) => (
                <label key={c}>
                  <input type="checkbox" checked={form.categories.includes(c)} onChange={() => toggleCategory(c)} />
                  {c}
                </label>
              ))}
            </div>
            {errors.categories && <span className="field-error">{errors.categories}</span>}
          </fieldset>
          <Textarea label="Mentoring approach" name="mentoringApproach" value={form.mentoringApproach} onChange={change} error={errors.mentoringApproach} rows={3} maxLength={1000} showCount />
        </section>

        <section className="card profile-form-section">
          <RepeatList
            title="Education"
            items={form.education}
            errors={errors}
            errorKey="education"
            fields={[['degree', 'Degree', true], ['institution', 'Institution', true], ['year', 'Year']]}
            onChange={setItem('education')}
            onAdd={addItem('education', { degree: '', institution: '', year: '' })}
            onRemove={removeItem('education')}
          />
        </section>

        <section className="card profile-form-section">
          <RepeatList
            title="Experience"
            items={form.workExperience}
            errors={errors}
            errorKey="workExperience"
            fields={[['role', 'Role', true], ['organization', 'Organization', true], ['period', 'Period'], ['description', 'Description', false, Textarea]]}
            onChange={setItem('workExperience')}
            onAdd={addItem('workExperience', { role: '', organization: '', period: '', description: '' })}
            onRemove={removeItem('workExperience')}
          />
        </section>

        <p className="small muted">Availability and the "accepting students" switch are on the <Link to="/mentor/availability">Availability</Link> page.</p>

        <div className="form-actions sticky-actions">
          <Button variant="ghost" onClick={() => setForm(toForm(user))} disabled={saving}>Reset</Button>
          <Button type="submit" variant="primary" loading={saving}>Save profile</Button>
        </div>
      </form>
    </>
  );
}
