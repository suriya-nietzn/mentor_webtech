import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, Mail, MapPin, Phone, RotateCw } from 'lucide-react';
import { Input, Textarea, FormAlert } from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';
import { miscService } from '../../services/resources.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { isEmail, compactErrors } from '../../utils/validators.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import './InfoPages.css';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  useDocumentTitle('Contact');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  async function handleSubmit(e) {
    e?.preventDefault();
    if (submitting) return;
    const found = compactErrors({
      name: form.name.trim().length < 2 ? 'Please enter your name' : '',
      email: !isEmail(form.email) ? 'Enter a valid email address' : '',
      subject: form.subject.trim().length < 3 ? 'Subject must be at least 3 characters' : '',
      message: form.message.trim().length < 10 ? 'Message must be at least 10 characters' : '',
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const res = await miscService.contact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      // Only report success when the server confirms it saved the message.
      if (res.status !== 201) throw new Error('Unexpected response');
      setSent(true);
      setForm(EMPTY);
      toast.success('Message sent');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Your message could not be sent.'));
      toast.error('Message not sent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contact</span>
          <h1>Get in touch</h1>
          <p>Questions about the platform, mentoring, or this project? Send us a message.</p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-grid">
          <div className="card">
            <h2 style={{ fontSize: '1.2rem' }}>Contact information</h2>
            <ul className="contact-info">
              <li><MapPin aria-hidden="true" /><span><strong>Address</strong>Karunya Nagar, Coimbatore</span></li>
              <li><Mail aria-hidden="true" /><span><strong>Email</strong><a href="mailto:mentorconnet@ben.in">mentorconnet@ben.in</a></span></li>
              <li><Phone aria-hidden="true" /><span><strong>Phone</strong><a href="tel:+914224502100">+91 422 450 2100</a></span></li>
              <li><Clock aria-hidden="true" /><span><strong>Response time</strong>Messages are stored in the database and reviewed by the project team.</span></li>
            </ul>
          </div>

          <div className="card">
            {sent ? (
              <div className="state" style={{ border: 0 }} role="status">
                <div className="state-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} aria-hidden="true">
                  <CheckCircle2 />
                </div>
                <h3>Thanks, your message was received</h3>
                <p>It has been saved and the team will get back to you by email.</p>
                <Button variant="outline" size="sm" onClick={() => setSent(false)}>Send another message</Button>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit} noValidate>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Send a message</h2>
                {formError && (
                  <div className="stack" style={{ gap: 8 }}>
                    <FormAlert message={formError} />
                    <div>
                      <Button variant="outline" size="sm" onClick={() => handleSubmit()} loading={submitting}>
                        <RotateCw aria-hidden="true" /> Retry
                      </Button>
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <Input label="Your name" name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} required />
                  <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} required />
                </div>
                <Input label="Subject" name="subject" value={form.subject} onChange={change} error={errors.subject} required maxLength={150} />
                <Textarea label="Message" name="message" value={form.message} onChange={change} error={errors.message} required rows={6} maxLength={2000} showCount />
                <div className="form-actions">
                  <Button type="submit" variant="primary" loading={submitting}>
                    {submitting ? 'Sending...' : 'Send message'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
