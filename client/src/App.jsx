import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import { ProtectedRoute, GuestRoute } from './components/layout/RouteGuards.jsx';
import { PageLoader } from './components/ui/States.jsx';

// Pages are loaded on demand so the first page load stays small.
const Home = lazy(() => import('./pages/public/Home.jsx'));
const FindMentors = lazy(() => import('./pages/public/FindMentors.jsx'));
const MentorProfile = lazy(() => import('./pages/public/MentorProfile.jsx'));
const About = lazy(() => import('./pages/public/About.jsx'));
const Contact = lazy(() => import('./pages/public/Contact.jsx'));
const Login = lazy(() => import('./pages/public/Login.jsx'));
const Register = lazy(() => import('./pages/public/Register.jsx'));
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard.jsx'));
const StudentMentorships = lazy(() => import('./pages/student/StudentMentorships.jsx'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile.jsx'));

const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard.jsx'));
const MentorProfileEdit = lazy(() => import('./pages/mentor/MentorProfileEdit.jsx'));
const MentorRequests = lazy(() => import('./pages/mentor/MentorRequests.jsx'));
const MentorStudents = lazy(() => import('./pages/mentor/MentorStudents.jsx'));
const MentorAvailability = lazy(() => import('./pages/mentor/MentorAvailability.jsx'));

// Shared by both roles (each role gets its own URL).
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));

const Sessions = lazy(() => import('./pages/shared/Sessions.jsx'));
const SessionDetails = lazy(() => import('./pages/shared/SessionDetails.jsx'));
const Messages = lazy(() => import('./pages/shared/Messages.jsx'));
const Settings = lazy(() => import('./pages/shared/Settings.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const guard = (role, element) => <ProtectedRoute role={role}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/mentors" element={<FindMentors />} />
            <Route path="/mentors/:id" element={<MentorProfile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/student" element={guard('student', <DashboardLayout />)}>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="mentorships" element={<StudentMentorships />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/:id" element={<SessionDetails />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<StudentDashboard />} />
            <Route path="*" element={<NotFound inDashboard />} />
          </Route>

          <Route path="/mentor" element={guard('mentor', <DashboardLayout />)}>
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="profile" element={<MentorProfileEdit />} />
            <Route path="requests" element={<MentorRequests />} />
            <Route path="students" element={<MentorStudents />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/:id" element={<SessionDetails />} />
            <Route path="messages" element={<Messages />} />
            <Route path="availability" element={<MentorAvailability />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<MentorDashboard />} />
            <Route path="*" element={<NotFound inDashboard />} />
          </Route>

          <Route path="/admin" element={guard('admin', <DashboardLayout />)}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminUsers role="student" />} />
            <Route path="mentors" element={<AdminUsers role="mentor" />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<AdminDashboard />} />
            <Route path="*" element={<NotFound inDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
