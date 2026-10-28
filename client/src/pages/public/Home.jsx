import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Brain, CalendarCheck, CheckCircle2, Cloud, Code2, Globe,
  GraduationCap, Handshake, Megaphone, Quote, ShieldCheck, Sigma, Users,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { StatCard, Skeleton } from '../../components/ui/Misc.jsx';
import { ErrorState } from '../../components/ui/States.jsx';
import HowItWorksSteps from '../../components/mentors/HowItWorksSteps.jsx';
import HeroIllustration from '../../components/layout/HeroIllustration.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { miscService } from '../../services/resources.js';
import { CATEGORIES } from '../../utils/constants.js';
import './Home.css';

const CATEGORY_ICONS = {
  Programming: Code2,
  'Web Development': Globe,
  'Data Science': BarChart3,
  'AI/ML': Brain,
  'Communication Skills': Megaphone,
  'Cloud & DevOps': Cloud,
  Cybersecurity: ShieldCheck,
  Mathematics: Sigma,
};

// Fictional quotes, clearly labelled as demo content on the page.
const TESTIMONIALS = [
  { name: 'Sample Student A', meta: 'B.Tech CSE, 3rd year', quote: 'Having someone review my project every week made me finish it instead of abandoning it halfway.' },
  { name: 'Sample Student B', meta: 'B.Sc. Data Science, 2nd year', quote: 'My mentor helped me pick one learning path instead of ten. The focus made all the difference.' },
  { name: 'Sample Student C', meta: 'B.E. ECE, final year', quote: 'Mock interviews with honest feedback gave me the confidence I needed before placements.' },
];

function LiveStats() {
  const { data, loading, error, reload } = useFetch(() => miscService.stats(), []);
  const items = [
    { icon: Users, label: 'Mentors on the platform', key: 'mentors' },
    { icon: GraduationCap, label: 'Registered students', key: 'students' },
    { icon: Handshake, label: 'Active & completed mentorships', key: 'activeMentorships' },
    { icon: CalendarCheck, label: 'Completed sessions', key: 'completedSessions' },
  ];
  return (
    <section className="stats-band" aria-labelledby="stats-title">
      <div className="container">
        <div className="stats-head">
          <h2 id="stats-title" className="sr-only">Platform statistics</h2>
          <span className="live-label">
            <span className="live-dot" aria-hidden="true" /> Live platform data
          </span>
          <span className="muted small">Counted directly from the database</span>
        </div>
        {error ? (
          <ErrorState compact message={error} onRetry={reload} />
        ) : (
          <div className="stats-grid">
            {items.map((it) =>
              loading ? (
                <div key={it.key} className="card stat-card">
                  <Skeleton width={44} height={44} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="40%" height={22} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" />
                  </div>
                </div>
              ) : (
                <StatCard key={it.key} icon={it.icon} label={it.label} value={data?.[it.key] ?? 0} />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentTitle('');
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Student Mentorship Portal</span>
            <h1>
              Your Future Starts With the <span className="accent">Right Mentor.</span>
            </h1>
            <p className="hero-lead">
              MentorConnect pairs students with experienced faculty, alumni and professionals who can guide your
              skills, projects and career decisions, one focused session at a time.
            </p>
            <div className="hero-ctas">
              <Button to="/mentors" variant="cta" size="lg">
                Find Your Mentor <ArrowRight aria-hidden="true" />
              </Button>
              <Button to="/register?role=mentor" variant="outline" size="lg">
                Become a Mentor
              </Button>
            </div>
            <ul className="hero-points">
              <li><CheckCircle2 aria-hidden="true" /> Free for students</li>
              <li><CheckCircle2 aria-hidden="true" /> Mentors approve every request</li>
              <li><CheckCircle2 aria-hidden="true" /> Sessions and messages in one place</li>
            </ul>
          </div>
          <HeroIllustration />
        </div>
      </section>

      <LiveStats />

      <section className="section" id="how-it-works" aria-labelledby="how-title">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">How it works</span>
            <h2 id="how-title">Four steps to the right guidance</h2>
            <p>From sign-up to your first session in a few minutes.</p>
          </div>
          <HowItWorksSteps />
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="cat-title">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Popular categories</span>
            <h2 id="cat-title">What do you want to get better at?</h2>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Code2;
              return (
                <Link key={cat} to={`/mentors?category=${encodeURIComponent(cat)}`} className="category-link">
                  <span className="cat-icon" aria-hidden="true"><Icon /></span>
                  {cat}
                  <ArrowRight className="arrow" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="testi-title">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Student stories</span>
            <h2 id="testi-title">What mentorship can feel like</h2>
            <p className="demo-note">Sample feedback (demo content). These quotes are fictional and shown for illustration.</p>
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="card testimonial" style={{ margin: 0 }}>
                <Quote className="quote-mark" aria-hidden="true" />
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <Avatar name={t.name} size={40} />
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.meta}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 72 }} aria-labelledby="cta-title">
        <div className="cta-banner">
          <div>
            <h2 id="cta-title">Ready to take the next step?</h2>
            <p>Create a free account, tell us your goals, and send your first mentorship request today.</p>
          </div>
          <div className="row">
            <Button to="/register" variant="cta" size="lg">Get started</Button>
            <Button to="/mentors" variant="light" size="lg">Browse mentors</Button>
          </div>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="roles-title">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Who it is for</span>
            <h2 id="roles-title">Built for students and mentors</h2>
          </div>
          <div className="role-columns">
            <div className="card">
              <h3>For students</h3>
              <ul className="check-list">
                <li><CheckCircle2 aria-hidden="true" /> Fill in your skills and career interests to get mentor recommendations.</li>
                <li><CheckCircle2 aria-hidden="true" /> Send a request with clear goals (at least 20 characters).</li>
                <li><CheckCircle2 aria-hidden="true" /> Once accepted, schedule sessions and message your mentor.</li>
                <li><CheckCircle2 aria-hidden="true" /> When the mentorship is completed, leave honest feedback.</li>
              </ul>
              <Button to="/register" variant="cta" style={{ marginTop: 20 }}>Join as a student <ArrowRight aria-hidden="true" /></Button>
            </div>
            <div className="card">
              <h3>For mentors</h3>
              <ul className="check-list">
                <li><CheckCircle2 aria-hidden="true" /> Build a profile with your skills, experience and availability.</li>
                <li><CheckCircle2 aria-hidden="true" /> Review each request and accept or decline it with a short note.</li>
                <li><CheckCircle2 aria-hidden="true" /> Schedule, reschedule and complete sessions from your dashboard.</li>
                <li><CheckCircle2 aria-hidden="true" /> Pause new requests any time by turning off "Accepting students".</li>
              </ul>
              <Button to="/register?role=mentor" variant="outline" style={{ marginTop: 20 }}>Become a mentor <ArrowRight aria-hidden="true" /></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
