import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import MentorCard, { MentorCardSkeleton } from '../../components/mentors/MentorCard.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/FormField.jsx';
import { Pagination } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { mentorService } from '../../services/resources.js';
import { CATEGORIES } from '../../utils/constants.js';
import { pluralize } from '../../utils/formatters.js';
import './FindMentors.css';

const PAGE_SIZE = 9;
const FILTER_KEYS = ['search', 'skill', 'department', 'category'];

export default function FindMentors() {
  useDocumentTitle('Find Mentors');
  // The URL query string is the single source of truth for filters, so links are shareable.
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const skill = params.get('skill') || '';
  const department = params.get('department') || '';
  const category = params.get('category') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  // Search box keeps its own state and is written to the URL after the user pauses typing.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    if (debouncedSearch.trim() !== search) updateParams({ search: debouncedSearch.trim() });
    // Only react to the debounced value; `search` changing is handled by the effect above.
  }, [debouncedSearch]);

  function updateParams(changes, { resetPage = true } = {}) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: true }
    );
  }

  const clearFilters = () => {
    setSearchInput('');
    setParams({}, { replace: true });
  };

  // Results are always listed by name, A to Z.
  const { data, loading, error, reload } = useFetch(
    () => mentorService.list({ search, skill, department, category, page, limit: PAGE_SIZE }),
    [search, skill, department, category, page]
  );
  const { data: options } = useFetch(() => mentorService.filters(), []);

  const activeFilters = FILTER_KEYS.filter((k) => params.get(k)).length;
  const total = data?.pagination.total ?? 0;

  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <div className="page-header">
        <div>
          <h1>Find a mentor</h1>
          <p>Search by name or skill, then narrow down by department and category.</p>
        </div>
      </div>

      <form className="card filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field filters-search">
          <label htmlFor="mentor-search">Search</label>
          <div className="input-icon">
            <Search aria-hidden="true" />
            <input
              id="mentor-search"
              type="search"
              className="input"
              placeholder="Name, title or skill"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <Select label="Skill" value={skill} onChange={(e) => updateParams({ skill: e.target.value })}>
          <option value="">All skills</option>
          {options?.skills.map((s) => <option key={s} value={s}>{s}</option>)}
          {skill && !options?.skills.includes(skill) && <option value={skill}>{skill}</option>}
        </Select>
        <Select label="Department" value={department} onChange={(e) => updateParams({ department: e.target.value })}>
          <option value="">All departments</option>
          {options?.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          {department && !options?.departments.includes(department) && <option value={department}>{department}</option>}
        </Select>
        <Select label="Category" value={category} onChange={(e) => updateParams({ category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </form>

      <div className="results-bar" aria-live="polite">
        <span>
          {loading ? 'Searching...' : error ? '' : `${pluralize(total, 'mentor')} found`}
        </span>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X aria-hidden="true" /> Clear filters ({activeFilters})
          </Button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid-3">
          {Array.from({ length: 6 }, (_, i) => <MentorCardSkeleton key={i} />)}
        </div>
      ) : data.mentors.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No mentors match your filters"
          message="Try a different search term or remove some filters."
          action={activeFilters > 0 && <Button variant="primary" size="sm" onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <>
          <div className="grid-3">
            {data.mentors.map((m) => <MentorCard key={m._id} mentor={m} />)}
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onChange={(p) => {
              updateParams({ page: p > 1 ? String(p) : '' }, { resetPage: false });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
