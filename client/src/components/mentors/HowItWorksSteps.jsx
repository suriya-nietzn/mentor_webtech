import { MessageSquareText, Rocket, Search, UserPlus } from 'lucide-react';
import './Mentors.css';

export const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your student profile',
    text: 'Sign up and add your department, year, skills and career interests so mentors understand where you are.',
  },
  {
    icon: Search,
    title: 'Discover the right mentor',
    text: 'Search and filter mentors by skill, department and category. Read their background and mentoring approach.',
  },
  {
    icon: MessageSquareText,
    title: 'Request a mentorship session',
    text: 'Send a short request explaining your goals. The mentor reviews it and accepts or declines.',
  },
  {
    icon: Rocket,
    title: 'Learn, grow, and achieve your goals',
    text: 'Your mentor schedules sessions with you. Message them and track your progress from your dashboard.',
  },
];

export default function HowItWorksSteps() {
  return (
    <ol className="steps">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="card step">
          <span className="step-number" aria-hidden="true">{i + 1}</span>
          <span className="step-icon" aria-hidden="true"><Icon /></span>
          <h3>
            <span className="sr-only">Step {i + 1}: </span>
            {title}
          </h3>
          <p>{text}</p>
        </li>
      ))}
    </ol>
  );
}
