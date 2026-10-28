import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p className="footer-about">
            A college mentorship portal that connects students with experienced mentors for guidance on skills,
            projects and careers.
          </p>
        </div>
        <nav aria-label="Explore">
          <h2 className="footer-heading">Explore</h2>
          <ul>
            <li><Link to="/mentors">Find Mentors</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>
        <nav aria-label="Get started">
          <h2 className="footer-heading">Get started</h2>
          <ul>
            <li><Link to="/register">Join as a student</Link></li>
            <li><Link to="/register?role=mentor">Become a mentor</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="footer-heading">Contact</h2>
          {/* Placeholder contact details for the college project demo. */}
          <ul className="footer-contact">
            <li><MapPin aria-hidden="true" /> Department of Computer Science, Your College Campus</li>
            <li><Mail aria-hidden="true" /> <a href="mailto:support@example.com">support@example.com</a></li>
            <li><Phone aria-hidden="true" /> +91 00000 00000 (placeholder)</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} MentorConnect. A Web Technology college project.</p>
      </div>
    </footer>
  );
}
