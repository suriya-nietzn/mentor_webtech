import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce.js';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminService } from '../../services/resources.js';
import { PageHeader, Pagination, TagList } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Badge, { DemoBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { formatDate, pluralize } from '../../utils/formatters.js';
import './Admin.css';

const PAGE_SIZE = 20;

// One page for both lists; `role` decides which users and columns are shown.
export default function AdminUsers({ role }) {
  const isMentor = role === 'mentor';
  const title = isMentor ? 'All mentors' : 'All students';
  useDocumentTitle(title);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim(), 400);
  const [page, setPage] = useState(1);

  // Switching between Students and Mentors, or typing a new search, starts from page 1.
  useEffect(() => setPage(1), [role, search]);
  useEffect(() => setSearchInput(''), [role]);

  const { data, loading, error, reload } = useFetch(
    () => adminService.users({ role, search, page, limit: PAGE_SIZE }),
    [role, search, page]
  );

  return (
    <>
      <PageHeader title={title} subtitle={data ? `${pluralize(data.pagination.total, isMentor ? 'mentor' : 'student')} registered` : ''} />

      <div className="card admin-toolbar">
        <label htmlFor="admin-search" className="sr-only">Search</label>
        <div className="input-icon">
          <Search aria-hidden="true" />
          <input
            id="admin-search"
            type="search"
            className="input"
            placeholder="Search by name, email, department or college"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <PageLoader />
      ) : data.users.length === 0 ? (
        <EmptyState icon={SearchX} title={`No ${isMentor ? 'mentors' : 'students'} found`} message={search ? 'Try a different search term.' : 'Nobody has registered yet.'} />
      ) : (
        <>
          <div className="card admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Department</th>
                  {isMentor ? (
                    <>
                      <th scope="col">Title</th>
                      <th scope="col">Categories</th>
                      <th scope="col">Experience</th>
                      <th scope="col">Status</th>
                    </>
                  ) : (
                    <>
                      <th scope="col">Year</th>
                      <th scope="col">Interests</th>
                    </>
                  )}
                  <th scope="col">Requests</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-person">
                        <Avatar name={u.name} size={34} />
                        <div>
                          {isMentor ? <Link to={`/mentors/${u._id}`}><strong>{u.name}</strong></Link> : <strong>{u.name}</strong>}
                          <a href={`mailto:${u.email}`} className="small muted admin-email">{u.email}</a>
                        </div>
                        {u.isSample && <DemoBadge />}
                      </div>
                    </td>
                    <td>
                      {u.department}
                      <div className="small muted">{u.college}</div>
                    </td>
                    {isMentor ? (
                      <>
                        <td>{u.mentorProfile?.title || '-'}</td>
                        <td><TagList items={u.mentorProfile?.categories} max={2} muted /></td>
                        <td>{pluralize(u.mentorProfile?.yearsOfExperience ?? 0, 'year')}</td>
                        <td>
                          {u.mentorProfile?.availability?.isAcceptingStudents === false
                            ? <Badge tone="warning">Not accepting</Badge>
                            : <Badge tone="success">Accepting</Badge>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u.studentProfile?.yearOfStudy ? `Year ${u.studentProfile.yearOfStudy}` : '-'}</td>
                        <td><TagList items={u.studentProfile?.careerInterests} max={2} muted /></td>
                      </>
                    )}
                    <td className="admin-counts">
                      <span title="Pending">{u.requests.pending} pending</span>
                      <span title="Accepted">{u.requests.accepted} active</span>
                      <span title="Completed">{u.requests.completed} done</span>
                    </td>
                    <td className="nowrap">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
