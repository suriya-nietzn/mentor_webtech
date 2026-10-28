import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { dashboardPath } from '../../utils/constants.js';
import './Layout.css';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/mentors', label: 'Find Mentors' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu after navigating, and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleLogout() {
    await logout();
    toast.success('You have been logged out');
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Logo />

        <button
          type="button"
          className="btn btn-ghost btn-icon navbar-toggle"
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav id="main-menu" className={`navbar-menu ${open ? 'is-open' : ''}`} aria-label="Main">
          <ul className="navbar-links">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="navbar-link">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="navbar-actions">
            {user ? (
              <>
                <Button to={dashboardPath(user.role)} variant="primary" size="sm">
                  <LayoutDashboard aria-hidden="true" /> Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut aria-hidden="true" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button to="/login" variant="outline" size="sm">
                  Login
                </Button>
                <Button to="/register" variant="cta" size="sm">
                  Register
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
