import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffRegister from './pages/StaffRegister';
import TenantDashboard from './pages/TenantDashboard';
import ReportIssue from './pages/ReportIssue';
import ReviewIssue from './pages/ReviewIssue';
import Profile from './pages/Profile';
import StaffDashboard from './pages/StaffDashboard';
import StaffAvailability from './pages/StaffAvailability';
import StaffProfile from './pages/StaffProfile';
import StaffTaskDetail from './pages/StaffTaskDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminInProgressRepairs from './pages/AdminInProgressRepairs';
import AdminTaskAssignment from './pages/AdminTaskAssignment';
import AdminProperties from './pages/AdminProperties';
import AdminProfile from './pages/AdminProfile';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Footer from './components/Footer';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const hideQuickLinks = location.pathname === '/register-staff';
  const isStaffPage =
    location.pathname === '/staff-dashboard' ||
    location.pathname === '/staff/availability' ||
    location.pathname === '/staff/profile';
  const isAdminPage =
    location.pathname.startsWith('/admin') || location.pathname === '/admin-dashboard';
  const hideFooter = isHomePage;
  const footerRole = isAdminPage ? 'admin' : isStaffPage ? 'staff' : 'tenant';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-staff" element={<StaffRegister />} />
          <Route path="/tenant-dashboard" element={<TenantDashboard />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/report-issue" element={<ReportIssue />} />
          <Route path="/report-issue/review" element={<ReviewIssue />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/staff/availability" element={<StaffAvailability />} />
          <Route path="/staff/profile" element={<StaffProfile />} />
          <Route path="/staff/tasks/:id" element={<StaffTaskDetail />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/in-progress-repairs" element={<AdminInProgressRepairs />} />
          <Route path="/admin/staff-assignments" element={<AdminTaskAssignment />} />
          <Route path="/admin/properties" element={<AdminProperties />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Routes>
      </div>
      {!hideFooter && <Footer hideQuickLinks={hideQuickLinks} role={footerRole} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
