import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CalendarPlus, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { requestService, sessionService } from '../../services/resources.js';
import { PageHeader } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import SessionRow from '../../components/dashboard/SessionRow.jsx';
import SessionFormModal from '../../components/forms/SessionFormModal.jsx';

export default function Sessions() {
  const { user } = useAuth();
  // Only mentors schedule sessions; students see the sessions their mentor sets up.
  const isMentor = user.role === 'mentor';
  useDocumentTitle(isMentor ? 'Sessions' : 'My sessions');
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('upcoming');
  const [creating, setCreating] = useState(false);
  const sessions = useFetch(() => sessionService.mine(), []);
  // Only accepted mentorships can have sessions.
  const accepted = useFetch(() => requestService.mine({ status: 'accepted' }), []);

  // Dashboard links use ?new=1 to open the schedule form directly.
  useEffect(() => {
    if (params.get('new') === '1') {
      if (isMentor) setCreating(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams, isMentor]);

  const mentorships = accepted.data?.requests || [];
  const list = sessions.data?.[tab] || [];
  const hasMentorship = mentorships.length > 0;
  const canCreate = isMentor && hasMentorship;

  return (
    <>
      <PageHeader
        title={isMentor ? 'Sessions' : 'My sessions'}
        subtitle="Upcoming and past mentorship sessions."
        actions={
          isMentor && (
            <Button
              variant="primary"
              onClick={() => setCreating(true)}
              disabled={accepted.loading || !canCreate}
              title={!canCreate ? 'You need an accepted mentorship to schedule a session' : undefined}
            >
              <CalendarPlus aria-hidden="true" /> Schedule session
            </Button>
          )
        }
      />
      {!accepted.loading && (isMentor ? !canCreate : true) && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <CalendarClock aria-hidden="true" />
          <span>
            {isMentor
              ? 'Sessions can be scheduled once you accept a student request.'
              : 'Your mentor schedules sessions with you. They will appear here.'}
          </span>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Session lists">
        <button role="tab" className="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          Upcoming {sessions.data && <span className="badge">{sessions.data.upcoming.length}</span>}
        </button>
        <button role="tab" className="tab" aria-selected={tab === 'past'} onClick={() => setTab('past')}>
          Past & cancelled {sessions.data && <span className="badge">{sessions.data.past.length}</span>}
        </button>
      </div>

      {sessions.loading ? (
        <PageLoader />
      ) : sessions.error ? (
        <ErrorState message={sessions.error} onRetry={sessions.reload} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={tab === 'upcoming' ? CalendarClock : History}
          title={tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
          message={
            tab !== 'upcoming'
              ? 'Completed and cancelled sessions will appear here.'
              : isMentor
                ? 'Schedule a session to start working together.'
                : 'Your mentor has not scheduled a session yet.'
          }
          action={
            canCreate ? (
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>Schedule a session</Button>
            ) : isMentor ? (
              <Button to="/mentor/requests" variant="primary" size="sm">Review requests</Button>
            ) : hasMentorship ? (
              <Button to="/student/messages" variant="primary" size="sm">Message your mentor</Button>
            ) : (
              <Button to="/mentors" variant="primary" size="sm">Find a mentor</Button>
            )
          }
        />
      ) : (
        <ul className="list" role="tabpanel">
          {list.map((s) => <SessionRow key={s._id} session={s} past={tab === 'past'} />)}
        </ul>
      )}

      {isMentor && (
        <SessionFormModal
          open={creating}
          onClose={() => setCreating(false)}
          mentorships={mentorships}
          viewerRole="mentor"
          onSaved={() => {
            setTab('upcoming');
            sessions.reload({ silent: true });
          }}
        />
      )}
    </>
  );
}
