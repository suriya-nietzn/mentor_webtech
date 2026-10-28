import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarClock, ChevronsLeft, ChevronsRight, Clock, GraduationCap, Handshake, Inbox,
  LayoutDashboard, LogOut, Menu, MessageSquare, Search, Settings, User, Users, X,
} from 'lucide-react';
import Logo from '../components/layout/Logo.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { messageService } from '../services/resources.js';
import './DashboardLayout.css';

const NAV = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mentors', label: 'Find Mentors', icon: Search },
    { to: '/student/mentorships', label: 'My Mentorships', icon: Handshake },
    { to: '/student/sessions', label: 'My Sessions', icon: CalendarClock },
    { to: '/student/messages', label: 'Messages', icon: MessageSquare, unread: true },
    { to: '/student/profile', label: 'My Profile', icon: User },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ],
  mentor: [
    { to: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mentor/profile', label: 'My Profile', icon: User },
    { to: '/mentor/requests', label: 'Student Requests', icon: Inbox },
    { to: '/mentor/students', label: 'My Students', icon: Users },
    { to: '/mentor/sessions', label: 'Sessions', icon: CalendarClock },
    { to: '/mentor/messages', label: 'Messages', icon: MessageSquare, unread: true },
    { to: '/mentor/availability', label: 'Availability', icon: Clock },
    { to: '/mentor/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'All Students', icon: GraduationCap },
    { to: '/admin/mentors', label: 'All Mentors', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

const WORKSPACE = { student: 'Student workspace', mentor: 'Mentor workspace', admin: 'Admin workspace' };

const COLLAPSE_KEY = 'mc.sidebarCollapsed';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage blocked: the preference just is not remembered */
    }
  }, [collapsed]);

  // Unread message count for the sidebar badge; refreshed every 30s and on page change.
  useEffect(() => {
    if (user.role === 'admin') return undefined; // admins have no inbox
    let active = true;
    const load = () =>
      messageService
        .conversations()
        .then((d) => active && setUnread(d.totalUnread))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  }

  const items = NAV[user.role] || [];

  return (
    <div className={`dash ${collapsed ? 'is-collapsed' : ''}`}>
      <a href="#dash-main" className="skip-link">Skip to content</a>

      {mobileOpen && <div className="dash-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside id="dash-sidebar" className={`dash-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Dashboard navigation">
        <div className="dash-sidebar-top">
          <Logo light />
          <button type="button" className="dash-icon-btn dash-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="dash-nav">
          <ul>
            {items.map(({ to, label, icon: Icon, unread: showUnread }) => (
              <li key={to}>
                <NavLink to={to} className="dash-link" title={collapsed ? label : undefined}>
                  <Icon aria-hidden="true" />
                  <span className="dash-link-label">{label}</span>
                  {showUnread && unread > 0 && (
                    <span className="dash-count" aria-label={`${unread} unread`}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button type="button" className="dash-link" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
                <LogOut aria-hidden="true" />
                <span className="dash-link-label">Logout</span>
              </button>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="dash-collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
        >
          {collapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
          <span className="dash-link-label">Collapse</span>
        </button>
      </aside>

      <div className="dash-body">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-icon-btn dash-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="dash-sidebar"
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="dash-role">
            <GraduationCap aria-hidden="true" />
            {WORKSPACE[user.role]}
          </div>
          <div className="dash-user">
            <div className="dash-user-text">
              <span className="dash-user-name">{user.name}</span>
              <span className="dash-user-email">{user.email}</span>
            </div>
            <Avatar name={user.name} src={user.avatarUrl} size={36} />
          </div>
        </header>
        <main id="dash-main" className="dash-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
