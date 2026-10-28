import { CalendarClock, CheckCircle2, Clock, Eye, Hourglass, MessageSquare, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { dashboardService } from '../../services/resources.js';
import { StatCard } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import RequestCard from '../../components/dashboard/RequestCard.jsx';
import SessionRow from '../../components/dashboard/SessionRow.jsx';
import { WelcomeCard, MiniMentor, DashboardSkeleton } from '../../components/dashboard/Widgets.jsx';

export default function StudentDashboard() {
  useDocumentTitle('Student dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardService.student(), []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { counts, profileCompletion, pendingRequests, acceptedRequests, upcomingSessions, recommended, recentlyViewed } = data;

  return (
    <>
      <WelcomeCard
        name={user.name}
        completion={profileCompletion}
        profilePath="/student/profile"
        subtitle="Here is what is happening with your mentorships."
      />

      <div className="stat-row">
        <StatCard icon={Hourglass} label="Pending requests" value={counts.pending} />
        <StatCard icon={CheckCircle2} label="Active mentorships" value={counts.accepted} />
        <StatCard icon={CalendarClock} label="Upcoming sessions" value={counts.upcomingSessions} />
        <StatCard icon={MessageSquare} label="Unread messages" value={counts.unreadMessages} />
      </div>

      <div className="dash-grid">
        <div className="stack">
          <section className="card" aria-labelledby="up-h">
            <div className="card-title">
              <h2 id="up-h">Upcoming sessions</h2>
              <Button to="/student/sessions" variant="ghost" size="sm">View all</Button>
            </div>
            {upcomingSessions.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarClock}
                title="No upcoming sessions"
                message={acceptedRequests.length ? 'Your mentor will schedule sessions with you. They will appear here.' : 'Once a mentor accepts your request, they will schedule sessions with you.'}
                action={
                  acceptedRequests.length ? (
                    <Button to="/student/messages" variant="primary" size="sm">Message your mentor</Button>
                  ) : (
                    <Button to="/mentors" variant="primary" size="sm">Find a mentor</Button>
                  )
                }
              />
            ) : (
              <ul className="list">{upcomingSessions.map((s) => <SessionRow key={s._id} session={s} />)}</ul>
            )}
          </section>

          <section className="card" aria-labelledby="acc-h">
            <div className="card-title">
              <h2 id="acc-h">My mentors</h2>
              <Button to="/student/mentorships" variant="ghost" size="sm">Manage</Button>
            </div>
            {acceptedRequests.length === 0 ? (
              <EmptyState compact icon={Search} title="No active mentorships yet" message="Find a mentor and send your first request." action={<Button to="/mentors" variant="primary" size="sm">Find mentors</Button>} />
            ) : (
              <div className="grid">
                {acceptedRequests.map((r) => (
                  <MiniMentor
                    key={r._id}
                    mentor={r.mentor}
                    note={r.category}
                    action={<Button to={`/student/messages?with=${r.mentor._id}`} variant="outline" size="sm">Message</Button>}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="pend-h">
            <div className="card-title">
              <h2 id="pend-h">Pending requests</h2>
              <span className="muted small">Total sent: {counts.total}</span>
            </div>
            {pendingRequests.length === 0 ? (
              <EmptyState compact icon={Clock} title="No pending requests" message="Requests waiting for a mentor's reply appear here." action={<Button to="/mentors" variant="outline" size="sm">Browse mentors</Button>} />
            ) : (
              <div className="grid">
                {pendingRequests.map((r) => <RequestCard key={r._id} request={r} viewerRole="student" compact />)}
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="rec-h">
            <div className="card-title">
              <h2 id="rec-h"><Sparkles size={18} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px', color: 'var(--gold)' }} /> Recommended for you</h2>
            </div>
            {!recommended.basedOnProfile && (
              <p className="small muted">
                {recommended.hasProfileData
                  ? 'No mentors matched your skills or interests yet, so here are our most experienced mentors.'
                  : 'Add skills and career interests to your profile for personalised matches. Showing experienced mentors for now.'}
              </p>
            )}
            {recommended.items.length === 0 ? (
              <EmptyState compact title="No recommendations" message="There are no other mentors accepting students right now." />
            ) : (
              <div className="grid">
                {recommended.items.map(({ mentor, matches }) => (
                  <MiniMentor
                    key={mentor._id}
                    mentor={mentor}
                    note={matches.length ? `Matches: ${matches.slice(0, 3).join(', ')}` : null}
                    action={<Button to={`/mentors/${mentor._id}`} variant="ghost" size="sm" aria-label={`View ${mentor.name}`}>View</Button>}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="rv-h">
            <div className="card-title">
              <h2 id="rv-h"><Eye size={18} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px' }} /> Recently viewed</h2>
            </div>
            {recentlyViewed.length === 0 ? (
              <EmptyState compact title="Nothing viewed yet" message="Mentor profiles you open will appear here." action={<Button to="/mentors" variant="outline" size="sm">Explore mentors</Button>} />
            ) : (
              <div className="grid">
                {recentlyViewed.map((m) => <MiniMentor key={m._id} mentor={m} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
