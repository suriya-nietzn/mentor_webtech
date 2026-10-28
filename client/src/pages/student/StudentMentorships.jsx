import { useState } from 'react';
import { Handshake, MessageSquare, Star } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { requestService } from '../../services/resources.js';
import { PageHeader } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import RequestCard from '../../components/dashboard/RequestCard.jsx';
import ReviewModal from '../../components/forms/ReviewModal.jsx';

const TABS = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['accepted', 'Accepted'],
  ['completed', 'Completed'],
  ['rejected', 'Declined'],
];

export default function StudentMentorships() {
  useDocumentTitle('My mentorships');
  const [tab, setTab] = useState('all');
  const [reviewFor, setReviewFor] = useState(null);
  const { data, loading, error, reload } = useFetch(() => requestService.mine(), []);

  const requests = data?.requests || [];
  const count = (status) => (status === 'all' ? requests.length : requests.filter((r) => r.status === status).length);
  const shown = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  function actionsFor(r) {
    // Sessions are scheduled by the mentor, so students only get a message button here.
    if (r.status === 'accepted') {
      return (
        <Button size="sm" variant="primary" to={`/student/messages?with=${r.mentor?._id}`}>
          <MessageSquare aria-hidden="true" /> Message mentor
        </Button>
      );
    }
    if (r.status === 'completed' && !r.review?.rating) {
      return (
        <Button size="sm" variant="outline" onClick={() => setReviewFor(r)}>
          <Star aria-hidden="true" /> Leave feedback
        </Button>
      );
    }
    if (r.status === 'rejected' && r.mentor) {
      return <Button size="sm" variant="ghost" to={`/mentors/${r.mentor._id}`}>View mentor</Button>;
    }
    return null;
  }

  return (
    <>
      <PageHeader
        title="My mentorships"
        subtitle="Track every request you have sent and what happened to it."
        actions={<Button to="/mentors" variant="cta">Find a mentor</Button>}
      />

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" className="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
            {label}
            {!loading && <span className="badge">{count(key)}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={tab === 'all' ? 'You have not sent any requests yet' : `No ${TABS.find((t) => t[0] === tab)[1].toLowerCase()} requests`}
          message="Browse mentors and send a request describing your goals."
          action={<Button to="/mentors" variant="primary" size="sm">Find mentors</Button>}
        />
      ) : (
        <div className="grid" role="tabpanel">
          {shown.map((r) => <RequestCard key={r._id} request={r} viewerRole="student" actions={actionsFor(r)} />)}
        </div>
      )}

      <ReviewModal open={Boolean(reviewFor)} onClose={() => setReviewFor(null)} request={reviewFor} onSaved={() => reload({ silent: true })} />
    </>
  );
}
