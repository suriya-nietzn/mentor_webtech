import { CalendarClock, CheckCircle2, GraduationCap, Inbox, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminService } from '../../services/resources.js';
import { PageHeader, StatCard } from '../../components/ui/Misc.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import '../../components/dashboard/Dashboard.css';
import './Admin.css';

export default function AdminDashboard() {
  useDocumentTitle('Admin dashboard');
  const { data, loading, error, reload } = useFetch(() => adminService.overview(), []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { students, mentors, requests, sessions } = data;
  return (
    <>
      <PageHeader
        title="Admin dashboard"
        subtitle="An overview of everyone on MentorConnect."
        actions={
          <>
            <Button to="/admin/students" variant="primary" size="sm">View students</Button>
            <Button to="/admin/mentors" variant="outline" size="sm">View mentors</Button>
          </>
        }
      />
      <div className="stat-row">
        <StatCard icon={GraduationCap} label="Students" value={students} />
        <StatCard icon={Users} label="Mentors" value={mentors} />
        <StatCard icon={Inbox} label="Pending requests" value={requests.pending} />
        <StatCard icon={CalendarClock} label="Sessions" value={sessions} />
      </div>

      <div className="card admin-breakdown">
        <h2>Mentorship requests</h2>
        <ul>
          <li><span>Pending</span><strong>{requests.pending}</strong></li>
          <li><span>Accepted</span><strong>{requests.accepted}</strong></li>
          <li><span>Completed</span><strong>{requests.completed}</strong></li>
          <li><span>Declined</span><strong>{requests.rejected}</strong></li>
        </ul>
        <p className="small muted"><CheckCircle2 aria-hidden="true" className="inline-icon" /> Counts include demo data created by the seed script.</p>
      </div>
    </>
  );
}
